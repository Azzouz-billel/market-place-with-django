# Deploying Lumen

The stack is two containers — a Django/DRF API (`backend/`) and a Next.js storefront
(`frontend/`) — plus Postgres. Anything that runs Docker images (Railway, Render,
Fly.io, or a VPS) can host it.

## 1. Environment

Copy the template and fill it in:

```bash
cp .env.docker.example .env.docker
```

Required:

| Variable | Notes |
| --- | --- |
| `SECRET_KEY` | Long random string. |
| `ALLOWED_HOSTS` | Your API host(s), comma-separated. |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db`. |
| `CORS_ALLOWED_ORIGINS` | The storefront origin, e.g. `https://shop.example.com`. |
| `FRONTEND_BASE_URL` | Storefront origin (used for Stripe success/cancel URLs). |

Optional (features stay off until set):

- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Point a Stripe webhook at
  `https://<api-host>/api/stripe/webhook/` (event `checkout.session.completed`).
  Without keys, checkout uses the dev bypass **only when `DEBUG=True`**; in production
  with no keys, configure Stripe before going live.
- **Media on S3 / Cloudflare R2** — set `AWS_STORAGE_BUCKET_NAME` (+ `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `AWS_S3_REGION_NAME`). For R2 also set `AWS_S3_ENDPOINT_URL`
  and usually `AWS_S3_CUSTOM_DOMAIN`. Without a bucket, media is stored on local disk.
- **Sentry** — `SENTRY_DSN` (backend error monitoring).
- **Email** — `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` for real
  order-confirmation emails (otherwise the SMTP backend has nothing to send through).

The frontend needs `API_BASE_URL` (server-side, points at the API) and the build-time
`NEXT_PUBLIC_SITE_URL` (its own public origin, for canonical/sitemap/OG URLs).

## 2. Run with Docker Compose

```bash
docker compose up --build -d        # needs the docker compose v2 plugin
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_demo   # optional demo data
```

Backend → `:8000`, storefront → `:3000`. The backend container runs `migrate` and
`collectstatic` on startup.

## 3. Platform notes

- **Railway / Render**: create a Postgres add-on, then a service per Dockerfile
  (`backend/Dockerfile`, `frontend/Dockerfile`); set the env vars above. Render can also
  read a `render.yaml` (not included — add once the target is chosen).
- **Fly.io**: `fly launch` in each of `backend/` and `frontend/`; attach Fly Postgres;
  set secrets with `fly secrets set`.
- **VPS**: install Docker + the compose plugin, clone the repo, create `.env.docker`,
  `docker compose up --build -d`, and put a TLS-terminating reverse proxy (Caddy/nginx)
  in front.

## 4. Production checklist

- `DEBUG=False` (default in `config.settings.production`).
- HTTPS in front of both services — the API sets HSTS, secure cookies, and
  `SECURE_SSL_REDIRECT` (expects `X-Forwarded-Proto`).
- Run `python manage.py check --deploy` and resolve any warnings.
- Set a strong `SECRET_KEY` and database password; never commit `.env.docker`.

## Not yet wired

- Frontend (browser) Sentry via `@sentry/nextjs` — backend Sentry is in place.
- Celery + Redis background tasks — a `redis` service is in compose, reserved for this.
- A platform-specific config file (`render.yaml` / `fly.toml`) — add per chosen host.
