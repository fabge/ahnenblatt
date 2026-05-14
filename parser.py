"""Parser for Ahnenblatt .ahn binary format."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import re


@dataclass
class Person:
    id: str
    given: str = ""
    surname: str = ""
    sex: str = "U"  # M / F / U
    birth_date: str = ""
    birth_place: str = ""
    death_date: str = ""
    death_place: str = ""
    burial_date: str = ""
    burial_place: str = ""
    religion: str = ""
    occupation: str = ""
    notes: str = ""
    photo_title: str = ""  # used to find image in media dir
    fams: list[str] = field(default_factory=list)  # family IDs as spouse
    famc: list[str] = field(default_factory=list)  # family IDs as child

    @property
    def full_name(self) -> str:
        given = self.given if self.given and self.given not in ("...", ".....") else ""
        surname = self.surname if self.surname and self.surname not in ("...", "-----") else ""
        name = f"{given} {surname}".strip()
        return name or "Unbekannt"

    @property
    def short_life(self) -> str:
        """e.g. '1920 – 1985' or '* 1920'"""
        birth = _year(self.birth_date)
        death = _year(self.death_date)
        if birth and death:
            return f"{birth} – {death}"
        if birth:
            return f"* {birth}"
        if death:
            return f"† {death}"
        return ""


@dataclass
class Family:
    id: str
    husband_id: Optional[str] = None
    wife_id: Optional[str] = None
    children_ids: list[str] = field(default_factory=list)
    marriage_date: str = ""
    marriage_place: str = ""


def _year(date_str: str) -> str:
    if not date_str:
        return ""
    # try to find a 4-digit year
    m = re.search(r"\b(\d{4})\b", date_str)
    return m.group(1) if m else date_str.strip()


def _parse_flat_records(data: bytes) -> list[tuple[int, str, str]]:
    """Return flat list of (level, tag, value) tuples from binary .ahn file."""
    records: list[tuple[int, str, str]] = []
    i = 0

    start = data.find(b"\xbf\x01\x00\x00\xc0")
    if start == -1:
        return records
    i = start

    while i < len(data) - 4:
        if data[i] != 0xBF:
            i += 1
            continue
        if data[i + 1] != 0x01 or data[i + 2] != 0x00:
            i += 1
            continue

        level = data[i + 3]
        if level > 10:
            i += 1
            continue
        i += 4

        # Tag
        if i >= len(data) or data[i] != 0xC0:
            continue
        i += 1
        tag_len = int.from_bytes(data[i : i + 2], "little")
        i += 2
        if tag_len == 0 or i + tag_len > len(data):
            continue
        tag = data[i : i + tag_len - 1].decode("utf-8", errors="replace")
        i += tag_len

        # Value
        value = ""
        if i < len(data):
            vtype = data[i]
            if vtype in (0xC1, 0xC2):
                i += 1
                val_len = int.from_bytes(data[i : i + 2], "little")
                i += 2
                if val_len > 0 and i + val_len <= len(data):
                    value = data[i : i + val_len - 1].decode("utf-8", errors="replace")
                    i += val_len
            elif vtype == 0xC3:
                # Extended: \xc3 + 2-byte subtype + 2-byte metadata + 2-byte length + string
                i += 1 + 4  # skip type byte + 4 metadata bytes
                val_len = int.from_bytes(data[i : i + 2], "little")
                i += 2
                if val_len > 0 and i + val_len <= len(data):
                    value = data[i : i + val_len - 1].decode("utf-8", errors="replace")
                    i += val_len

        records.append((level, tag, value))

    return records


def parse(filepath: str) -> tuple[dict[str, Person], dict[str, Family]]:
    """Parse .ahn file and return (persons, families) dicts keyed by ID."""
    with open(filepath, "rb") as f:
        data = f.read()

    flat = _parse_flat_records(data)

    persons: dict[str, Person] = {}
    families: dict[str, Family] = {}

    # State machine: walk flat records, group by top-level record
    current_indi: Optional[Person] = None
    current_fam: Optional[Family] = None
    context: list[str] = []  # tag path at current depth e.g. ['BIRT']

    for level, tag, value in flat:
        # Trim context to current level
        context = context[:level]

        if level == 0:
            current_indi = None
            current_fam = None
            context = []

            if tag == "INDI":
                current_indi = Person(id=value)
                persons[value] = current_indi
            elif tag == "FAM":
                current_fam = Family(id=value)
                families[value] = current_fam
            continue

        # Build context path
        context.append(tag)
        ctx = context  # alias

        # --- Individual fields ---
        if current_indi is not None:
            if level == 1:
                if tag == "SEX":
                    current_indi.sex = value
                elif tag == "FAMS":
                    current_indi.fams.append(value)
                elif tag == "FAMC":
                    current_indi.famc.append(value)
                elif tag == "RELI":
                    current_indi.religion = value
                elif tag in ("OCCU", "_OCCU"):
                    current_indi.occupation = value
                elif tag == "NOTE":
                    current_indi.notes = value

            elif level == 2:
                parent_tag = ctx[level - 1] if len(ctx) >= level else ""
                if parent_tag == "NAME":
                    if tag == "GIVN":
                        current_indi.given = value
                    elif tag == "SURN":
                        current_indi.surname = value
                elif parent_tag == "BIRT":
                    if tag == "DATE":
                        current_indi.birth_date = value
                    elif tag == "PLAC":
                        current_indi.birth_place = value
                elif parent_tag == "DEAT":
                    if tag == "DATE":
                        current_indi.death_date = value
                    elif tag == "PLAC":
                        current_indi.death_place = value
                elif parent_tag == "BURI":
                    if tag == "DATE":
                        current_indi.burial_date = value
                    elif tag == "PLAC":
                        current_indi.burial_place = value
                elif parent_tag == "OBJE":
                    if tag == "TITL" and not current_indi.photo_title:
                        current_indi.photo_title = value

        # --- Family fields ---
        if current_fam is not None:
            if level == 1:
                if tag == "HUSB":
                    current_fam.husband_id = value
                elif tag == "WIFE":
                    current_fam.wife_id = value
                elif tag == "CHIL":
                    current_fam.children_ids.append(value)
            elif level == 2:
                parent_tag = ctx[level - 1] if len(ctx) >= level else ""
                if parent_tag == "MARR":
                    if tag == "DATE":
                        current_fam.marriage_date = value
                    elif tag == "PLAC":
                        current_fam.marriage_place = value

    return persons, families
