"""Ahnenblatt family tree web viewer."""

from __future__ import annotations
import os
import json
from flask import Flask, render_template, request, jsonify, abort
from parser import parse, Person, Family

AHN_FILE = os.path.join(os.path.dirname(__file__), "stammbaum.ahn")
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "stammbaum Media")
PORTRAIT_DIR = os.path.join(os.path.dirname(__file__), "Portrai")

app = Flask(__name__)

# Load data once at startup
persons, families = parse(AHN_FILE)

# Build reverse index: person_id → family where they are spouse
# (already on Person.fams) and child (Person.famc)


def get_person_or_404(pid: str) -> Person:
    p = persons.get(pid)
    if p is None:
        abort(404)
    return p


def family_dict(fam: Family) -> dict:
    """Serialize a family to a plain dict."""
    husband = persons.get(fam.husband_id) if fam.husband_id else None
    wife = persons.get(fam.wife_id) if fam.wife_id else None
    children = [persons[cid] for cid in fam.children_ids if cid in persons]
    return {
        "id": fam.id,
        "husband": person_dict(husband) if husband else None,
        "wife": person_dict(wife) if wife else None,
        "children": [person_dict(c) for c in children],
        "marriage_date": fam.marriage_date,
        "marriage_place": fam.marriage_place,
    }


def person_dict(p: Person) -> dict:
    return {
        "id": p.id,
        "full_name": p.full_name,
        "given": p.given,
        "surname": p.surname,
        "sex": p.sex,
        "birth_date": p.birth_date,
        "birth_place": p.birth_place,
        "death_date": p.death_date,
        "death_place": p.death_place,
        "burial_date": p.burial_date,
        "burial_place": p.burial_place,
        "religion": p.religion,
        "occupation": p.occupation,
        "notes": p.notes,
        "photo_title": p.photo_title,
        "short_life": p.short_life,
        "fams": p.fams,
        "famc": p.famc,
    }


@app.route("/")
def index():
    total = len(persons)
    # Build surname list for quick stats
    surnames = {}
    for p in persons.values():
        if p.surname and p.surname not in ("...", "-----"):
            surnames[p.surname] = surnames.get(p.surname, 0) + 1
    top_surnames = sorted(surnames.items(), key=lambda x: -x[1])[:10]
    return render_template("index.html", total=total, top_surnames=top_surnames)


@app.route("/people")
def people_list():
    query = request.args.get("q", "").strip().lower()
    sex_filter = request.args.get("sex", "")
    results = []
    for p in persons.values():
        if query and query not in p.full_name.lower():
            continue
        if sex_filter and p.sex != sex_filter:
            continue
        results.append(p)
    results.sort(key=lambda p: (p.surname.lower(), p.given.lower()))
    return render_template("people.html", people=results, query=query, sex_filter=sex_filter)


@app.route("/person/<path:pid>")
def person_detail(pid: str):
    pid = "@" + pid.strip("@") + "@"
    p = get_person_or_404(pid)

    # Parents: from famc families
    parents = []
    siblings = []
    for fid in p.famc:
        fam = families.get(fid)
        if fam:
            if fam.husband_id and fam.husband_id in persons:
                parents.append(persons[fam.husband_id])
            if fam.wife_id and fam.wife_id in persons:
                parents.append(persons[fam.wife_id])
            for cid in fam.children_ids:
                if cid != pid and cid in persons:
                    siblings.append(persons[cid])

    # Spouses and children: from fams families
    spouse_families = []
    for fid in p.fams:
        fam = families.get(fid)
        if fam:
            spouse_id = fam.wife_id if p.id == fam.husband_id else fam.husband_id
            spouse = persons.get(spouse_id) if spouse_id else None
            children = [persons[cid] for cid in fam.children_ids if cid in persons]
            spouse_families.append({
                "family": fam,
                "spouse": spouse,
                "children": children,
            })

    return render_template(
        "person.html",
        person=p,
        parents=parents,
        siblings=siblings,
        spouse_families=spouse_families,
    )


@app.route("/tree/<path:pid>")
def tree_view(pid: str):
    pid = "@" + pid.strip("@") + "@"
    p = get_person_or_404(pid)
    return render_template("tree.html", person=p)


@app.route("/api/ancestors/<path:pid>")
def api_ancestors(pid: str):
    """Return ancestor tree data for the given person (up to N generations)."""
    pid = "@" + pid.strip("@") + "@"
    max_gen = int(request.args.get("gen", 5))

    def build_ancestors(person_id: str, generation: int) -> dict | None:
        if generation > max_gen or person_id not in persons:
            return None
        p = persons[person_id]
        node = {
            "id": p.id,
            "name": p.full_name,
            "sex": p.sex,
            "birth_date": p.birth_date,
            "death_date": p.death_date,
            "short_life": p.short_life,
            "generation": generation,
            "father": None,
            "mother": None,
        }
        for fid in p.famc:
            fam = families.get(fid)
            if fam:
                if fam.husband_id:
                    node["father"] = build_ancestors(fam.husband_id, generation + 1)
                if fam.wife_id:
                    node["mother"] = build_ancestors(fam.wife_id, generation + 1)
                break  # Only first family as child
        return node

    tree = build_ancestors(pid, 1)
    return jsonify(tree)


@app.route("/api/descendants/<path:pid>")
def api_descendants(pid: str):
    """Return descendant tree data for the given person."""
    pid = "@" + pid.strip("@") + "@"
    max_gen = int(request.args.get("gen", 4))

    def build_descendants(person_id: str, generation: int) -> dict | None:
        if generation > max_gen or person_id not in persons:
            return None
        p = persons[person_id]
        node = {
            "id": p.id,
            "name": p.full_name,
            "sex": p.sex,
            "birth_date": p.birth_date,
            "death_date": p.death_date,
            "short_life": p.short_life,
            "generation": generation,
            "children": [],
        }
        for fid in p.fams:
            fam = families.get(fid)
            if fam:
                for cid in fam.children_ids:
                    child_node = build_descendants(cid, generation + 1)
                    if child_node:
                        node["children"].append(child_node)
        return node

    tree = build_descendants(pid, 1)
    return jsonify(tree)


@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip().lower()
    if len(q) < 2:
        return jsonify([])
    results = []
    for p in persons.values():
        if q in p.full_name.lower():
            results.append({
                "id": p.id,
                "name": p.full_name,
                "short_life": p.short_life,
                "sex": p.sex,
            })
    results.sort(key=lambda x: x["name"])
    return jsonify(results[:30])


@app.route("/families")
def families_list():
    fam_list = []
    for fam in families.values():
        husband = persons.get(fam.husband_id) if fam.husband_id else None
        wife = persons.get(fam.wife_id) if fam.wife_id else None
        fam_list.append({
            "id": fam.id,
            "husband": husband,
            "wife": wife,
            "marriage_date": fam.marriage_date,
            "marriage_place": fam.marriage_place,
            "num_children": len(fam.children_ids),
        })
    fam_list.sort(key=lambda f: (
        (f["husband"].surname if f["husband"] and f["husband"].surname not in ("...", "-----") else "zzz"),
        (f["husband"].given if f["husband"] else "")
    ))
    return render_template("families.html", families=fam_list)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
