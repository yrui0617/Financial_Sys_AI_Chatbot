# Chapter 1 · Setup

## 1.0 How to Use This Chapter
- Content is grouped by **Beginner**, **Intermediate**, and **Expert** tracks.
- Work through the track that matches your current familiarity; revisit higher tiers as you progress.
- Each section ends with “Ready When” checkpoints so you know you can move on.

## 1.1 Beginner Track · First-Time Launch
### Goal
Get corradAF running locally with a working database and login.

### Step-by-step
1. **Verify prerequisites**
   - Install Node.js 18+ (`node -v`), Yarn (`yarn -v`), and Git (`git --version`).
   - Install a SQL database (MySQL 8 recommended). Optional: Docker `mysql` container.
2. **Clone the project**
   ```bash
   git clone <repo_url> sales-kit
   cd sales-kit
   ```
3. **Install dependencies**
   ```bash
   yarn install
   ```
4. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```
   Fill in minimum values:
   - `DATABASE_URL="mysql://username:password@localhost:3306/corrad_af"`
   - `JWT_SECRET` & `NUXT_SECRET_KEY`: generate strong random strings.
   - `AUTH_ORIGIN="http://localhost:3000"`
5. **Prepare database**
   - Create database schema: `CREATE DATABASE corrad_af;`
   - Run Prisma client generation:
     ```bash
     yarn prisma:generate
     ```
   - Apply development migrations:
     ```bash
     npx prisma migrate dev --name init
     ```
6. **Start the app**
   ```bash
   yarn dev
   ```
   Visit `http://localhost:3000`.
7. **Log in / explore**
   - Use seeded credentials if provided (check project README) or register via `/register`.
   - Open `/devtool/user-management` to confirm API and DB connectivity.

### Ready when
- `yarn dev` runs without errors.
- You can sign in and open DevTool modules.
- Database tables exist (verify via Prisma Studio: `npx prisma studio`).

## 1.2 Intermediate Track · Team-ready Environment
### Goal
Prepare a reproducible environment for collaborative development.

- **Environment isolation**
  - Use `.env.local` for developer-specific overrides; keep `.env` committed as template only.
  - Document custom env keys in `SETUP.md`.
- **Database workflows**
  - Use Docker Compose or cloud-hosted MySQL for shared environments.
  - Create seed scripts under `prisma/seed` for baseline data, and run via `npx prisma db seed`.
  - Schedule regular `prisma migrate dev` runs to validate schema drift.
- **DevTool suite**
  - `/devtool/api-editor`: test new endpoints without leaving browser.
  - `/devtool/orm`: inspect Prisma models and generated tables.
- **Tooling stack**
  - Recommended VS Code extensions: ESLint, Tailwind CSS IntelliSense, Prisma, Vue Language Features (Volar).
  - Enable Nuxt DevTools: `npx nuxi devtools enable`.
- **Quality gates**
  - Run `yarn lint` (if configured) before pushing.
  - Use `.editorconfig` and Prettier settings (see project root) to ensure consistent formatting.

### Ready when
- Every developer follows the same checklist without manual intervention.
- New machines come online in under 15 minutes.
- Seed data exists for core flows (auth, roles, sample records).

## 1.3 Expert Track · Automation & Deployment
### Goal
Automate setup, secure secrets, and plan production rollouts.

- **Automation scripts**
  - Use the provided `package.json` script `"prisma"` which runs `yarn prisma:generate && nuxt dev` for rapid bootstrapping.
  - Add onboarding scripts (e.g. `yarn setup` combining install, env validation, migrate).
- **CI/CD integration**
  - Pipeline steps:
    1. Install dependencies (`yarn install --frozen-lockfile`).
    2. Generate Prisma client (`yarn prisma:generate`).
    3. Run tests/linting.
    4. Build (`yarn build`).
    5. Upload artifacts or deploy Nitro server.
  - Apply migrations on deploy using `npx prisma migrate deploy`.
- **Secret management**
  - Store secrets in vault (Azure Key Vault, AWS Secrets Manager, GitLab CI variables).
  - Rotate JWT and DB credentials quarterly.
- **Observability**
  - Enable structured logging in Nitro (consider `pino` or similar).
  - Configure health checks hitting key endpoints (`/api/auth/validate`).
- **Security hardening**
  - Enforce HTTPS before enabling `Secure` cookies in production.
  - Review `nuxt-security` config for CSP, XSS, clickjacking protections.
  - Schedule OWASP ASVS checklist reviews.

### Ready when
- CI can build and report status without manual steps.
- Deployment pipelines automatically run migrations and smoke tests.
- Disaster recovery playbook covers database backup/restore and secret rotation.

## 1.4 Troubleshooting Cheat Sheet
- **Database connection failure**
  - Verify `DATABASE_URL`, ensure DB running (`mysqladmin ping`), check firewall rules.
- **Prisma client missing**
  - Run `yarn prisma:generate`; delete `.prisma` cache if necessary.
- **JWT validation errors**
  - Ensure `JWT_SECRET` matches between login and validation services; clear cookies after rotating secrets.
- **Port conflict**
  - Set `NUXT_PORT=4000` (or another free port) in `.env`.
- **DevTool blank page**
  - Confirm logged-in user has Developer role (`/devtool/user-management/user`).

## 1.5 Reference Materials
- `README.md` — high-level feature overview and quick start.
- `SETUP.md` — environment variable catalogue and deployment notes.
- `llms.txt` — authoritative coding standards for corradAF.
- Prisma docs — https://www.prisma.io/docs for schema and migration guidance.
