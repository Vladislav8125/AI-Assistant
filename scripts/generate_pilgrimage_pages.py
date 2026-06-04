#!/usr/bin/env python3
"""Regenerate pilgrimage HTML from site/data/pilgrimage-trips.json."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "site" / "data" / "pilgrimage-trips.json"
SITE = ROOT / "site" / "pilgrimage"
PREFIX = "/AI-Assistant"

FOOTER = """
  <footer class="footer">
    <div class="container">
      <div class="footer__nav">
        <a href="{p}/initiatives/" class="footer__nav-link">Программы</a>
        <a href="{p}/news/" class="footer__nav-link">Новости</a>
        <a href="{p}/about/" class="footer__nav-link">О нас</a>
        <a href="{p}/contacts/" class="footer__nav-link">Контакты</a>
        <a href="{p}/privacy-police/" class="footer__nav-link">Политика конфиденциальности</a>
        <a href="{p}/public-offer/" class="footer__nav-link">Публичная оферта</a>
      </div>
      <div class="footer__logo">
        <img src="{p}/images/logo-andreevskiy.png" alt="Андреевский" class="footer__logo-img" width="220" height="54">
      </div>
      <div class="footer__contacts">
        <div class="footer__social">
          <a href="https://t.me/bf_andreevsky" class="footer__social-icon" target="_blank" rel="noopener noreferrer" aria-label="Telegram">TG</a>
          <a href="https://vk.ru/club238394053" class="footer__social-icon" target="_blank" rel="noopener noreferrer" aria-label="ВКонтакте">VK</a>
        </div>
        <a href="mailto:info@andreevsky.ru" class="footer__contact-link">info@andreevsky.ru</a>
        <a href="tel:+79110501124" class="footer__contact-link">+7 (911) 050-11-24</a>
      </div>
    </div>
  </footer>

  <div class="cookie-banner" id="cookieBanner">
    <div class="cookie-banner__inner">
      <div>
        <div class="cookie-banner__title">Этот сайт использует cookie!</div>
        <div class="cookie-banner__text">Продолжая просматривать сайт, вы соглашаетесь на использование cookie в соответствии с политикой.</div>
      </div>
      <button type="button" class="cookie-banner__btn">Принять и закрыть</button>
    </div>
  </div>
  <script src="{p}/js/site.js"></script>
""".format(
    p=PREFIX
)


def head(title: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)}</title>
  <link rel="stylesheet" href="{PREFIX}/css/style.css">
</head>
<body>
  <div class="header-bar">
    <div class="container">
      <header class="header">
      <a href="{PREFIX}/" class="header__logo">
        <img src="{PREFIX}/images/logo-andreevskiy.png" alt="Андреевский — С верой в душе на благо родины" class="header__logo-img" width="272" height="67">
      </a>
      <nav class="header__nav" id="nav">
        <a href="{PREFIX}/initiatives/" class="header__nav-link">Программы</a>
        <a href="{PREFIX}/news/" class="header__nav-link">Новости</a>
        <a href="{PREFIX}/about/" class="header__nav-link">О нас</a>
        <a href="{PREFIX}/contacts/" class="header__nav-link">Контакты</a>
      </nav>
      <div class="header__right">
        <a href="{PREFIX}/donate/" class="header__ewa-btn">Пожертвовать</a>
      </div>
      <div class="mobile-menu-toggle" onclick="document.getElementById('nav').classList.toggle('open')">
        <span></span><span></span><span></span>
      </div>
    </header>
    </div>
  </div>
"""


def dedupe_places(places: list) -> list:
    seen = set()
    out = []
    for p in places:
        key = (p["lat"], p["lon"], p["name"])
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "name": p["name"],
                "address": p["address"],
                "lat": p["lat"],
                "lon": p["lon"],
            }
        )
    return out


def map_block(places: list, map_id: str = "pilgrimage-map") -> str:
    payload = html.escape(
        json.dumps(dedupe_places(places), ensure_ascii=False), quote=True
    )
    return f"""      <h2 class="pilgrimage-map__title">Карта святынь программы</h2>
      <div id="{map_id}" class="pilgrimage-map-unified" data-pilgrimage-map data-places="{payload}"></div>
"""


def place_cards(places: list) -> str:
    parts = ['      <div class="pilgrimage-places">']
    for p in places:
        parts.append(
            f"""        <div class="pilgrimage-place">
          <h3 class="pilgrimage-place__title">{html.escape(p["name"])}</h3>
          <p class="pilgrimage-place__address">{html.escape(p["address"])}</p>
        </div>"""
        )
    parts.append("      </div>")
    return "\n".join(parts)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    all_places = data["allPlaces"]
    intro = data["intro"]

    # Overview
    items_html = []
    for item in data["items"]:
        desc = f"{html.escape(item['line1'])}<br>{html.escape(item['line2'])}"
        items_html.append(
            f"""        <article class="pilgrimage-item">
            <h3 class="pilgrimage-item__title">{html.escape(item["title"])}</h3>
            <p class="pilgrimage-item__desc">{desc}</p>
            <a href="{PREFIX}/pilgrimage/{item['id']}/" class="pilgrimage-item__link">Страница поездки</a>
          </article>"""
        )

    overview = (
        head("Паломнические поездки «Дороги Веры» — Андреевский")
        + f"""
  <div class="container">
    <a href="{PREFIX}/" class="donate-page__back">← на главную</a>
    <article class="section">
      <h1 class="section__title" style="text-align:left;">Паломнические поездки «Дороги Веры»</h1>
      <p class="pilgrimage-overview__intro modal__text">{html.escape(intro)}</p>
"""
        + map_block(all_places)
        + """
      <div class="pilgrimage-list">
"""
        + "\n".join(items_html)
        + """
      </div>
    </article>
  </div>
"""
        + FOOTER
        + f'  <script src="{PREFIX}/js/pilgrimage-map.js"></script>\n</body>\n</html>\n'
    )
    (SITE / "index.html").write_text(overview, encoding="utf-8")

    for item in data["items"]:
        trip_id = item["id"]
        title = item["title"]
        line1 = html.escape(item["line1"])
        line2 = html.escape(item["line2"])
        page = (
            head(f"{title} — Дороги Веры")
            + f"""
  <div class="container">
    <a href="{PREFIX}/pilgrimage/" class="donate-page__back">← все поездки</a>
    <article class="section pilgrimage-trip">
      <h1 class="section__title pilgrimage-trip__heading">{html.escape(title)}</h1>
      <div class="pilgrimage-trip__intro modal__text">
        <p>{line1} {line2}</p>
        <p>На карте ниже — все геоточки программы «Дороги Веры». Ниже перечислены святыни этой поездки. Для записи: <a href="mailto:info@andreevsky.ru">info@andreevsky.ru</a>.</p>
      </div>
"""
            + map_block(all_places, map_id=f"pilgrimage-map-{trip_id}")
            + "\n"
            + place_cards(item["places"])
            + f"""
      <p class="pilgrimage-trip__cta"><a href="{PREFIX}/donate/" class="btn btn--solid">Поддержать проект</a></p>
    </article>
  </div>
"""
            + FOOTER
            + f'  <script src="{PREFIX}/js/pilgrimage-map.js"></script>\n</body>\n</html>\n'
        )
        (SITE / str(trip_id) / "index.html").write_text(page, encoding="utf-8")
        print(f"Wrote pilgrimage/{trip_id}/index.html")

    print("Wrote pilgrimage/index.html")


if __name__ == "__main__":
    main()
