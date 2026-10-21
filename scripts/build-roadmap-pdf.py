"""Rebuild public/downloads/lamportpay-roadmap.pdf from src/content/roadmap-tracker.ts.

Run from the repo root after changing the tracker:
    node --experimental-strip-types -e "import('./src/content/roadmap-tracker.ts').then(m=>console.log(JSON.stringify(m.TRACKER_PHASES)))" > /tmp/tracker.json
    python3 scripts/build-roadmap-pdf.py /tmp/tracker.json
Requires: pip install reportlab
"""
import json, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

BRAND, INK, MUTED = HexColor("#4f46e5"), HexColor("#111827"), HexColor("#6b7280")
DONE, OPEN, CURRENT = HexColor("#22c55e"), HexColor("#d1d5db"), HexColor("#4f46e5")
LABEL = {"done": "Done", "current": "In progress", "planned": "Planned"}

phases = json.load(open(sys.argv[1]))
out = sys.argv[2] if len(sys.argv) > 2 else "public/downloads/lamportpay-roadmap.pdf"
W, H = A4
c = canvas.Canvas(out, pagesize=A4)
c.setTitle("LamportPay - Phase-by-phase roadmap")
c.setAuthor("Lamport Pay Ltd")

done = sum(p["status"] == "done" for p in phases)
cur = next((p for p in phases if p["status"] == "current"), None)
c.setFillColor(BRAND); c.rect(0, H - 120, W, 120, fill=1, stroke=0)
c.setFillColor(HexColor("#ffffff")); c.setFont("Helvetica-Bold", 22)
c.drawString(48, H - 55, "LamportPay - Phase-by-phase roadmap")
c.setFont("Helvetica", 10); c.drawString(48, H - 75, "Crypto in. Local money out.")
status = f"{done} of {len(phases)} phases done"
if cur: status += f" - Phase {cur['phase']} in progress: {cur['title']}"
c.drawString(48, H - 92, status)

y = H - 150
def need(h):
    global y
    if y - h < 60:
        c.showPage(); y = H - 60

for p in phases:
    need(40 + 13 * len(p["items"]))
    col = BRAND if p["status"] != "planned" else INK
    c.setFillColor(col); c.setFont("Helvetica-Bold", 12.5)
    title = f"Phase {p['phase']} - {p['title']}"
    c.drawString(48, y, title)
    tw = c.stringWidth(title, "Helvetica-Bold", 12.5)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DONE if p["status"] == "done" else CURRENT if p["status"] == "current" else MUTED)
    c.drawString(48 + tw + 6, y + 1, LABEL[p["status"]])
    y -= 14
    c.setFillColor(MUTED); c.setFont("Helvetica-Oblique", 8)
    c.drawString(48, y, p["summary"][:150]); y -= 13
    for it in p["items"]:
        c.setFillColor(DONE if it["done"] else OPEN); c.rect(52, y - 2, 2.5, 10, fill=1, stroke=0)
        c.setFillColor(INK if it["done"] else MUTED); c.setFont("Helvetica", 8.5)
        c.drawString(60, y, it["label"]); y -= 12.5
    y -= 8

need(30)
c.setFillColor(MUTED); c.setFont("Helvetica-Oblique", 7.5)
c.drawString(48, y, "Green = done, grey = open. Planned phases are goals, not confirmed partnerships or live features. No delivery dates are committed.")
c.save()
print("wrote", out)
