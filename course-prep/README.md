# Course prep sites

Static study sites, each deployed by its own Netlify site from this repo:

| Folder | Live URL |
| --- | --- |
| `prep/` | https://prep.aniketc.tech (hub linking every prep site) |
| `ds4400/` | https://ds4400.aniketc.tech |
| `cs3000/` | https://cs3000.aniketc.tech |

Each folder is a Netlify base directory with its own `netlify.toml`, `_headers` and `_redirects`. There is no build step: push changes to `main` and the matching site redeploys. A site only rebuilds when its own folder changes, and the main portfolio build (Vite, `dist/`) ignores this folder.

To add a new prep page, put it under the course folder (e.g. `ds4400/quiz-6/index.html`) and add a card for it in `prep/index.html`.

Keep personal data (grades, email addresses, local paths) and course PDFs out of these folders. This repo is public.
