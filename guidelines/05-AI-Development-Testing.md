# Chapter 5 · AI-Assisted Development & Testing

## 5.0 How to Use This Chapter
- Understand how AI tooling fits into corradAF workflows.
- Follow guidance per skill track to prompt effectively, verify results, and maintain quality.
- Apply the testing playbooks to keep AI-generated code safe and observable.

## 5.1 Beginner Track · Getting Started with AI
### Goal
Use AI to accelerate repetitive tasks while staying in control of the output.

### Recommended workflow
1. **Clarify the task**  
   - Identify the feature scope, affected files, and acceptance criteria.  
   - Note dependencies (components, APIs, Prisma models) before prompting.
2. **Draft prompts with context**  
   - Include framework details (Nuxt 3, Tailwind, Prisma).  
   - Mention coding rules from `llms.txt` (use `<script setup>`, `navigateTo`, etc.).  
   - Share relevant snippets rather than entire files when possible.
3. **Request structured output**  
   - Ask for step-by-step plans, pseudocode, or diffs before code dumps.  
   - When requesting code, specify file path and format (Vue SFC, Prisma model, API handler).
4. **Review before committing**  
   - Confirm imports, prop names, and store usage follow project conventions.  
   - Ensure no secrets or credentials appear in generated code.
5. **Test quickly**  
   - Run `yarn dev` and manual UI checks for basic flows.  
   - Use DevTool suite (API Editor, ORM) to validate endpoints modified by AI output.

### Ready when
- You can craft prompts that produce usable boilerplate.
- You detect and fix AI mistakes during review.
- Manual smoke tests cover AI-assisted changes.

## 5.2 Intermediate Track · Pair Programming with AI
### Goal
Use AI as a collaborator for feature work, documentation, and unit tests.

- **Prompting patterns**
  - Provide problem statements plus existing code references (line ranges or function names).
  - Ask for alternative approaches and weigh trade-offs before choosing an implementation.
  - Request refactors in bounded scope to avoid unintended edits.
- **Documentation & guideline updates**
  - Use AI to produce release notes, README updates, or API docs.  
  - Cross-check against KRISA requirements (headers, versioning, approvals) before publishing formal docs.
- **Test generation**
  - Ask AI to produce unit/integration test scaffolds (e.g., `@vue/test-utils`, `vitest`).  
  - Verify test coverage matches critical paths and adjust data fixtures manually.
- **Code reviews**
  - Have AI summarize diffs to surface risky changes; still perform full human review.  
  - Use AI to suggest additional test cases or edge conditions.
- **Security & compliance**
  - Include prompts asking AI to highlight potential vulnerabilities (input validation, auth checks).  
  - Reject responses that mention insecure patterns or violate project policies.

### Ready when
- AI-assisted commits pass linting and manual QA with minimal rework.
- Generated tests prevent regressions for the features touched.
- Documentation created with AI meets project formatting and accuracy standards.

## 5.3 Expert Track · AI-Driven Workflows & Quality Gates
### Goal
Institutionalize AI usage for large features, regression testing, and release automation.

- **AI-driven design proposals**
  - Use AI to produce architecture diagrams, sequence flows, or migration plans.  
  - Validate proposals with the team and capture review outcomes in project tracker.
- **Automated changelog and impact analysis**
  - Prompt AI to analyze commits and extract risk areas (database, auth, third-party integration).  
  - Generate rollback plans and add them to deployment runbooks.
- **Regression test suites**
  - Ask AI to map user journeys and propose E2E scenarios (Cypress/Playwright).  
  - Prioritize tests covering AI-modified code paths and critical RBAC flows.
- **Monitoring & alerting suggestions**
  - Use AI to recommend metrics, logs, and alerts after new integrations launch.  
  - Incorporate suggestions into observability dashboards.
- **Governance**
  - Maintain a checklist documenting AI involvement per feature (files touched, reviews completed).  
  - Schedule periodic audits comparing AI-generated code against production incidents.
- **Continuous improvement**
  - Feed post-mortem findings back into future prompts (e.g., “remind me to add validation for empty payloads”).  
  - Build prompt libraries or snippets for recurring tasks (CRUD pages, Prisma models, API endpoints).

### Ready when
- AI usage is transparent, repeatable, and measurable across the team.
- Releases include AI-authored documentation, tests, and monitoring without sacrificing reliability.
- Audit trails show human oversight at every decision point.

## 5.4 Testing Playbook for AI-Generated Code
- **Static checks**
  - Run `yarn lint` or ESLint tasks applicable to modified files.
  - Use TypeScript checks where applicable (enable `vue-tsc --noEmit` if configured).
- **Manual verification**
  - Validate key user stories in the UI.  
  - Inspect responsive states and edge-case UI flows.
- **API validation**
  - Exercise endpoints via Postman or `/devtool/api-editor`.  
  - Check authentication/middleware still behaves as expected.
- **Database integrity**
  - Verify Prisma migrations contain only intended changes.  
  - Use Prisma Studio or DevTool ORM to inspect data consistency.
- **Automated suites**
  - Execute unit/integration tests relevant to modified modules.  
  - Add missing tests before merging; do not rely solely on AI output.
- **Rollback readiness**
  - Ensure rollback instructions are documented if AI touched schema or infrastructure.  
  - Preserve previous versions of critical files for quick reversion.

## 5.5 Prompting Cheat Sheet
- **Context block**
  ```
  Project: corradAF (Nuxt 3 + Vue 3 + Tailwind + Prisma)
  Constraint: use <script setup>, navigateTo, FormKit components, rs-* design system.
  Task: Update page X to include Y feature.
  Related files: pages/..., server/api/..., prisma/schema.prisma
  ```
- **Request types**
  - “Outline a plan before coding the solution.”
  - “Suggest test cases for the new API endpoint.”
  - “Generate Jest/Vitest specs with Arrange-Act-Assert sections.”
  - “Review this diff for security issues.”
- **Quality guardrails**
  - Ask AI to highlight assumptions.  
  - Request follow-up lists: “What should we manually verify after applying this change?”
  - Encourage double-checks: “Summarize risks introduced by this modification.”

## 5.6 Resources
- `llms.txt` — canonical corradAF coding rules for LLM interactions.
- Nuxt, Prisma, Tailwind docs — authoritative references to confirm AI-generated patterns.
- Internal wiki or runbooks — capture team-specific prompt libraries.
- KRISA documentation standards — ensure AI-authored docs comply with government requirements.

## 5.7 Planner Mindset · Context → Instructions → Output
### Why it matters
- AI tools respond best when prompts are structured.
- Developers adopting a planner mindset ensure requirements are unambiguous and code changes stay aligned with business goals.
- The trio of **Context**, **Instructions**, and **Output** acts as a contract between requester and implementer.

### 1. Context
- Describe the current state and constraints.
- Include:
  - Module or page names (`pages/preventive-maintenance/index.vue`, `server/api/tickets`).
  - Existing behaviour that must be preserved.
  - Dependencies (components, stores, environment variables, third-party APIs).
  - Non-functional requirements (performance, accessibility, security).
- Use bullet points or short paragraphs; keep it factual.

### 2. Instructions
- Translate goals into actionable steps.
- Checklist:
  - Each step starts with a verb (`Add`, `Update`, `Remove`, `Validate`).
  - Note acceptance criteria (e.g., “Filter dropdown must update table without page reload”).
  - Reference affected files and expected data flow.
  - Call out tests to create or update (unit, integration, E2E).
- Keep a separate subsection for “Not in scope” to avoid scope creep.

### 3. Output
- Define expected deliverables and validation evidence.
- Include:
  - Code artifacts (file paths, components, migrations).
  - Documentation updates (README, Guidelines, runbooks).
  - Test results (commands executed, screenshots, coverage summaries).
  - Demo notes or QA checklist outcomes.
- When prompting AI, specify output format (diff, markdown table, pseudocode) to reduce rework.

### Planner template (copy-friendly)
```
Context:
- Current page: ...
- Existing APIs: ...
- Constraints: ...

Instructions:
1. ...
2. ...
3. ...
Not in scope:
- ...

Output:
- Updated files: ...
- Tests run: ...
- Documentation: ...
```

### Ready when
- Tasks are easy to hand over between developers without meetings.
- Prompts produce relevant responses on the first attempt.
- Stakeholders can read the planner template and understand progress.

## 5.8 Document Crosscheck Checklist for Development
Use this checklist before starting implementation or closing a feature to ensure documentation meets project and KRISA standards.

### 1. Source alignment
- Confirm requirement tickets, planner template, and design specs match.
- Validate that scope matches latest stakeholder approval.
- Cross-reference KRISA phase documents (SRS, SDS, etc.) for impacted sections.

### 2. Artefact review
- README / Guidelines: ensure new workflows or env variables are documented.
- API docs: update request/response examples after endpoint changes.
- Prisma migrations: verify naming, description, and rollback notes.
- Front-end components: update Storybook/demo pages if available.

### 3. Validation proof
- Record commands executed (`yarn dev`, `yarn build`, `npx prisma migrate dev`).
- Capture test evidence (screenshots, jest/vitest outputs, Postman collections).
- Note manual QA scenarios tested and results.

### 4. Compliance check
- Apply KRISA documentation requirements: document header, version history, approvals.
- Ensure sensitive data absent from docs (no credentials, tokens).
- Verify accessibility and security statements updated if behaviour changed.

### 5. Sign-off
- Reviewer lists open questions and resolutions.
- Obtain approvals from technical lead and QA (digital signature or tracked comment).
- Archive artefacts (PDF exports, diagrams) in agreed repository or DMS.

### Ready when
- Every document reflects the latest implementation.
- Audit trail demonstrates who reviewed and approved changes.
- New developers can onboard using documentation alone.

