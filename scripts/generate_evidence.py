"""Generate sanitized portfolio screenshots and an animated walkthrough."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"
MONO = "/System/Library/Fonts/Menlo.ttc"
SIZE = (1400, 850)


def font(path, size):
    return ImageFont.truetype(path, size)


def base(step, title, subtitle):
    image = Image.new("RGB", SIZE, "#07111f")
    draw = ImageDraw.Draw(image)
    draw.text((80, 55), "NEWSFLOW  /  RSS → LLM → REVIEW", font=font(SANS, 15), fill="#57dbc4")
    draw.text((80, 95), title, font=font(SANS, 42), fill="#edf4fb")
    draw.text((80, 150), subtitle, font=font(SANS, 19), fill="#91a7bc")
    for index, label in enumerate(("INGEST", "STRUCTURE", "APPROVE"), 1):
        x = 900 + (index - 1) * 135
        active = index <= step
        draw.rounded_rectangle((x, 65, x + 112, 102), radius=18, fill="#17463f" if active else "#122235")
        draw.text((x + 56, 84), f"{index}  {label}", anchor="mm", font=font(SANS, 11), fill="#83e1d0" if active else "#688097")
    return image, draw


def panel(draw, box, heading):
    draw.rounded_rectangle(box, radius=18, fill="#0d1b2d", outline="#29425b", width=2)
    draw.text((box[0] + 28, box[1] + 25), heading, font=font(SANS, 14), fill="#57dbc4")


def rss_scene():
    image, draw = base(1, "Sanitized RSS input", "Feed fetched, validated, and normalized before any model call.")
    panel(draw, (80, 215, 1320, 735), "INPUT  ·  fixtures/sample-feed.xml")
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0">', '  <channel>',
        '    <title>City Technology News</title>', '    <item>',
        '      <guid>city-tech-2026-042</guid>',
        '      <title>City launches electric bus network</title>',
        '      <link>https://example.com/news/electric-buses?utm_source=rss</link>',
        '      <description>The city launched 40 electric buses today...</description>',
        '    </item>', '  </channel>', '</rss>',
    ]
    for i, line in enumerate(lines):
        color = "#57dbc4" if '<title>' in line or '<guid>' in line else "#c5d1df"
        draw.text((120, 275 + i * 34), line, font=font(MONO, 17), fill=color)
    draw.rounded_rectangle((1005, 670, 1285, 712), radius=21, fill="#153c36")
    draw.text((1145, 691), "✓ VALID RSS · 1 ARTICLE", anchor="mm", font=font(SANS, 13), fill="#8ce6d6")
    return image


def summary_scene():
    image, draw = base(2, "Schema-valid AI summary", "Structured fields keep downstream formatting predictable and testable.")
    panel(draw, (80, 215, 1320, 735), "STRUCTURED OUTPUT  ·  JSON SCHEMA VALIDATED")
    lines = [
        '{', '  "headline": "City launches 40-bus electric transit network",',
        '  "summary": "The city introduced 40 electric buses as part of a plan',
        '    to reduce transport emissions and lower operating costs.",',
        '  "keyPoints": [', '    "The initial fleet contains 40 electric buses.",',
        '    "Officials expect lower emissions and operating costs."', '  ],',
        '  "topics": ["clean transport", "cities", "technology"],',
        '  "riskFlags": []', '}',
    ]
    for i, line in enumerate(lines):
        color = "#57dbc4" if any(key in line for key in ('headline', 'summary', 'topics', 'riskFlags')) else "#c5d1df"
        draw.text((120, 280 + i * 37), line, font=font(MONO, 17), fill=color)
    draw.rounded_rectangle((1020, 670, 1285, 712), radius=21, fill="#153c36")
    draw.text((1152, 691), "✓ 5 REQUIRED FIELDS", anchor="mm", font=font(SANS, 13), fill="#8ce6d6")
    return image


def output_scene():
    image, draw = base(3, "Formatted output, waiting for approval", "Content stops at the human review boundary—never silently published.")
    panel(draw, (80, 215, 760, 735), "PUBLISHING PREVIEW")
    draw.text((120, 285), "City launches 40-bus electric", font=font(SANS, 27), fill="#edf4fb")
    draw.text((120, 322), "transit network", font=font(SANS, 27), fill="#edf4fb")
    summary = ["The city introduced 40 electric buses as part", "of a plan to reduce transport emissions and", "lower operating costs."]
    for i, line in enumerate(summary): draw.text((120, 390 + i * 31), line, font=font(SANS, 18), fill="#adbdce")
    draw.text((120, 515), "example.com/news/electric-buses", font=font(SANS, 16), fill="#64d9c5")
    draw.text((120, 555), "#cleantransport   #cities", font=font(SANS, 16), fill="#89a8c2")
    panel(draw, (790, 215, 1320, 735), "REVIEW GATE")
    draw.rounded_rectangle((830, 285, 1280, 345), radius=12, fill="#13283e")
    draw.text((855, 306), "STATUS", font=font(SANS, 11), fill="#8096ad")
    draw.text((855, 327), "Awaiting explicit user approval", font=font(SANS, 17), fill="#f2c274")
    bullets = ["[PASS]  Source link preserved", "[PASS]  Schema validated", "[PASS]  Duplicate fingerprint stored", "[PASS]  Risk flags visible", "[LOCKED]  No external request sent"]
    for i, line in enumerate(bullets): draw.text((845, 390 + i * 45), line, font=font(SANS, 17), fill="#b8c8d8" if i < 4 else "#76dec9")
    draw.rounded_rectangle((920, 645, 1255, 700), radius=12, fill="#57dbc4")
    draw.text((1088, 672), "APPROVE FOR PUBLISHING", anchor="mm", font=font(SANS, 14), fill="#05231f")
    return image


DOCS.mkdir(exist_ok=True)
scenes = [("rss-input.png", rss_scene()), ("structured-summary.png", summary_scene()), ("formatted-output.png", output_scene())]
for name, image in scenes:
    image.save(DOCS / name, optimize=True)

frames = []
for _, image in scenes:
    frames.extend([image] * 4)
frames[0].save(DOCS / "upwork-demo.gif", save_all=True, append_images=frames[1:], duration=550, loop=0, optimize=True)
print("\n".join(str(DOCS / name) for name, _ in scenes))
print(DOCS / "upwork-demo.gif")
