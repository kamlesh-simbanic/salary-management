# Performance notes

**Goal (from the requirements):** the directory and insights respond in under 500 ms with 10,000 employees. The first set of tables is measured on a local machine (server-side cost); the second is measured against the live deployment.

## Method

- Dataset: the standard seed (`npm run db:seed -w apps/api`), 10,000 employees, 10 countries.
- Environment: local machine (12 cores), MySQL 8.0.44 and Node 20 on the same host, so **no network latency** is included. A deployed API will add network time and may have slower hardware.
- Script: [`apps/api/scripts/benchmark.mjs`](../apps/api/scripts/benchmark.mjs). One warm-up request, then 30 timed requests per endpoint, including reading the full response body.
- Reproduce: start the API (`npm run dev:api`), then `node apps/api/scripts/benchmark.mjs`.

## Results

| Request                                   | p50 (ms) | p95 (ms) | max (ms) |
| ----------------------------------------- | -------: | -------: | -------: |
| Directory, first page (25 rows)           |      6.2 |     10.6 |     14.4 |
| Directory, 100 rows, sorted by USD salary |     32.4 |     34.0 |     36.0 |
| Directory, filter country + department    |      8.9 |      9.9 |     10.5 |
| Directory, search "priya" (contains)      |     16.3 |     18.0 |     19.5 |
| Directory, deep page (page 400)           |     33.2 |     35.2 |     36.4 |
| Filter dropdown values                    |      2.4 |      4.5 |      4.6 |
| Insights: summary by country              |     43.7 |     50.8 |     50.8 |
| Insights: summary by job title            |     58.6 |     60.5 |     61.3 |
| Insights: distribution                    |     25.0 |     25.3 |     25.5 |
| Insights: outliers (all peer groups)      |    122.0 |    124.6 |    129.2 |

Every endpoint is at least 4x under the 500 ms target. Other measured figures:

| Operation                                         | Time                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Seed 10,000 employees (generate and batch insert) | about 1.2 s                                                                      |
| CSV import of 5,000 rows (one invalid)            | about 0.74 s                                                                     |
| Web bundle                                        | main 614 kB (193 kB gzip); insights chunk 428 kB (122 kB gzip), loaded on demand |

## Deployed measurements

The same script run against the live API (Render free instance in Singapore, database on TiDB Cloud in Tokyo), 30 runs per endpoint, from a laptop over the public internet:

| Request                                   | p50 (ms) | p95 (ms) | max (ms) |
| ----------------------------------------- | -------: | -------: | -------: |
| Directory, first page (25 rows)           |    326.3 |    425.3 |    430.7 |
| Directory, 100 rows, sorted by USD salary |    315.0 |    511.1 |    513.0 |
| Directory, filter country + department    |    303.1 |    409.8 |    615.2 |
| Directory, search "priya" (contains)      |    320.4 |    833.6 |   1024.4 |
| Directory, deep page (page 400)           |    349.0 |    512.0 |    513.1 |
| Filter dropdown values                    |    306.9 |    414.0 |    436.8 |
| Insights: summary by country              |    342.9 |    491.0 |    646.1 |
| Insights: summary by job title            |    333.4 |    511.1 |    566.5 |
| Insights: distribution                    |    434.0 |    921.9 |    962.9 |
| Insights: outliers (all peer groups)      |    497.3 |    615.2 |    821.0 |

**Reading these honestly**

- **Most of the time is the network, not the work.** `/health`, which touches no database, takes about 270 to 310 ms from the same laptop. Subtracting that baseline, the server and database add roughly 20 to 60 ms for directory requests and 140 to 200 ms for the heaviest insights, which matches the local numbers plus a cross-region database hop.
- **The 500 ms goal is met at the median for every endpoint** (outliers is right on the line at 497 ms), **but not at p95 for some** (search 834 ms, distribution 922 ms, outliers 615 ms). Those tails come from several sources I did not separate: the free instance's small CPU share (0.1 CPU), network jitter on both legs, and the Singapore to Tokyo database link. With 30 samples each, p95 is effectively the second-worst request, so it is noisy.
- **A user close to the server would see faster responses** than these figures; a user farther away, slower. A paid always-on instance, and running the API in the same region as the database (Render has no Tokyo region, so Singapore is the nearest), would be the first improvements.
- **Cold starts are the bigger user-visible cost.** The free instance sleeps after 15 minutes idle and takes up to about a minute to wake. The first request after a quiet period is slow; the benchmark above is of a warm instance.

## What the local numbers say

- **Unfiltered first page is the cheapest (6 ms).** The default order is by name, which has an index, and the page is small.
- **Sorting by USD salary costs more (32 ms).** USD is `annual_salary x rate`, an expression no index covers, so MySQL has to sort the joined rows. It is still far under budget; a stored USD column would be indexable but goes stale when rates change (decision D4).
- **Contains-search (16 ms)** cannot use an index and scans the table. At 10k rows that is cheap.
- **Insights run in SQL** (window functions), returning a few dozen rows rather than 10,000. Outliers are the heaviest (about 122 ms) because they rank every employee within its job-title and country group, then compute three percentiles per group.
- **Deep pages (page 400, 33 ms)** show offset pagination's cost: MySQL skips 9,975 rows. Harmless at this size.

## What would change at larger scale (reasoning, not measured)

| Pressure                    | Likely change                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| 100k to 1M employees        | Keyset ("seek") pagination instead of offset; an index-friendly search (full-text or trigram) |
| Slower insights             | Cache the summary results (they change only on writes), or a nightly aggregate table          |
| Many concurrent HR users    | Connection pool tuning; a read replica for insights                                           |
| USD sort becomes a hot path | Materialise USD salary and refresh it when rates change                                       |
| Bigger front-end bundle     | Per-component MUI imports and route-level splitting (insights is already lazy-loaded)         |

## Safeguards already in place

- Page size is capped at 100 on the server; the sort field is an allow-list, so a client cannot request an expensive or arbitrary query.
- CSV import is limited to 5 MB and 20,000 rows, and inserts in batches of 1,000 inside one transaction.
- Stale browser requests are aborted when a newer one is made, so rapid filtering does not pile up work.
