# Deployment

Production runs a Dockerized TanStack Start app on a DigitalOcean Droplet behind Caddy.

## Droplet Setup

1. Install Docker and the Docker Compose plugin.
2. Create `/opt/lbbb`.
3. Copy `docker-compose.yml`, `infra/caddy/Caddyfile`, and a production `.env` based on `infra/docker/production.env.example`.
4. Point DNS at the Droplet.
5. Run `docker compose up -d`.

## GitHub Secrets

```txt
DO_HOST
DO_USER
DO_SSH_KEY
VITE_CONVEX_URL
```

Convex provider keys belong in Convex environment variables, not the Droplet.

## Caddy

Caddy terminates TLS automatically for `SITE_DOMAIN` and reverse proxies to the `web` container.
