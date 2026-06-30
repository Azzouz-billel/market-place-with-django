# Lumen — self-hosted e-commerce platform

A custom online store you fully own: a **Django REST Framework** API and a
**Next.js** (App Router) storefront. No Shopify, no platform fees.

## Tech stack

- **Backend:** Django 5.1 + DRF, SQLite in dev / Postgres in prod, token auth, Stripe.
- **Frontend:** Next.js 16 (App Router, Server Components) + React 19 + Tailwind v4.
- **Infra:** Docker (multi-stage images) + docker-compose, optional S3/Cloudflare R2 media, Sentry.

The frontend talks to the API through its own **BFF route handlers**, which hold the
cart/auth tokens in httpOnly cookies and forward them to Django — so the browser never
sees a token and there's no cross-origin credential handling.

## What's built

- **Catalog & storefront** — products, categories, variants, images; filter / sort /
  search / paginate; SEO-friendly server-rendered home, listing, and detail pages.
- **Cart** — server-side, guest-friendly (token cookie), live nav badge.
- **Checkout & payments** — Stripe Checkout (hosted), idempotent order confirmation,
  stock decrement, confirmation emails. Runs with a dev bypass when no Stripe keys are set.
- **Accounts** — email login, order history, saved addresses (used at checkout).
- **Coupons** — percentage / fixed discounts with validity windows and minimums.
- **Reviews & ratings** — 1–5 stars per customer, aggregates on cards/pages + JSON-LD.
- **SEO** — sitemap, robots, canonical/OpenGraph, Product + AggregateRating structured data.

## Layout

```
backend/    Django + DRF API (apps/: catalog, cart, orders, accounts, discounts, reviews)
frontend/   Next.js storefront (src/app, src/components, src/lib)
docker-compose.yml, DEPLOY.md
```

## Quickstart (local dev)

**Backend** (terminal 1):

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set SECRET_KEY
python manage.py migrate
python manage.py seed_demo      # demo products + coupons (WELCOME10, SAVE15)
python manage.py createsuperuser
python manage.py runserver      # http://127.0.0.1:8000  (admin at /admin/)
```

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

## Run with Docker

```bash
cp .env.docker.example .env.docker   # fill in SECRET_KEY + a DB password
docker compose up --build            # storefront :3000, API :8000
```

See [DEPLOY.md](DEPLOY.md) for production env vars, Stripe webhooks, S3/R2, Sentry,
and platform notes (Railway / Render / Fly.io / VPS).

## Tests

```bash
cd backend && source venv/bin/activate && python manage.py test apps
```

The original product specification lives in [.claude.md](.claude.md).
