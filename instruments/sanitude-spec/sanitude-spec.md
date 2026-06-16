---
version: 0.1
date: 2026-06-16
eyebrow: Specification
---
# Sanitude

*Specification & Reference Implementation*

**Sanitude** exists in service of one vision: an ecosystem for durable, hyper-personalised, self-building software that improves over time.

This vision is made up of five statements:

- **An ecosystem.** Apps work together and communicate to deliver more than the sum of their parts.
- **Durable.** The software is easily maintained and upgraded, with mechanisms built in to support its stability and security.
- **Hyper-personalised.** Each piece is built to suit its owner specifically, exactly their needs and no more, and stays malleable as those needs change.
- **Self-building.** You specify what you want in plain language, and the software builds itself in line with the other aims.
- **Improves over time.** The forces of natural selection act on the ecosystem, with incentives that enhance the quality and utility of the software.

This document has two halves that mirror each other. **The Specification** says what must be true, independent of any technology. **The Reference Implementation** is a set of concrete answers to it, putting stakes in the ground to illustrate what it could look like. The Spec is the durable artifact (though it will also evolve) whereas the RI is a worked example that will certainly be wrong in the first case, but will hopefully provide learnings to improve the Spec over time.

---

## Glossary

**Sanitude** — the name of this project: the Specification below, its Reference Implementation, and the ecosystem they enable.

**The Specification (Spec)** — the implementation-agnostic statement of what must be true. Composed of **Principles** and **Provisions**. Commits to no specific modes of execution.

**The Reference Implementation (RI)** — one opinionated, fallible set of answers to the Spec's Provisions: a chosen language, chosen services, actual Kernel code, actual agent prompts.

**The Kernel** — the shared substrate every App in an Instance inherits: hosting, storage, observability, the shared database and Ontology, access, orchestration, the communication surface and connector rails, the agent runtime, and the design system.

**The Ontology** — the Kernel's canonical model of the *nouns of a life* (people, places, money, events, documents, media, time). Apps annotate it; they never duplicate it.

**A Recipe** — a declarative, customisable seed for an app or module, written to be realised by an agent and never run as-is. (Capital-R, to distinguish it from a food *recipe*.) Ships *reference code* — illustrative, not literal — and is written to be re-implemented in whatever language the building Kernel uses. Kinds: **app Recipes**, **module Recipes**, **connector Recipes**, **vocabulary extensions**.

**An App** — a *cooked* Recipe: the running realisation of a Recipe inside one Instance. Where a Recipe is static, portable, and data-free, an App is live — it holds the Owner's data, runs on the shared Kernel, communicates with other Apps, and wears the Owner's house style. One Recipe can be cooked into many different Apps; an App belongs to exactly one Instance.

**An Instance** — the realised output of applying the Framework: `Kernel + Apps + Data`, operated by Actors. Owner-specific.

**An Actor** — any identity that operates on an Instance — the Owner, a delegated human, or an agent — each holding granular, auditable scopes.

**The Owner** — the single human an Instance belongs to. One Owner per Instance. The principal Actor.

**Inception Agent** — runs once at the birth of an Instance; provisions the stack and stands up the Kernel with the Owner, then hands off to the Architect.

**Architect Agent** — interviews the Owner for a given app, assembles it from Recipes, and recommends new Recipes over time.

**Builder Agents** — realise a Recipe into an App in the Kernel's language, and apply incremental upgrades.

**Harmony Agent** — the impartial arbiter of cross-app coherence: maintains the Kernel's dependency graph and judges whether a new Recipe's needs justify a change to a shared sub-Ontology, then proposes and actions the agreed change.

**Guardian Agent** — the security conscience of the Instance: vets the Recipes the Architect proposes before a build, audits the Builder's output for vulnerabilities before it lands, and monitors the running Instance for untrusted input and anomalous scope use.

**Curator Agent** — turns a private App into a sanitised, shareable Recipe for the Commons.

**App Agents** — run-time agents a Recipe ships with (a transaction classifier, a blog writer). Distinct from the system agents above.

**The Commons** — the registry where Recipes are published and discovered, with the trust signals that make strangers' Recipes safe to use.

---

## The Specification

### Principles

*Invariant across every implementation. Not directly answered by any RI, but followed indirectly in setting up an implementation.*

- **P1 — One Owner per Instance.**
- **P2 — Owned end-to-end.** The Owner owns all the software and has sovereignty over all its behaviour.
- **P3 — Data is the resident; Apps are visitors.** The Owner's data outlives every App that touches it.
- **P4 — Raw is sacred.** Everything ingested is archived untouched before anything interprets it, and every interpretation is re-derivable from that raw data plus recorded decisions.
- **P5 — Everything is attributable.** Every write records which Actor, under what authority, by what rule.
- **P6 — Verification over diligence.** Correctness is shown by tests, not vouched for by review.
- **P7 — Contract-first.** Apps write data only through published contracts; reads may reach source data for analysis.
- **P8 — Annotate, never duplicate.** Apps extend the shared Ontology rather than reinventing its nouns.
- **P9 — Interoperable by default.** Any two Apps can come to communicate, even when neither Recipe foresaw the other. Connection is a property of the shared substrate, not a privilege that must be designed in advance.
- **P10 — Self-building.** An Instance is stood up and grown through agent dialogue with the Owner.
- **P11 — Untrusted input stays untrusted.** Inbound data and external actors get field extraction and scoped tools, never raw authority.
- **P12 — Optimised for communal creation.** Everything is built so that what one Owner makes can become a seed for another. Value compounds across the Commons, and sharing, adapting, and contributing back are made the path of least resistance.

### Provisions

*Concrete requirements. Each is answered, one-to-one, in the Reference Implementation.*

#### Kernel

*The shared reality every Instance inherits.*

**Foundation**
- **K1 — Hosting & runtime.** A place to run, with a stable public address.
- **K2 — Object storage.** Somewhere raw artifacts and blobs are durably kept.
- **K3 — Secrets & config.** A store for keys and tokens, never held in a Recipe.
- **K4 — One implementation language.** The whole implementation runs in a single language, which every App inherits.
- **K5 — Audit & observability.** A durable, inspectable record of what happens across the Instance — actor actions, agent runs, errors, and system events — the basis for P5's attributability and the Guardian's monitoring.

**Data**
- **K6 — The Ontology.** A minimal, universal model of the nouns of a life, admitting a concept only if multiple unrelated Apps would otherwise reinvent it.
- **K7 — The shared database.** One communal database, conforming to the Ontology, used by all Apps.
- **K8 — Layered data architecture.** A single data architecture, applied consistently across every App, that keeps raw data immutable and makes each layer above it re-derivable. *(The discipline it enforces lives in P4; this provision requires the architecture exist and be uniform.)*

**Access**
- **K9 — Identity & scopes.** Every Actor has an identity and granular, time-boundable scopes (per-App, per-entity, read/write).
- **K10 — Authentication & enforcement.** A mechanism by which Actors prove identity and the Kernel enforces their scopes.

**Interaction**
- **K11 — Orchestration.** The internal event bus: it carries events and triggers reactions — App-to-App, on ingestion, or on a schedule — and runs agent handoffs and routines. *(Transport, not declaration — see K12.)*
- **K12 — Communication contracts.** The typed interfaces an App publishes — the tools and views it exposes and the events it emits and consumes. All writes pass through them. *(Declaration, not transport — see K11.)*
- **K13 — Scoped read surface.** A read-only, audited query path so an App can read source data without going through another App's contract.
- **K14 — Dependency graph.** A live record of what each App relies on — Kernel data, other Apps, external services — maintained by the Harmony Agent.
- **K15 — External messaging.** The boundary with the outside world: inbound intake (uploads, webhooks, email-as-feed) and outbound notification (the brief, alerts). *(External only — internal events are K11.)*
- **K16 — Connector standard.** A common shape for Apps to define their own connectors to external services, plus the Kernel rails those connectors use — secrets (K3), scheduling (K11), and dependency tracking (K14). The Kernel provides the rails and the standard; Apps bring the connectors.
- **K17 — Agent substrate.** More than a model endpoint: each agent is given the memory, skills, and connectors scoped to its role — not a shared pool — and is invoked with a swappable model.

**Presentation**
- **K18 — Design tokens.** The atomic visual language — colour, type, spacing, motion — every App's UI is built from.
- **K19 — Component library.** A shared, token-bound set of UI components, so Apps stay consistent without rebuilding primitives.
- **K20 — Style brief.** A qualitative expression of the Owner's taste — their UX principles — that guides the choices tokens and components can't encode.

#### Recipes

*What a shareable seed must contain.*
- **R1 — Description.** What the Recipe gets you: the app it produces, its features, the occasions and needs it suits, and what it pairs well with. This is the menu entry — it gives the Architect the context to judge whether the Recipe fits what the Owner asked for, before any build begins. *(What's on offer, not how to make it — see R5.)*
- **R2 — Manifest.** The Recipe's index card: identity, version, lineage (the parent Recipe it was forked from, if any), licence, the Ontology entities it uses, the events it emits and consumes, and the scopes and secrets it needs — pointing to the interview (R6), build guidance (R5), and verify suite (R7) rather than copying them.
- **R3 — Reference code.** Ships illustrative code in *some* language to convey intent; written to be re-implemented in the Kernel's language, not imported as-is.
- **R4 — Invariants vs surface.** Explicitly demarcates what a Builder may change from what it must not.
- **R5 — Build guidance.** How to actually make it: the method, structure, and gotchas an implementing agent follows to turn the Recipe into a working App. The recipe's ingredients-and-steps. *(How to make it, not what's on offer — see R1.)*
- **R6 — Interview.** The tailoring questions the Recipe contributes, so the Architect can fit it to this Owner before the build.
- **R7 — Verify suite.** Carries its own tests; any customisation adds tests pinning its behaviour.
- **R8 — UI mapping.** Declares which functionality gets which UI elements, without hard-coding styling.
- **R9 — Illustrative dependencies.** A Recipe names the connections it expects to be useful — "pairs well with a calendar App," "can consume transaction events" — as hints for the Architect and Owner. These are suggestions, not bindings; the real dependencies of a running App are discovered and tracked by the Kernel (K14), because a Recipe author cannot know which Apps a given Owner will cook alongside it.
- **R10 — Version guidance.** Because a Recipe is realised freshly into each Instance rather than imported, a new version cannot simply ship "the new code." Each version must explain, for someone on any prior version, what changed and why, and offer guidance on how a Builder might apply it to an already-cooked App.

#### Agents

*The roles the Spec requires exist centrally.*

- **A1 — Inception.** Provisions the Instance and stands up the Kernel with the Owner, then hands off.
- **A2 — Architect.** Interviews, assembles apps from Recipes, recommends new Recipes.
- **A3 — Builder.** Realises Recipes into Apps; applies incremental upgrades.
- **A4 — Harmony.** Maintains the dependency graph; arbitrates and actions shared-Ontology changes.
- **A5 — Curator.** Produces sanitised, shareable Recipes from private Apps.
- **A6 — Guardian.** Vets the Recipes the Architect proposes in the build spec for safety and security; audits the Builder's output for vulnerabilities before it lands; and monitors the running Instance for untrusted input and anomalous scope use.
- **A7 — App Agents.** Recipes may ship run-time agents; these are distinct from the system agents above.

#### Provisioning

*Standing up an Instance before any App exists. Handled by the Inception Agent (A1), once. The Build System assumes this is complete.*

- **PR1 — Stack stand-up.** Create and configure the services the Kernel requires — hosting, database, storage, auth, orchestration, messaging, observability.
- **PR2 — Credential wiring.** Collect the Owner's keys and tokens and place them in the secrets store (K3); the Owner supplies what an agent cannot.
- **PR3 — Kernel install.** Install the substrate itself — seed the Ontology, set up the access model, lay down the base design system — so Apps have something to inherit.
- **PR4 — Handoff.** Confirm the Instance is live and healthy, then hand off to the Architect.

#### Build System

*How Recipes become Apps, and how they change. Handled by the Architect (A2) and Builders (A3); assumes the Instance is already provisioned.*

- **B1 — The interview.** A structured, plain-language conversation turning the Owner's life-description into a build spec.
- **B2 — The build spec.** The artifact the interview produces: the Owner's requirements, the vision for what the app should be, the Recipes to be used (if any), and a rough implementation approach. It is what the Builder realises against.
- **B3 — Realisation.** A Builder turns a build spec into an App — assembling the chosen Recipes (if any) and writing code in the Kernel's language — and registers the new App's contracts and dependencies with the Kernel.
- **B4 — Incremental upgrade.** Existing App code stays; on a Recipe update, a Builder reviews the delta and patches incrementally, informed by the Recipe's version guidance.
- **B5 — Verification in the loop.** Builders run verify suites to check realisation and upgrades; the Guardian audits the result and approach for security and durability.
- **B6 — Publish-back.** A path from private custom App to shareable Recipe (the Curator's job).
- **B7 — Rollback.** Every build, upgrade, or patch is reversible; a failed or rejected change leaves the Instance exactly as it was.

#### Commons & Governance

*What lets Recipes circulate and the Spec evolve.*

- **C1 — Registry.** A place where Recipes are published and discovered exists. C2–C5 govern how it must behave.
- **C2 — Stewardship.** The Spec is open, versioned, and evolves by an RFC-style process, with the RI as a worked example, not an authority.

*The next three provisions make the Commons an environment where natural selection can act — the fifth vision statement. Each demands not just that the act be possible, but that it be low-friction and rewarded, so incentives pull the system toward improvement.*

- **C3 — Rewarded Replication.** Turning an App into a clean, shareable Recipe must be near-effortless — the Curator does the work — and contributing must be rewarded, in recognition and standing, so that publishing is the default rather than the exception.
- **C4 — Frictionless Mutation.** Any published Recipe can be forked, varied, and re-published with its lineage preserved. The barrier to creating a variant must be as low as possible, so variation is cheap and abundant and good ideas can surface from anywhere.
- **C5 — Facilitated Selection.** Trust signals — objective (public, runnable verify suites) and social (reputation, usage) — make a Recipe's fitness visible; adoption rewards what works with reach and reputation, while unused or broken Recipes fade from discovery and retire.

---

## The Reference Implementation — initial hypothesis

*Some initial thoughts on what a very simple implementation could look like to put a stake in the ground, mirroring the Provisions only.*

#### Kernel

**Foundation**
- **K1 →** Vercel (Next.js, serverless), on the Owner's own domain.
- **K2 →** Cloudflare R2.
- **K3 →** Vercel / Inngest environment config; nothing secret in any repo.
- **K4 →** **TypeScript.** The Kernel and every App are TypeScript; a Recipe's reference code, whatever language it's in, is ported to TS at realisation.
- **K5 →** Structured logs plus an error console (e.g. Sentry) for run-time errors and agent runs; the write-level audit trail lives in Postgres alongside provenance.

**Data**
- **K6 →** A small set of canonical Postgres tables — people, places, accounts/transactions, events, documents, media, time — seeded deliberately thin.
- **K7 →** One communal **Neon** Postgres database; Apps live in their own namespaces but read and conform to the shared Ontology.
- **K8 →** A **medallion architecture**: bronze (raw, append-only, archived to R2) → silver (cleaned and conformed to the Ontology) → gold (App-level aggregates and views). Everything above bronze is re-derivable; provenance carried throughout.

**Access**
- **K9 →** Clerk identities; scopes held in a Kernel-managed policy table; agents get their own Actor records and scoped credentials.
- **K10 →** Clerk-protected endpoints; read-at-source enforced by a read-only Postgres role.

**Interaction**
- **K11 →** Inngest (events, jobs, crons); agent handoffs and routines run on the same bus.
- **K12 →** MCP tools exposed through a Clerk-protected handler; typed write tools; events on Inngest.
- **K13 →** A read-only Postgres role behind a Kernel query tool.
- **K14 →** A Kernel table fed by Recipe-declared (illustrative) and observed (logged) dependencies, spanning data, Apps, and external services; the Harmony Agent owns it.
- **K15 →** Resend — inbound email feed in, brief and alerts out.
- **K16 →** A connector interface (typed config + a run hook on the Inngest bus) that connector Recipes implement; secrets via env config, scheduled on Inngest, tracked in the dependency graph. Example: a bank-feed connector ships as a connector Recipe, not Kernel code.
- **K17 →** Per-agent context assembled from scoped skills and connectors plus a memory store (e.g. a Kernel-held vector/table store); Anthropic API for run-time App Agents and Claude Code for build-time agents; the model behind a swappable interface.

**Presentation**
- **K18 →** A Tailwind / CSS-variable token layer — colour, type, spacing, motion.
- **K19 →** A shared component library bound to those tokens (e.g. a shadcn/ui-style kit), themeable per Owner.
- **K20 →** A written "style brief" the Owner authors in the interview — their UX principles (e.g. "like a comic book" → bold outlines, flat panels, high contrast) — that Builders consult for what tokens and components can't encode.

#### Recipes
- **R1 →** A `README.md` — the menu entry: what the app is, its features, and what it suits — so the Architect can match it to the Owner's needs, and the pitch shown on its Recipe page.
- **R2 →** A `recipe.yaml` manifest, including a `lineage` parent-pointer and a `licence` field, pointing to the other files rather than embedding them.
- **R3 →** A `/reference` directory; in RI #1 the reference code is TypeScript, but it stays illustrative, not a dependency.
- **R4 →** Invariants vs surface declared in the manifest; the Kernel enforces namespace ownership.
- **R5 →** A `RECIPE.md` — the build method, agent-legible (a CLAUDE.md descendant).
- **R6 →** An `interview.yaml` of tailoring questions.
- **R7 →** Fixtures and golden tests in the repo.
- **R8 →** A declarative map of functionality to token-bound components.
- **R9 →** The manifest lists expected dependencies as hints only; the Kernel dependency graph (K14) holds the truth.
- **R10 →** A `CHANGELOG.md` written for humans and Builders alike: per version, what changed, why, and migration notes for applying it to an already-cooked App.

#### Agents

*Each agent is a prompt **plus** the scoped skills and connectors its job needs **plus** a memory of its past work, orchestrated on the K11 bus with explicit handoffs and scheduled routines rather than hand-driven start to finish.*

- **A1 →** An Inception routine (runbook + provisioning skills) run once via Claude Code, handing off to the Architect on completion.
- **A2 →** An Architect equipped with interview skills and read access to the Commons registry; drives B1 and hands the build spec to the Builder.
- **A3 →** A Builder with code-writing and verify skills, running in Claude Code; on finishing, hands its diff to the Guardian.
- **A4 →** A Harmony agent with read access to the dependency graph (K14) and authority to propose schema migrations; triggered whenever a new Recipe touches a shared sub-Ontology.
- **A5 →** A Curator routine that diffs an App against its base Recipe, strips data, lifts config into interview answers, and opens a PR to the registry.
- **A6 →** A Guardian routine that reviews the Architect's proposed Recipes for safety before the build, combines static checks (scope escalation, secret leakage, injection surfaces) with an agent review of the Builder's diff, and monitors run-time logs; it gates the merge in B5.
- **A7 →** Per-Recipe agents, each shipped with their own scoped skills, invoked via the Anthropic API.

#### Provisioning
- **PR1 →** The Inception routine provisions Vercel / Neon / Clerk / R2 / Inngest / Resend / Sentry and writes the env config.
- **PR2 →** Inception collects the Owner's API keys and OAuth logins; secrets land in env config; the Owner completes any login an agent cannot.
- **PR3 →** Run the Kernel migrations: seed the Ontology tables, create the access-policy table, install the base tokens and component library.
- **PR4 →** Smoke-test auth, database, and the job runtime, then hand off to the Architect to build the first App.

#### Build System
- **B1 →** The Architect prompt plus each Recipe's `interview.yaml`.
- **B2 →** A `buildspec.md` the Architect writes and the Owner signs off: requirements, app vision, chosen Recipes, and a rough implementation sketch.
- **B3 →** The Builder ports `/reference` into the TS Kernel, wires the chosen Recipes together, and registers the App's contracts and declared dependencies; Harmony reconciles them against the dependency graph.
- **B4 →** On an upstream Recipe update, the Builder reviews the diff and patches the existing App; code is preserved, not regenerated.
- **B5 →** Verify suites run pre-deploy / in CI as the Builder's check; the Guardian audits before merge.
- **B6 →** The Curator (A5).
- **B7 →** Each change ships as a git branch plus a reversible migration; rejected or failed changes are dropped without trace on the running Instance.

#### Commons & Governance
- **C1 →** A GitHub org and index of Recipe repos to start — cheap, and it inherits open-source culture. The registry substrate is itself an open question, with candidates spanning a curated, wiki-style discovery site (low-tech, human-curated) to a dedicated ledger that tracks lineage, attribution, and reputation without a central host — the latter a natural home for the C3–C5 incentive mechanics. *(Low confidence — a git index may not carry discovery, lineage, or incentives as it scales.)*
- **C2 →** The Spec in a versioned public repo with an RFC process; this is labelled "RI #1," explicitly fallible.
- **C3 →** The Curator (A5) makes publishing one command; recognition via stars, install counts, and visible authorship and lineage on every Recipe page.
- **C4 →** Fork = clone the Recipe repo; lineage tracked by a parent-pointer in the manifest; re-publish through the same Curator path.
- **C5 →** Verify suites public and runnable; discovery ranks by a fitness signal (recent installs × verify-passing × trust); Recipes that stop passing verify or stop being installed sink and are eventually archived.
