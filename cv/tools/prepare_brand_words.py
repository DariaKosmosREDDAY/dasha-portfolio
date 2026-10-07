"""Export generated standalone brand words for the existing CV marquee.

This only resizes/encodes the approved cutouts; it never draws or edits them.
Usage: python cv/tools/prepare_brand_words.py /path/to/source-map.json
Use --markup-only to refresh the SVG viewports without re-encoding the assets.
"""
from pathlib import Path
from PIL import Image
import json
import re
import sys

root = Path(__file__).resolve().parents[2]
sources = json.loads(Path(sys.argv[1]).read_text())
markup_only = '--markup-only' in sys.argv[2:]
html_path = root / 'cv/index.html'
html = html_path.read_text()
section_pattern = r'<section class="cv-brand-marquee".*?</section>'
section = re.search(section_pattern, html).group(0)
slugs = list(dict.fromkeys(re.findall(r'/assets/cv-brand-sculptures/([a-z-]+)\.webp', section)))
assert set(slugs) == set(sources), 'The source map must contain all existing brands, exactly once.'
output = root / 'assets/cv-brand-sculptures'
for slug in slugs:
    if not markup_only:
        image = Image.open(sources[slug]).convert('RGBA')
        assert image.getchannel('A').getextrema()[0] == 0, f'{slug}: transparent background required'
        image.thumbnail((1280, 512), Image.Resampling.LANCZOS)
        image.save(output / f'{slug}.webp', quality=95, method=6, exact=True)
    image = Image.open(output / f'{slug}.webp').convert('RGBA')
    width, height = image.size
    # Ignore empty transparent export margins in the rendering viewport only.
    # The original bitmap stays intact, including its alpha and reflections.
    left, top, right, bottom = image.getchannel('A').point(lambda value: 255 if value >= 32 else 0).getbbox()
    padding = max(12, round((bottom - top) * .08))
    left, top = max(0, left - padding), max(0, top - padding)
    right, bottom = min(width, right + padding), min(height, bottom + padding)
    view_box = f'{left} {top} {right - left} {bottom - top}'
    asset = f'/assets/cv-brand-sculptures/{slug}.webp?v=standalone-20261007'
    pattern = (
        rf'<img class="cv-brand-sculpture" src="/assets/cv-brand-sculptures/{slug}\.webp(?:\?[^\"]*)?"[^>]*>'
        rf'|<svg class="cv-brand-sculpture"[^>]*><image href="/assets/cv-brand-sculptures/{slug}\.webp(?:\?[^\"]*)?"[^>]*></image></svg>'
    )
    replacement = (
        f'<svg class="cv-brand-sculpture" viewBox="{view_box}" aria-hidden="true" focusable="false">'
        f'<image href="{asset}" width="{width}" height="{height}"></image></svg>'
    )
    section, count = re.subn(pattern, replacement, section)
    assert count == 2, f'{slug}: both identical loop groups must use the same asset'
    print(slug, image.size, (output / f'{slug}.webp').stat().st_size, flush=True)
html_path.write_text(re.sub(section_pattern, lambda _: section, html, count=1))
