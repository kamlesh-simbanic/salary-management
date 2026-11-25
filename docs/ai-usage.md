# AI Usage Log

I used Claude Code (an agentic coding assistant) for this assessment. This page records how, what I decided myself, and where the AI got things wrong. The aim is to show that I direct the work and can explain every part of it.

## Working agreement

- **I make the decisions; the AI proposes and implements.** The AI was told to ask me about the tech stack rather than choose it.
- **Step by step, not all at once.** Requirements, then design, then scaffold, then one feature per step, each ending with a summary I read and a small commit that I made myself.
- **Tests with the code.** Every feature has unit tests, and SQL has integration tests against real MySQL with expected values computed by hand.
- **Verify, don't trust.** After each step the checks (tests, lint, build) were run and, for anything user-facing, the real app was exercised against the 10,000-row dataset and rendered pages were inspected.

## Decisions I made (not the AI)

| Decision          | My choice                                         | Why                                                                                                                  |
| ----------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Backend framework | Express (over NestJS, Fastify)                    | Minimal and familiar; I structure the layers myself                                                                  |
| Database / ORM    | MySQL + Sequelize (over SQLite + Drizzle, Prisma) | My choice of stack; needs a hosted database for deployment                                                           |
| Frontend          | React + Vite + MUI                                | The JD stack. I asked what Vite is and what the alternatives are before agreeing                                     |
| Deployment        | Vercel (UI) + Render (API)                        | Free tiers, separate concerns                                                                                        |
| Table component   | Plain MUI Table, not DataGrid                     | I asked for the differences first. The server owns paging and sorting, so a grid's client features would go unused   |
| Scope             | The eight features in the requirements doc        | Emailed my scope assumptions to the hiring team: insights questions, local currency plus USD, no auth, my own schema |
| Commits           | I wrote and made every commit                     | So the history reflects what I reviewed                                                                              |

## Representative prompts

1. The initial brief: the assessment PDF, the recruiter email, the JD, and "I should have knowledge of every question and decision... proceed step by step from requirement gathering to deployment... for choosing tech stack ask me."
2. "I've one question about using Vite. Can we proceed without it? What is the usage of it and the difference in outcome if I use it or don't? Just review and give me an update. Do not make any changes."
3. "Explain the difference between MUI DataGrid and plain MUI Table."
4. "Give me separate commands with files for 2 commits."
5. At each stage: "proceed", once I had read and understood the previous summary.

## How the work was sequenced

| Step              | What the AI produced                                          | What I checked                                                                          |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Requirements      | One-page scope doc with a left-out table                      | Edited and approved before any code                                                     |
| Design            | Architecture, schema, API and decision log (D1 to D20)        | Approved; decisions D3 to D6 are the ones I can explain in depth                        |
| Scaffold          | npm workspaces, Express and Vite apps, lint, test runners     | Build, lint and a first test passed                                                     |
| Database and seed | Models, migrations, a seeded 10,000-employee generator        | Confirmed tables and indexes in my own DB client; sanity-checked average pay by country |
| Employee API      | CRUD, filters, sorting, pagination, validation                | Unit and integration tests; timed against 10k rows                                      |
| Insights API      | SQL window-function median and quartiles, histogram, outliers | Hand-computed expected values in tests                                                  |
| CSV import        | Parser, transactional bulk insert                             | Imported a 5,000-row file with one bad row end to end                                   |
| Web UI            | Directory, forms, insights, import                            | Component tests; rendered pages checked in a headless browser                           |

## Mistakes the AI made that I (or the tests) caught

Listing these on purpose: it is the evidence that the output was reviewed rather than accepted.

| What went wrong                                                                                                       | How it was caught                                                                           | Outcome                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Formatting the repo also rewrote my committed docs                                                                    | Reading `git status` after the scaffold step                                                | Docs left as they were; formatting is applied deliberately                                                      |
| Used icon names that do not exist in the installed MUI version (`DeleteOutline`, `CheckCircleOutline`)                | TypeScript build error                                                                      | Fixed to the real names                                                                                         |
| Used `Stack` layout props that MUI 9 removed                                                                          | TypeScript build error                                                                      | Moved into `sx`                                                                                                 |
| The data-fetching hook trusted an aborted request to fail; a slow stale response could overwrite newer data           | A unit test written for exactly that case                                                   | Hook now ignores results from superseded requests                                                               |
| Chart axis labels read "$50.0k" instead of "$50k"                                                                     | A unit test                                                                                 | Fixed the number formatting                                                                                     |
| The React lint rule rejected setting state inside effects                                                             | Lint failed                                                                                 | Redesigned: derived loading state, and the search debounce moved into the change handler                        |
| CSV importer rejected a file with a "Country" header (it wanted "countryCode")                                        | Live test with a realistic file                                                             | Added short-header aliases and a test                                                                           |
| The outlier job-title filter on the Insights page silently did nothing (API did not accept it)                        | Reviewing the page against the API                                                          | Extended the API and added an integration test                                                                  |
| Name search relied on MySQL's case-insensitive collation, so it silently missed matches on TiDB (the hosted database) | Running the integration suite against TiDB before deploying: 19 of 20 passed, search failed | Search lower-cases both sides, so it no longer depends on the collation; test extended with an upper-case query |
| One of my own tests had a contradictory comment and an unrealistic negative salary                                    | Re-reading it                                                                               | Rewrote it with hand-checked numbers                                                                            |
| A test assumed a failed upload should disable the Import button                                                       | The test failed; I decided the component was right                                          | Changed the test: the file stays selected so a retry needs no re-pick                                           |

## What I would explain in an interview

- **Why the database computes the statistics**, and how the median works without a `MEDIAN()` function (rank rows with `ROW_NUMBER`, interpolate between neighbouring ranks).
- **Why money is `DECIMAL`** and why USD is computed at query time instead of stored.
- **Why the outlier rule is Tukey fences per job title and country**, and why groups under 5 are skipped.
- **Why the import is partial and transactional**, and why it never updates existing rows.
- **The testing split:** pure logic and services without a database, SQL against a real one, and why I would not mock the SQL.
- **What I left out and why**, and the order I would build it in next (authentication first).

## My notes

_Add your own reflections here before submitting: what surprised you, what you changed after reading the AI's proposal, and anything you would do differently._
