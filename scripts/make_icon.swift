#!/usr/bin/env swift
// Renders Assets.xcassets/AppIcon.appiconset/icon-1024.png — same tree.fill SF
// Symbol the welcome screen uses, over a green gradient. Run from repo root:
//   swift scripts/make_icon.swift
//
// lockFocus renders at backing scale (2x on retina) and keeps alpha — we then
// run a quick Python pass to resize to 1024×1024 and strip alpha, which the
// iOS asset catalog requires.

import AppKit
import Foundation

let size = NSSize(width: 1024, height: 1024)
let img = NSImage(size: size)
img.lockFocus()

NSGradient(colors: [
    NSColor(red: 0.20, green: 0.45, blue: 0.36, alpha: 1),
    NSColor(red: 0.10, green: 0.23, blue: 0.22, alpha: 1)
])!.draw(in: NSRect(origin: .zero, size: size), angle: -90)

let cfg = NSImage.SymbolConfiguration(pointSize: 620, weight: .regular)
guard let tree = NSImage(systemSymbolName: "tree.fill", accessibilityDescription: nil)?
        .withSymbolConfiguration(cfg) else {
    fputs("tree.fill not available on this macOS\n", stderr); exit(1)
}

let tinted = NSImage(size: tree.size)
tinted.lockFocus()
let r = NSRect(origin: .zero, size: tree.size)
tree.draw(in: r)
NSColor(red: 0.74, green: 0.88, blue: 0.62, alpha: 1).set()
r.fill(using: .sourceAtop)
tinted.unlockFocus()

tinted.draw(in: NSRect(
    x: (size.width  - tinted.size.width)  / 2,
    y: (size.height - tinted.size.height) / 2,
    width:  tinted.size.width,
    height: tinted.size.height
))
img.unlockFocus()

guard let tiff = img.tiffRepresentation,
      let rep  = NSBitmapImageRep(data: tiff),
      let png  = rep.representation(using: .png, properties: [:])
else { fputs("PNG encode failed\n", stderr); exit(1) }

let out = "Stammbaum/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
try png.write(to: URL(fileURLWithPath: out))

// Resize to exactly 1024×1024 and strip alpha (iOS asset catalog requirement).
let proc = Process()
proc.executableURL = URL(fileURLWithPath: "/usr/bin/env")
proc.arguments = ["python3", "-c", """
from PIL import Image
Image.open('\(out)').convert('RGB').resize((1024,1024), Image.LANCZOS).save('\(out)')
"""]
try proc.run()
proc.waitUntilExit()
print("wrote \(out)")
