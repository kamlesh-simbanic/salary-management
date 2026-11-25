import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  // Hosted databases (e.g. TiDB Cloud) require an encrypted connection; local MySQL does not.
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Browser origins allowed to call the API, comma-separated (the deployed UI). Empty = same-origin only.
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim().replace(/\/$/, '')) // "https://app.vercel.app/" must equal "https://app.vercel.app"
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof schema>;

// Fails fast at startup with a readable message instead of a cryptic DB error later.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return parsed.data;
}
