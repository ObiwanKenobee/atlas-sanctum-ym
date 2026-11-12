# ATLAS SANCTUM
### Open-Source Intelligence Infrastructure for Human Flourishing

**Rooted in Christ. Engineered with wisdom. Governed by truth. Directed toward human flourishing.**

Atlas Sanctum is an open-source technology initiative building intelligence infrastructure for ethical finance, humanitarian coordination, regenerative economics, and sustainable development.

We aim to connect real-world needs, scientific evidence, institutional resources, responsible decisions, and measurable outcomes through interoperable, transparent, and accountable systems.

Our founding conviction is simple:

> Intelligence becomes valuable when it helps people act wisely and serve faithfully.

> **Current codebase:** a Next.js application with Supabase-backed authentication, user-scoped field records, water-pilot foundations, and institutional workspace interfaces. Organization/project tenant isolation and a complete database-backed project lifecycle are not yet verified or delivered. See [Current Repository Implementation](#current-repository-implementation).

---

## Our Mission

To develop open, trustworthy digital infrastructure that helps communities and institutions understand reality, allocate resources responsibly, coordinate effective action, and regenerate the systems upon which life depends.

We envision a world where technology strengthens human dignity, financial systems enable productive opportunity, humanitarian resources reach people in need, and development initiatives can demonstrate their actual impact.

## The Vision

Atlas Sanctum is being developed around a central idea: **the decision should be the fundamental unit of accountable intelligence.**

Rather than building another isolated AI chatbot or dashboard, we aim to connect the complete journey from a real-world problem to a verified outcome.

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
EVALUATE
   ↓
AUTHORIZE
   ↓
EXECUTE
   ↓
VERIFY
   ↓
LEARN
   ↺
```

Every consequential decision should be explainable, evidence-based, appropriately authorized, auditable, and open to correction.

## Core Systems

### 1. Atlas Regenerative Decision Engine

The intelligence layer connecting places, problems, evidence, opportunities, decisions, and outcomes.

- Place-based intelligence and geospatial analysis.
- Evidence synthesis and provenance tracking.
- Alternative evaluation and scenario analysis.
- Decision records and authorization workflows.
- Implementation monitoring and outcome verification.
- Continuous learning from observed results.

### 2. Atlas Ethical Finance

Infrastructure supporting transparent and accountable allocation of financial resources.

- Project and cooperative financing workflows.
- Funding commitments, budgets, and disbursement records.
- Responsible investment and impact analysis.
- Financial-service interoperability.
- Project-level outcome reporting.
- Fair-treatment and accountability safeguards.

### 3. Atlas Humanitarian Network

Technology for improving coordination between humanitarian organizations, local service providers, funders, and affected communities.

- Needs assessment and resource mapping.
- Service coordination and referrals.
- Delivery and procurement tracking.
- Emergency-response situational awareness.
- Community feedback and grievance mechanisms.
- Privacy-conscious reporting and accountability.

### 4. Atlas Regenerative Economy

Intelligence systems supporting ecological restoration, agricultural resilience, and sustainable livelihoods.

- Geospatial and environmental intelligence.
- Agricultural evidence graphs.
- Climate and infrastructure risk analysis.
- Land, water, and ecosystem monitoring.
- Restoration-project evaluation.
- Evidence-based environmental and social reporting.

### 5. Atlas Sustainable Development Intelligence

A shared intelligence layer for development institutions, researchers, enterprises, public-interest organizations, and communities.

- Development observatories.
- Infrastructure and service-gap analysis.
- Evidence-based project prioritization.
- Resource and intervention mapping.
- Program monitoring and evaluation.
- Institutional coordination and research.

---

## Architecture Principles

Atlas Sanctum follows a modular, interoperable architecture designed to connect established technologies rather than unnecessarily recreate them.

| Layer | Responsibility |
|---|---|
| Data and evidence | Collect, validate, contextualize, and trace information. |
| Geospatial intelligence | Connect evidence to locations, ecosystems, infrastructure, and communities. |
| Decision intelligence | Evaluate alternatives, uncertainty, risks, and expected outcomes. |
| Governance and authorization | Define permissions, approvals, accountability, and appeal mechanisms. |
| Execution and coordination | Connect approved decisions to funding, services, and responsible parties. |
| Verification and learning | Compare commitments with delivery and evaluate actual outcomes. |
| Interfaces and APIs | Enable accessible interaction and interoperability across systems. |

### Potential Technology Foundations

We evaluate established open-source technologies according to their maturity, security, licensing, maintainability, interoperability, and suitability for each deployment.

| Domain | Technologies to evaluate |
|---|---|
| Core banking | Apache Fineract |
| Payment interoperability | Mojaloop |
| Humanitarian data collection | KoboToolbox |
| Workflow integration | OpenFn |
| Health information systems | DHIS2 |
| Geospatial databases | PostgreSQL, PostGIS |
| AI and scientific computing | Python, PyTorch, scikit-learn |
| Web applications | TypeScript, React |
| Infrastructure | Docker, automated testing, observability |

These are potential integrations, not claims that every component is already implemented or deployed.

The architecture prioritizes open standards, secure APIs, data portability, modularity, offline-capable workflows, and affordable operation in low-connectivity environments.

## AI and Decision Intelligence

Atlas may use specialized AI agents to support bounded analytical tasks.

| Agent | Responsibility |
|---|---|
| Oracle | Research, evidence synthesis, and source evaluation. |
| Gaia | Environmental intelligence and Earth systems analysis. |
| Solomon | Decision analysis, alternatives, and trade-offs. |
| Aegis | Security, privacy, risk, and assurance. |
| Athena | Strategy, systems thinking, and institutional learning. |
| Leonardo | Engineering, experimentation, and technical design. |
| Builder | Implementation planning, integration, and delivery. |

These roles describe the proposed agent architecture. They do not imply that all agents are currently implemented.

AI outputs must preserve evidence provenance, disclose uncertainty, and remain subject to appropriate human review. Agents must not independently authorize consequential financial, humanitarian, or other high-impact actions.

## Christian Foundation

Atlas Sanctum is rooted in Christian principles that shape its approach to technology and institutional stewardship.

- **Human dignity — Genesis 1:27:** People are never merely data points or optimization targets.
- **Love of neighbour — Matthew 22:39:** Technology should respond to real human needs.
- **Stewardship — Genesis 2:15:** Resources and creation require responsible care.
- **Justice and truth — Micah 6:8:** Decisions should be transparent, fair, and accountable.
- **Faith expressed through service — James 2:17:** Intentions must be connected to tangible action.

Our Christian foundation informs our institutional values without making access to public-interest services conditional on religious identity.

## Principles of Responsible Engineering

1. **Evidence before assertion.** Distinguish verified facts, assumptions, estimates, and hypotheses.
2. **Human dignity before optimization.** Protect agency, privacy, and fair treatment.
3. **Authorization before action.** Consequential decisions require appropriate authority.
4. **Verification before impact claims.** Measure outcomes and disclose limitations.
5. **Open standards before avoidable lock-in.** Enable interoperability and data portability.
6. **Security by design.** Apply least privilege, secure defaults, and appropriate audit controls.
7. **Privacy by design.** Minimize personal data collection and exposure.
8. **Scientific integrity.** Document methodology, uncertainty, and reproducibility.
9. **Sustainable economics.** Build operational models capable of supporting long-term maintenance.
10. **Accountable stewardship.** Make governance, conflicts of interest, and responsibilities explicit.

## Initial Deployment Direction

Our initial development direction is to validate the Atlas Regenerative Decision Engine through a focused development challenge in Kenya.

Potential applications include:

- Water-access reliability.
- Agricultural and climate resilience.
- Community-development project accountability.
- Local infrastructure intelligence.

The first pilot should be selected with participating communities and institutions, based on a clearly defined problem, appropriate data access, a credible implementation pathway, and measurable outcomes.

The objective is to demonstrate a working evidence-to-action cycle before expanding into a broader platform.

## Current Repository Implementation

> **Status:** This repository contains a Next.js web application. It does not contain the separate Fastify/SQLite prototype described in earlier versions of this section. The runtime instructions, demo credentials, and capabilities below have been aligned to the checked-in source tree.

### Application stack

| Layer | Implementation in the repository |
|---|---|
| Web framework | Next.js 16.4.3 App Router |
| UI runtime | React 19 |
| Language | TypeScript 5.7.3 |
| Styling | Tailwind CSS 4 |
| Authentication/data client | Supabase JS and `@supabase/ssr` |
| Payments integration | Stripe package is present; live payment configuration is environment-dependent |
| Package manager | pnpm 12.3.4 |
| CI runtime target | Node.js 22 |

The package manifest and lockfile are the source of truth for dependency installation. The repository does not contain the previously documented `server/src/schema.sql`, SQLite seed script, Fastify API, Vite application, or demo-account password set.

### What is present in the source tree

- Public institutional, research, solutions, governance, and pilot pages.
- Auth, onboarding, overview, workspace, projects, records, execution, coordination, and verification interfaces.
- Supabase server/client setup using the authenticated session.
- API routes for onboarding, field records, water-pilot operations, inquiries, newsletters, and donation checkout.
- Checked-in migrations for pilot inquiries, workspace profiles, field records, water-pilot records, newsletter subscriptions, and workspace role constraints.
- User-scoped RLS policies in the workspace-profile and field-record migrations; water-pilot tables also have user-owner policies.
- A read-only SQL reconnaissance script for inspecting the intended Supabase database without changing it.

These are application and schema foundations, not proof that every connected feature is operating against a live, production database.

### Current workspace and tenant limitations

- The projects page currently presents the project lifecycle and workspace organization context; it is not yet a complete database-backed project CRUD interface.
- The application helper references `organizations` and `organization_memberships`, but the checked-in migrations inspected for this milestone do not create those tables. Their live definitions and applied migration history remain unverified.
- The current migrations primarily establish user-owned records. Organization/project-level tenant isolation is **not demonstrated** by the checked-in schema.
- The project creation service, functional-role policy, and server-side authorization adapters are being reviewed in [PR #17](https://github.com/ObiwanKenobee/atlas-sanctum-ym/pull/17). They are not yet connected to a verified project/membership database schema or an exposed project API route.
- No confirmed institutional deployment, real beneficiary evidence, field-verified outcomes, or measured impact should be inferred from demonstration content.
- GitHub Actions currently reports failures before recording workflow steps. Typecheck, test, and production-build status therefore remain unverified in CI.

Do not treat application-level authorization helpers as a replacement for PostgreSQL constraints and Supabase RLS.

### Run the web application locally

Use Node.js 22 to match the checked-in CI workflow. From the repository root:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Useful validation commands:

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

The commands are defined in `package.json`. The test script uses Node's built-in test runner. A successful local command is not a substitute for the currently unavailable GitHub Actions validation.

### Required environment

The Supabase server client reads:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Set the values for a development Supabase project in an untracked local environment file. Configure additional integration credentials only when testing the corresponding feature. Never commit secret keys, service-role credentials, production tokens, or real user data.

The Supabase project currently visible through the connected tooling is marked inactive and has not been confirmed as the intended Atlas Sanctum development environment. Confirm the target project and inspect its live tables, policies, grants, functions, triggers, and migration history before applying schema changes.

### Testing and delivery status

Node's built-in test files are present for workspace role validation, authorization policy, request authorization, project input validation, and project creation. Their presence is not evidence that the full application typecheck/build or all tests have passed in CI.

The current engineering gates are:

1. Restore actionable GitHub Actions execution and obtain real step logs.
2. Confirm the intended active development Supabase project.
3. Reconcile live schema with checked-in migrations.
4. Implement organization/project schema and RLS only after that reconciliation.
5. Demonstrate two synthetic organizations with database-level cross-tenant denial tests.

## Roadmap

*The roadmap below describes institutional maturity. See Working Prototype for what the current code actually implements.*


### Phase 1 — Foundation
- Define the initial problem and intended users.
- Establish the data, governance, and security requirements.
- Evaluate reusable open-source components.
- Design the core evidence and decision-record models.

### Phase 2 — Prototype
- Implement a geospatial evidence interface.
- Build the decision-record and authorization workflow.
- Integrate selected data sources.
- Produce initial reporting and verification capabilities.

### Phase 3 — Pilot
- Work with an authorized institutional partner.
- Establish a baseline and success metrics.
- Test the system against a real operational workflow.
- Evaluate usability, security, reliability, and measured results.

### Phase 4 — Open Infrastructure
- Document reusable components and APIs.
- Publish appropriate code and technical standards.
- Incorporate community and institutional feedback.
- Expand to additional use cases only when justified by evidence.

*This roadmap represents intended work, not a claim that these milestones have been completed.*

## Economic Model

Atlas Sanctum aims to combine an open-source commons with sustainable institutional operations.

Potential funding mechanisms include:

- Implementation and integration contracts.
- Institutional subscriptions and managed deployments.
- Technical support, training, and research services.
- Grants and philanthropic support for public-interest infrastructure.
- Partnerships with organizations pursuing measurable development outcomes.

Open-source availability, appropriate data governance, and long-term maintainability should reinforce one another.

## Contributing

We welcome thoughtful collaboration across:

- Software engineering and distributed systems.
- Artificial intelligence and scientific computing.
- Geospatial intelligence and Earth observation.
- Ethical finance and financial inclusion.
- Humanitarian technology and public-interest infrastructure.
- Agricultural resilience and regenerative economics.
- Security, privacy, governance, and impact evaluation.

Before contributing, please open an issue to discuss the problem, intended users, evidence, proposed approach, and compatibility with the project's principles.

Contributions should prioritize working software, clear documentation, reproducibility, maintainability, and demonstrable usefulness.

## Long-Term Vision

We envision a network of interoperable, locally stewarded intelligence systems connecting community knowledge, scientific evidence, responsible capital, institutional capabilities, and measurable development outcomes.

The ambition is global. The method is disciplined experimentation. The foundation is stewardship. The standard is accountable service.

We do not claim to have solved these challenges. We are building, testing, learning, and collaborating toward practical solutions.

---

## Atlas Sanctum

**Technology. Stewardship. Human flourishing.**

*Observe reality. Understand deeply. Decide wisely. Act responsibly. Verify honestly. Regenerate faithfully.*

