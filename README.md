# Apex Meca — Portfolio Site

Mechanical CAD/CAM Designer & 3D Specialist portfolio for **Haytam Sallahi / Apex Meca (AXM)**.
Vite + vanilla JS (ES modules) + Tailwind CSS + Three.js + GSAP/Lenis + Supabase.

## 1. Install

```bash
npm install
cp .env.example .env
# then edit .env with your Supabase URL + anon key
npm run dev
```

Open the printed local URL for the public site, and `/admin.html` for the dashboard.

## 2. Supabase setup

1. Create a project at supabase.com.
2. Open **SQL Editor** and run `supabase/schema.sql` in full. It creates:
   - `portfolio_items` table (public read, authenticated write)
   - `contact_messages` table (public insert, authenticated read)
   - a public `portfolio` storage bucket + policies for image uploads
3. Open **Authentication > Users > Add user** and create the admin login
   (e.g. `sallahi.haytam.officiel@gmail.com` + a strong password). Leave
   public sign-ups disabled — this project has exactly one admin account.
4. Copy **Project Settings > API > Project URL** and **anon public key**
   into `.env`.

## 3. Build & deploy

```bash
npm run build   # outputs dist/ with index.html + admin.html
npm run preview # sanity-check the production build locally
```

`dist/` is static — deploy it to Vercel, Netlify, Cloudflare Pages, or any
static host. Set the two `VITE_SUPABASE_*` env vars in your host's build
settings as well, since they're baked in at build time.

## 4. Replacing placeholder assets

Every path below is referenced directly in the code — drop a real file at
the same path/name and no code changes are needed:

| Path | Used by |
|---|---|
| `public/assets/logos/logo-apexmeca.png` | Header logo, favicon |
| `public/assets/logos/logo-solidworks.svg` | Toolset section |
| `public/assets/logos/logo-catia.svg` | Toolset section |
| `public/assets/logos/logo-mastercam.svg` | Toolset section |
| `public/assets/logos/logo-esprit.svg` | Toolset section |
| `public/assets/images/hero-bg.jpg` | Available for use as a CSS background if you extend the hero |
| `public/assets/images/cert-1.jpg` | Placeholder portfolio card image |
| `public/assets/videos/hero-loop.mp4` | Optional — see `public/assets/videos/README.txt` |
| `public/assets/models/mechanical-part.glb` | Hero 3D canvas — see `public/assets/models/README.txt` |

The hero canvas (`src/three/hero-scene.js`) tries to load
`mechanical-part.glb` first and **automatically falls back** to a
procedural wireframe gear-and-shaft assembly if the file isn't there —
the site is fully functional before you add a real model.

## 5. Architecture

```
src/main.js         → public site entry: wires up every module below
src/admin.js         → admin dashboard entry: auth + CRUD

src/lib/
  supabaseClient.js  → single Supabase client instance
  lenis.js           → smooth-scroll, synced to GSAP's ticker

src/three/
  hero-scene.js       → Three.js hero canvas (class HeroScene)

src/components/
  nav.js              → header scroll state + mobile menu
  animations.js       → GSAP hero intro timeline + scroll reveals
  portfolio.js         → fetches portfolio_items from Supabase, filters, modal
  contactForm.js       → inserts into contact_messages

src/data/content.js   → all static copy: services, software, experience, socials
```

Adding a new service, software entry, or timeline item means editing
`src/data/content.js` only — nothing else needs to change.

## 6. Admin panel

`/admin.html` is a Supabase-Auth-gated CRUD dashboard: sign in, then add,
edit or delete portfolio items (title, category, image upload or URL,
video URL, description). It reuses the same Supabase project and RLS
policies as the public site, so no separate backend is needed.
