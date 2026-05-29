# Deployment

Production runs as a Docker container on the shared DigitalOcean droplet. TLS and routing are handled by the edge Caddy stack in [lindale-infra](https://github.com/chrisyerga/lindale-infra).

## Droplet layout

- App files: `/opt/cafezoe`
- Container name: `cafezoe-web` (must match edge Caddyfile)
- Network: `edge` (external Docker network)

## Droplet setup

1. Install Docker and the Docker Compose plugin.
2. Bootstrap edge Caddy from `lindale-infra` (see that repo's `docs/bootstrap.md`).
3. Create `/opt/cafezoe` with `docker-compose.yml` and a production `.env` based on `infra/docker/production.env.example`.
4. Point DNS at the droplet.
5. Deploy via GitHub Actions or run `docker compose up -d` manually.

## GitHub Secrets

```txt
DO_HOST
DO_USER
DO_SSH_KEY
VITE_CONVEX_URL
```

Convex provider keys belong in Convex environment variables, not the droplet.

## Edge Caddy

The `lidabidabodabutt.com` vhost lives in `lindale-infra/Caddyfile`. After changing domains or upstream ports, deploy `lindale-infra` and reload edge Caddy.
