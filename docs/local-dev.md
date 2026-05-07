# Local Development

Use Node `>=22.12.0`. The generated TanStack Start dependencies require Node 22 even though the current machine may have Node 20.

```bash
npm install
npm run dev
```

Convex setup:

```bash
npx convex dev
npx @convex-dev/auth
```

Set local values from `.env.example`. Configure Google OAuth and an email provider in Convex before enabling live sign-in buttons.
