# Local Development

Use Node `>=22.12.0`. The generated TanStack Start dependencies require Node 22 even though the current machine may have Node 20.

```bash
npm install
npm run dev
```

## Convex (cloud dev deployment)

```bash
npx convex dev
npx @convex-dev/auth
```

Set local values from `.env.example`. Configure Google OAuth and an email provider in Convex before enabling live sign-in buttons.

## Convex (local backend on port 3210)

From the repo root, with the open-source backend running (`just run-local-backend` in a separate terminal):

```bash
just convex dev
```

Point Vite at the local deployment in `.env.local`:

```bash
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_CONVEX_SITE_URL=http://127.0.0.1:3211
VITE_SITE_URL=http://localhost:3000
```

Optional (so plain `npx convex` commands also target local without `just`):

```bash
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin key from convex-backend>
```

### Convex Auth JWT keys (manual — required for local backend)

The `@convex-dev/auth` init CLI does **not** support self-hosted deployments yet. Package name uses a **slash**: `npx @convex-dev/auth` (not `npx @convex-dev auth`).

Generate keys and apply them in one step:

```bash
just convex-auth-env
```

Or manually (do **not** paste `JWT_PRIVATE_KEY` on the command line — values starting with `-----` are parsed as CLI flags):

```bash
npx -p jose node scripts/generate-auth-keys.mjs
just convex env set --from-file convex-auth.env.local --force
just convex env set ADMIN_EMAILS you@example.com
```

Verify: `just convex env list`

### Dev sign-in without OAuth

Google OAuth is not required for local work. The app includes a **Password** auth provider and, when `VITE_DEV_AUTH_EMAIL` is set, signs you in automatically on load.

1. Ensure JWT keys are set (see above).
2. In `.env.local`:

   ```bash
   VITE_DEV_AUTH_EMAIL=you@example.com
   VITE_DEV_AUTH_PASSWORD=devpassword123
   ```

3. Grant yourself admin on the **local** backend (match the email above):

   ```bash
   just convex env set ADMIN_EMAILS you@example.com
   ```

4. Run `npm run dev`. The first visit creates the dev user if needed; later visits reuse the session.

You can also sign in manually from `/login` using the **Local dev** panel (same email/password).
