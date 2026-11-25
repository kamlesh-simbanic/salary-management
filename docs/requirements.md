# Salary Management: Requirements (v1)

**User:** the HR Manager at ACME (a single trusted user).
**Problem:** salary data for ~10,000 employees in several countries lives in Excel files. It is slow to edit, easy to corrupt, and hard to answer "how do we pay people?" from.

## 1. Goal

Replace the spreadsheets with a web app where the HR Manager can (a) maintain employee salary records quickly and safely, and (b) get answers about pay across the org in seconds, without pivot tables.

## 2. Scope: what we build

| #   | Feature                                                                                                                | Why                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| F1  | **Employee directory**: server-side pagination, search (name/email), filters (country, department, job title), sorting | 10k rows must stay fast; this is the daily "find a person" workflow         |
| F2  | **Create / edit / delete employee** with validation (required fields, salary > 0, valid currency, unique email)        | Replaces editing cells in Excel; validation prevents the typos Excel allows |
| F3  | **Pay insights**: per country, department and job title: headcount, min, median, average, max                          | Core "how do we pay people?" questions                                      |
| F4  | **Salary distribution**: histogram in salary bands, filterable by country/department                                   | Shows the shape of pay, not just averages                                   |
| F5  | **Outliers**: employees far above or below their peer group (job title + country), by a documented statistical rule    | Surfaces possible pay inequities or data-entry errors                       |
| F6  | **Currency handling**: store the salary in local currency; show a normalized USD value via a static rates table        | Cross-country comparison is meaningless without a common currency           |
| F7  | **CSV import** of employees (with row-level error report)                                                              | The data starts in Excel; without an import path nobody can migrate         |
| F8  | **Seed script**: 10,000 realistic, reproducible employees                                                              | Required by the brief; also the basis for performance testing               |

## 3. Assumptions (also sent to the hiring team by email)

- Insights are the questions in F3-F5 (no specific list was given).
- One trusted HR Manager; no login (see out of scope).
- No existing Excel layout was given, so I designed the schema (id, name, email, job title, department, country, currency, salary, hire date).
- Salary means **annual base salary**.

## 4. Deliberately left out (and why)

| Left out                                | Reasoning                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentication / roles                  | Confirmed out of scope. Salary data is sensitive, so this is the first thing to add for production (see roadmap).                 |
| Payroll, tax, benefits, bonuses, equity | A different product. Base salary alone answers the stated question.                                                               |
| Salary history and audit log            | Valuable, but it doubles the data model. It is documented as the next step; the schema leaves room for it.                        |
| Live FX rates                           | A static table is deterministic and testable. An external API adds failure modes, and "today's rate" isn't needed for comparison. |
| Approval workflows, multi-user editing  | Single user; there is no workflow to model.                                                                                       |
| Excel/XLSX export or import             | CSV covers the migration need. XLSX parsing adds a dependency and edge cases for little gain.                                     |
| Fancy dashboards, forecasting           | The brief asks for good judgment, not the most complex system.                                                                    |

## 5. Non-functional goals

- Directory page and insights respond in **< 500 ms** on 10k rows (aggregates done in SQL, not in JS; indexed filter columns).
- Fast, deterministic unit tests (no network, fixed seeds, in-memory or isolated test DB).
- Layered backend (routes -> services -> repositories) so business rules are testable without HTTP or DB.

## 6. Success criteria

HR Manager can find and edit any employee in under 10 seconds, and can answer "what is the median pay for Software Engineers in India vs Germany?" in a couple of clicks.

## 7. Roadmap (not built)

Auth + roles, salary history/audit log, live FX, bonus/equity, XLSX export, pay-band compliance checks.
