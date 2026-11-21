"""Assemble carousel.pdf from the seven images in images/.

Each page is 1920x1200 px: a caption band (number, title, one line of detail)
above the screenshot, which is scaled to fit and centered. Run from any
directory: python build_carousel.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
W, H = 1920, 1200
BAND = 170
MARGIN = 40
BG = (255, 255, 255)
FG = (24, 28, 38)
MUTED = (92, 99, 112)
ACCENT = (64, 72, 168)
FONTS = Path("C:/Windows/Fonts")

PAGES = [
    ("1_details_with_links.png", "Source references are links",
     "The Provenance tab lists every reference that bears on an atom: its extraction, its transitions, its origin locators."),
    ("2_provenance_source_link.png", "One click opens the source",
     "The verbatim excerpt, its ni: reference, and its location in the store."),
    ("3_details_with_list_and_popup.png", "Connections",
     "Every connected atom, in both directions, grouped by edge kind. \u201cPop out graph\u201d opens the graph around it."),
    ("4_graph_konspekt_depth2.png", "konspekt: depth two around one task",
     "27 of 337 atoms: the task, its goal, the two releases that shipped it, and the goal's other tasks."),
    ("5_graph_konspekt_full.png", "konspekt: the whole graph",
     "337 atoms, 529 edges."),
    ("6_graph_cdm_depth2.png", "CDM Collateral: depth two around its development goal",
     "104 of 274 atoms \u00b7 github.com/finos-hack/cdm-collateral"),
    ("7_graph_cdm_full.png", "CDM Collateral: the whole graph",
     "274 atoms, 442 edges."),
]


def main() -> None:
    title_font = ImageFont.truetype(str(FONTS / "segoeuib.ttf"), 54)
    body_font = ImageFont.truetype(str(FONTS / "segoeui.ttf"), 32)
    num_font = ImageFont.truetype(str(FONTS / "segoeuib.ttf"), 54)
    pages = []
    for i, (name, title, detail) in enumerate(PAGES, start=1):
        page = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(page)
        num = f"{i}/{len(PAGES)}"
        d.text((MARGIN, 36), num, font=num_font, fill=ACCENT)
        x = MARGIN + d.textlength(num, font=num_font) + 28
        d.text((x, 36), title, font=title_font, fill=FG)
        d.text((x, 108), detail, font=body_font, fill=MUTED)
        shot = Image.open(HERE / "images" / name).convert("RGB")
        box_w, box_h = W - 2 * MARGIN, H - BAND - MARGIN
        scale = min(box_w / shot.width, box_h / shot.height)
        shot = shot.resize((round(shot.width * scale), round(shot.height * scale)), Image.LANCZOS)
        sx = (W - shot.width) // 2
        sy = BAND + (box_h - shot.height) // 2
        d.rectangle((sx - 1, sy - 1, sx + shot.width, sy + shot.height), outline=(210, 214, 222))
        page.paste(shot, (sx, sy))
        pages.append(page)
    out = HERE / "carousel.pdf"
    pages[0].save(out, save_all=True, append_images=pages[1:], resolution=144, quality=92)
    print(out, out.stat().st_size)


if __name__ == "__main__":
    main()
