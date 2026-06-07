import { writeFileSync } from 'node:fs'
import { exportJWK, exportPKCS8, generateKeyPair } from 'jose'

const keys = await generateKeyPair('RS256', { extractable: true })
const privateKey = await exportPKCS8(keys.privateKey)
const publicKey = await exportJWK(keys.publicKey)
const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] })
const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, ' ')

const envFile = 'convex-auth.env.local'
const contents = [
  `JWT_PRIVATE_KEY="${jwtPrivateKey}"`,
  `JWKS=${jwks}`,
  'CONVEX_SITE_URL=http://127.0.0.1:3211',
  'SITE_URL=http://localhost:3000',
  '',
].join('\n')

writeFileSync(envFile, contents)

process.stdout.write(`Wrote ${envFile}\n`)
process.stdout.write('Apply to local backend:\n')
process.stdout.write('  just convex env set --from-file convex-auth.env.local --force\n')
