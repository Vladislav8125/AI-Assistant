#!/usr/bin/env python3
"""Bulk site updates: menu label, logo alt, hero (via settings)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
LOGO_ALT = "Андреевский — На благо Родины с верой в душе"

for path in SITE.rglob("*.html"):
    text = path.read_text(encoding="utf-8")
    orig = text

    # Nav and footer menu only (avoid «программ помощи» in body)
    text = text.replace('class="header__nav-link">Программы</a>', 'class="header__nav-link">Проекты</a>')
    text = text.replace('class="footer__nav-link">Программы</a>', 'class="footer__nav-link">Проекты</a>')

    text = text.replace(
        'alt="Андреевский — С верой в душе на благо родины"',
        f'alt="{LOGO_ALT}"',
    )
    text = text.replace('class="header__logo-img" width="272" height="67"', 'class="header__logo-img"')
    text = text.replace('class="footer__logo-img" width="220" height="54"', 'class="footer__logo-img"')

    if path.name == "index.html" and path.parent == SITE:
        text = text.replace(
            '<title>Андреевский — С верой в душе на благо родины</title>',
            "<title>Андреевский — На благо Родины с верой в душе</title>",
        )
        text = text.replace(
            'id="hero-title">Поддерживаем тех, кто защищает Родину</h1>',
            'id="hero-title">На благо Родины с верой в душе</h1>',
        )

    if path == SITE / "initiatives" / "index.html":
        text = text.replace(">Программы</h1>", ">Проекты</h1>", 1)
        text = text.replace('page-banner__title">Программы', 'page-banner__title">Проекты')

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("updated", path.relative_to(ROOT))

gen = ROOT / "scripts" / "generate_pilgrimage_pages.py"
if gen.exists():
    g = gen.read_text(encoding="utf-8")
    g2 = g.replace('class="header__nav-link">Программы</a>', 'class="header__nav-link">Проекты</a>')
    g2 = g2.replace('class="footer__nav-link">Программы</a>', 'class="footer__nav-link">Проекты</a>')
    g2 = g2.replace(
        'alt="Андреевский — С верой в душе на благо родины"',
        f'alt="{LOGO_ALT}"',
    )
    g2 = g2.replace('class="header__logo-img" width="272" height="67"', 'class="header__logo-img"')
    g2 = g2.replace('class="footer__logo-img" width="220" height="54"', 'class="footer__logo-img"')
    if g2 != g:
        gen.write_text(g2, encoding="utf-8")
        print("updated generator")
