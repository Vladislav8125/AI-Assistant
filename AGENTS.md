# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS charity website (ewahelps.com copy) with no build tools, package managers, or runtime dependencies.

### Project structure

- `site/` — root of the website
  - `site/index.html` — homepage
  - `site/css/style.css` — shared stylesheet
  - `site/about/`, `site/initiatives/`, `site/news/`, `site/reports/`, `site/contacts/`, `site/donate/`, `site/privacy-police/`, `site/public-offer/` — subpages

### Running the site

Serve from the `site/` directory:

```bash
cd /workspace/site && python3 -m http.server 8080
```

Then access at `http://localhost:8080`. Subpages use `../css/style.css` for CSS paths; the homepage uses `css/style.css`.

### Key conventions

- All subpages share the same header, footer, and cookie banner from the homepage.
- Active nav links use the `active` class on `header__nav-link`.
- The donate, privacy-police, and public-offer pages have no active nav link (they aren't in the main nav).
- No linting, testing, or build steps exist — validation is done by serving and checking pages load with HTTP 200.
