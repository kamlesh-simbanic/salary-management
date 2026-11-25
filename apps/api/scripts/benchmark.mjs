// Measures API latency against a running server with the seeded 10,000 employees.
// Usage: node apps/api/scripts/benchmark.mjs [baseUrl] [runs]   (defaults: http://localhost:4000, 30)
const base = process.argv[2] ?? 'http://localhost:4000';
const runs = Number(process.argv[3] ?? 30);

const cases = [
  ['Directory, first page (25 rows)', '/api/v1/employees'],
  [
    'Directory, 100 rows, sorted by USD salary',
    '/api/v1/employees?pageSize=100&sort=salaryUsd&order=desc',
  ],
  ['Directory, filter country+department', '/api/v1/employees?country=IN&department=Engineering'],
  ['Directory, search "priya" (contains)', '/api/v1/employees?q=priya'],
  ['Directory, deep page (page 400)', '/api/v1/employees?page=400'],
  ['Filter dropdown values', '/api/v1/meta/filters'],
  ['Insights: summary by country', '/api/v1/insights/summary?groupBy=country'],
  ['Insights: summary by job title', '/api/v1/insights/summary?groupBy=jobTitle'],
  ['Insights: distribution', '/api/v1/insights/distribution'],
  ['Insights: outliers (all peer groups)', '/api/v1/insights/outliers'],
];

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];

console.log(`| Request | p50 (ms) | p95 (ms) | max (ms) |\n|---|---:|---:|---:|`);
for (const [name, path] of cases) {
  await fetch(base + path); // warm-up: connection pool and query plan
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const res = await fetch(base + path);
    await res.arrayBuffer();
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const f = (n) => n.toFixed(1);
  console.log(
    `| ${name} | ${f(percentile(times, 0.5))} | ${f(percentile(times, 0.95))} | ${f(times.at(-1))} |`,
  );
}
