# ACME Salary Management

A web app that lets an HR Manager maintain salary records for ~10,000 employees across several countries and answer "how do we pay people?" without Excel pivot tables.

> **Live demo:** _to be added after deployment_ &nbsp;|&nbsp; **Demo video:** _to be added_

## What it does

| Area           | Capability                                                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Employees**  | Search by name or email, filter by country / department / job title, sort by any column, server-side pagination. Add, edit and delete with validation and inline errors.                                 |
| **Insights**   | Headcount, min, median, average and max pay by country, department or job title (in USD). Salary distribution chart (with a table view). Pay outliers within each job title and country. All filterable. |
| **Import**     | Upload a CSV exported from Excel. Valid rows are added; problems are listed by row number and can be downloaded as a report. A template is provided.                                                     |
| **Currencies** | Salaries are stored in local currency and shown with a USD value from a static rates table, so countries can be compared.                                                                                |

The scope, and what was deliberately left out (authentication, payroll, salary history, live FX), is in [docs/requirements.md](docs/requirements.md).

## Tech stack

| Layer      | Choice                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Backend    | Node 20, Express 5, TypeScript, zod                                                |
| Database   | MySQL 8 with Sequelize (raw SQL for the median/quartile queries), umzug migrations |
| Frontend   | React 19, Vite, MUI, React Router, Recharts                                        |
| Tests      | Vitest (API and web), supertest, Testing Library                                   |
| Deployment | Vercel (UI), Render (API), hosted MySQL                                            |

## Run it locally

**Prerequisites:** Node 20+, MySQL 8.

```bash
# 1. Install
npm install

# 2. Create the databases and a user (run in the mysql client as an admin)
#    CREATE DATABASE salary_dev  CHARACTER SET utf8mb4;
#    CREATE DATABASE salary_test CHARACTER SET utf8mb4;
#    CREATE USER 'salary_user'@'localhost' IDENTIFIED BY 'choose-a-password';
#    GRANT ALL ON salary_dev.*  TO 'salary_user'@'localhost';
#    GRANT ALL ON salary_test.* TO 'salary_user'@'localhost';

# 3. Configure
cp apps/api/.env.example apps/api/.env      # then put your password in both URLs

# 4. Create the tables and load 10,000 employees
npm run db:migrate -w apps/api
npm run db:seed -w apps/api                  # about 1 second; safe to re-run, it replaces employees

# 5. Start (two terminals)
npm run dev:api                              # http://localhost:4000
npm run dev:web                              # http://localhost:5173 (proxies /api to the API)
```

## Tests and quality checks

```bash
npm test                                     # all unit tests (API + web), no database needed
npm run test:integration -w apps/api         # SQL tests against the salary_test database
npm run lint
npm run build
node apps/api/scripts/benchmark.mjs          # latency benchmark (API must be running)
```

About 150 tests: 71 API unit, 20 API integration (real MySQL), 60 web. See the testing strategy in [docs/design.md](docs/design.md#5-testing-strategy).

## Project structure

```
apps/
  api/src/
    domain/          pure rules: validation schemas, outlier maths, CSV parsing (no I/O)
    services/        business rules, depend on repository interfaces
    repositories/    the only layer that talks to Sequelize / SQL
    http/            routes and the single error handler
    db/              models, migrations
    seed/            deterministic 10,000-employee generator
    server.ts        composition root
  web/src/
    api/             typed fetch client
    features/        employees, insights, import
    lib/             shared hooks and formatting
docs/                requirements, design, performance, AI usage
```

## How it is built (short version)

- **Layered backend.** Routes, services, repositories and a pure domain layer. Services depend on interfaces, so business rules are tested without a database and the SQL is tested against a real one.
- **The database does the heavy lifting.** Filtering, sorting, paging and statistics run in SQL; the browser never receives more than 100 employees. MySQL has no `MEDIAN()`, so medians and quartiles use window functions.
- **Money is exact.** Salaries are `DECIMAL`, never floating point. USD is computed at query time from the rates table, so changing a rate can never leave stale values.
- **One validation schema** is used for the form, the API and each CSV row.
- **Reproducible data.** The seed uses a fixed random seed, so the demo data and tests are identical on every run. About 1% of people are deliberately paid far from their peers so the outlier view has something real to show.

## Documentation

| Document                                     | What it covers                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [docs/requirements.md](docs/requirements.md) | Goal, scope, what is deliberately left out and why                                              |
| [docs/design.md](docs/design.md)             | Architecture, data model, API, 20 numbered design decisions with alternatives, testing strategy |
| [docs/performance.md](docs/performance.md)   | Measured latencies on 10,000 employees, reasoning about scale                                   |
| [docs/ai-usage.md](docs/ai-usage.md)         | How AI was used, what I decided, and the mistakes it made that I caught                         |

## Known limitations

No authentication (the first thing to add before real use), no salary history or audit log, static exchange rates, offset pagination, and the CSV import only adds people (it never updates). The full list and the roadmap are in the requirements and design docs.
