# Coding Standards

## SkillBridge — MVP / Pilot (Q3/2026)

| Field            | Value                                     |
| :--------------- | :---------------------------------------- |
| **Document ID**  | SCD-SKILLBRIDGE-MVP-001                   |
| **Version**      | 2.0                                       |
| **Date**         | 2026-07-16                                |
| **Authors**      | SkillBridge Engineering Team              |
| **Status**       | Draft                                     |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [TypeScript Standards](#4-typescript-standards)
5. [React & Next.js Conventions](#5-react--nextjs-conventions)
6. [Backend Conventions](#6-backend-conventions)
7. [SOLID Principles](#7-solid-principles)
8. [Testing Standards](#8-testing-standards)
9. [Git Workflow](#9-git-workflow)
10. [Code Review Checklist](#10-code-review-checklist)
11. [Documentation Standards](#11-documentation-standards)

---

## 1. Overview

This document defines conventions that **cannot be enforced by automated tools**. Formatting rules (semicolons, quotes, indentation, trailing commas, import ordering, `const` vs `let`, etc.) are handled by **ESLint + Prettier** and are not repeated here.

**Automated enforcement stack:**

| Tool           | Purpose                                |
| :------------- | :------------------------------------- |
| **ESLint**     | Static analysis & code rules           |
| **Prettier**   | Code formatting                        |
| **TypeScript** | Type checking (strict mode)            |
| **Husky**      | Pre-commit hooks (lint + format)       |
| **lint-staged**| Run linters on staged files only       |

See config files in the repository root: `.eslintrc.js`, `.prettierrc`, `tsconfig.json`.

---

## 2. Project Structure

### 2.1 Repository Layout

```
skillbridge/
├── frontend/               # Next.js application
├── backend/                # Express API server
├── docs/                   # Documentation
├── .github/workflows/      # CI/CD pipelines
├── .gitignore
├── README.md
└── package.json            # Root workspace config
```

### 2.2 Frontend Structure

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (dashboard)/        # Dashboard pages (student, sme, admin)
│   ├── projects/           # Project listing & [id] detail
│   ├── profile/[id]/       # Profile pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── loading.tsx         # Global loading
│   ├── error.tsx           # Error boundary
│   └── not-found.tsx       # 404
├── components/             # Reusable UI components
│   ├── common/             # Button, Input, Modal, Card, Badge, Spinner
│   ├── layout/             # Header, Footer, Sidebar
│   ├── project/            # ProjectCard, ProjectList, ProjectForm
│   ├── profile/            # StudentProfile, SMEProfile, SkillBadge
│   └── milestone/          # MilestoneList, MilestoneCard
├── hooks/                  # useAuth, useProjects, useApplications, useMilestones
├── lib/                    # api.ts, auth.ts, utils.ts, constants.ts
├── types/                  # user.ts, project.ts, application.ts, milestone.ts, api.ts
├── styles/                 # globals.css, variables.css
└── context/                # AuthContext, ThemeContext
```

### 2.3 Backend Structure

```
backend/src/
├── config/                 # database.ts, env.ts, cors.ts
├── modules/                # Feature modules (domain-driven)
│   ├── auth/               # auth.controller.ts, auth.service.ts, auth.routes.ts,
│   │                       # auth.validation.ts, auth.types.ts
│   ├── user/               # (same pattern)
│   ├── project/
│   ├── application/
│   ├── milestone/
│   ├── matching/
│   ├── escrow/
│   ├── portfolio/
│   └── certificate/
├── middleware/             # auth, role, validation, rateLimiter, error
├── utils/                  # logger.ts, response.ts, errors.ts, pagination.ts
├── prisma/                 # schema.prisma, seed.ts, migrations/
├── app.ts                  # Express app setup
└── server.ts               # Entry point
```

### 2.4 File Organization Rules

| Rule                                      | Rationale                              |
| :---------------------------------------- | :------------------------------------- |
| One component/class per file              | Easy to locate and maintain            |
| File name matches the default export      | `ProjectCard.tsx` exports `ProjectCard` |
| Group by feature/domain, not by file type | `modules/project/` not `controllers/`  |
| Use barrel exports (`index.ts`)           | Clean imports: `from '@/components/common'` |
| Keep files under 300 lines                | Refactor if longer                     |

---

## 3. Naming Conventions

### 3.1 Reference Table

| Element                   | Convention          | Example                                      |
| :------------------------ | :------------------ | :------------------------------------------- |
| **Files (Component)**     | PascalCase          | `ProjectCard.tsx`                            |
| **Files (Non-component)** | camelCase           | `useProjects.ts`, `auth.service.ts`          |
| **Files (Config/Style)**  | kebab-case          | `globals.css`, `next.config.js`              |
| **Directories**           | kebab-case          | `common/`, `milestone/`                      |
| **Variables**             | camelCase           | `projectList`, `isLoading`                   |
| **Constants**             | UPPER_SNAKE_CASE    | `MAX_TEAM_SIZE`, `JWT_EXPIRES_IN`            |
| **Functions**             | camelCase (verb-first) | `getProjectById()`, `validateInput()`     |
| **Classes**               | PascalCase          | `ProjectService`, `AppError`                 |
| **Interfaces/Types**      | PascalCase          | `CreateProjectDTO`, `ApiResponse<T>`         |
| **Enums**                 | PascalCase          | `ProjectStatus`                              |
| **Enum Members**          | UPPER_SNAKE_CASE    | `ProjectStatus.IN_PROGRESS`                  |
| **React Components**      | PascalCase          | `<ProjectCard />`                            |
| **Custom Hooks**          | `use` prefix        | `useAuth()`, `useProjects()`                 |
| **CSS Classes (modules)** | camelCase           | `.projectCard`, `.milestoneTitle`            |
| **Database Tables**       | snake_case (plural) | `users`, `student_profiles`                  |
| **Database Columns**      | snake_case          | `created_at`, `user_id`                      |
| **API Endpoints**         | kebab-case (plural) | `/api/v1/projects`                           |
| **Environment Variables** | UPPER_SNAKE_CASE    | `DATABASE_URL`, `JWT_SECRET`                 |

### 3.2 Key Rules

- **Booleans**: Use `is`, `has`, `can`, `should` prefixes (`isAuthenticated`, `hasApplied`)
- **Functions**: Verb-first (`getProjectById`, `createApplication`, `validateInput`)
- **Handlers**: `handle` prefix (`handleSubmit`, `handleProjectClick`)

---

## 4. TypeScript Standards

### 4.1 Type Safety Rules

| Rule                                   | Enforcement  |
| :------------------------------------- | :----------: |
| Never use `any`                        | ❌ Forbidden |
| Use `unknown` for truly unknown types  | ✅ Preferred |
| Define interfaces for all API responses| ✅ Required  |
| Define DTOs for all request bodies     | ✅ Required  |
| Use `enum` or union types for fixed sets| ✅ Required |
| Minimize type assertions (`as`)        | ⚠️ Minimize |

### 4.2 Reference Configuration

```jsonc
// tsconfig.json — key options
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

## 5. React & Next.js Conventions

### 5.1 Component Structure

Every component SHOULD follow this internal order:

1. **Imports** (external → internal → relative → styles)
2. **Type definitions** (props interface)
3. **Component function** (named export preferred)
   - a. Hooks
   - b. Derived state
   - c. Event handlers
   - d. Effects
   - e. Early returns (loading, error)
   - f. Render

### 5.2 Component Rules

| Rule                                              | Rationale                         |
| :------------------------------------------------ | :-------------------------------- |
| One component per file                            | Clarity                           |
| Functional components only (no class components)  | Modern React                      |
| Props defined with TypeScript interfaces          | Type safety                       |
| Named exports (not default exports)               | Better refactoring                |
| Components under 150 lines                        | Extract sub-components if longer  |
| Complex logic extracted into custom hooks         | Separation of concerns            |
| CSS Modules for styling                           | Scoped, no collisions             |

---

## 6. Backend Conventions

### 6.1 Module File Pattern

Each backend module follows this structure:

| File                 | Responsibility                                         |
| :------------------- | :----------------------------------------------------- |
| `*.routes.ts`        | Express routes, attach middleware and controller        |
| `*.controller.ts`    | Parse request, call service, format response            |
| `*.service.ts`       | Business logic, database access via Prisma              |
| `*.validation.ts`    | Zod schemas for request validation                      |
| `*.types.ts`         | TypeScript interfaces for the module                    |

### 6.2 Critical Layer Rules

> [!IMPORTANT]
> These rules ensure testability and maintainability:
> - **Controllers** MUST NOT contain business logic or access the database
> - **Controllers** MUST delegate all logic to the service layer
> - **Controllers** MUST use `next(error)` for error propagation
> - **Services** MUST NOT access `req` or `res` objects
> - **Services** throw custom `AppError` subclasses for error conditions

---

## 7. SOLID Principles

### 7.1 Application to SkillBridge

| Principle | Application                                                                |
| :-------- | :------------------------------------------------------------------------- |
| **SRP**   | Controller / Service / Validation separation in every module                |
| **OCP**   | Strategy pattern for matching (MVP: skill-tag → V1.1: rule-based → V2.0: AI) |
| **LSP**   | Escrow providers are interchangeable (Simulated → VNPay)                    |
| **ISP**   | Small interfaces: `ProjectReader`, `ProjectWriter`, `ProjectStatusManager`  |
| **DIP**   | Services depend on interfaces (`NotificationSender`, `EscrowProvider`)      |

### 7.2 Example: Open/Closed Principle (Matching Strategy)

```typescript
// Interface — stable, never modified
export interface MatchingStrategy {
  findMatches(project: Project, candidates: Student[]): ScoredStudent[];
}

// MVP implementation
export class SkillTagMatchingStrategy implements MatchingStrategy {
  findMatches(project: Project, candidates: Student[]): ScoredStudent[] {
    return candidates
      .map(s => ({ student: s, score: this.calculateOverlap(project.requiredSkills, s.skills) }))
      .sort((a, b) => b.score - a.score);
  }
}

// V1.1: Add without modifying existing code
export class RuleBasedMatchingStrategy implements MatchingStrategy { /* ... */ }

// V2.0: Add without modifying existing code
export class AIMatchingStrategy implements MatchingStrategy { /* ... */ }

// Service uses dependency injection
export class MatchingService {
  constructor(private strategy: MatchingStrategy) {}
  async getRecommendations(projectId: string) {
    const project = await this.getProject(projectId);
    const candidates = await this.getCandidates(project);
    return this.strategy.findMatches(project, candidates);
  }
}
```

---

## 8. Testing Standards

### 8.1 Strategy

| Test Type          | Scope                            | Tool             | Target         |
| :----------------- | :------------------------------- | :--------------- | :------------- |
| **Unit Tests**     | Services, utilities, validation  | Jest             | ≥ 60% (core)   |
| **Integration**    | API endpoints (route → DB)       | Jest + Supertest | Key flows      |
| **E2E**            | Critical user flows              | Playwright       | Deferred to V1.1|

### 8.2 Conventions

| Convention                                   | Example                                    |
| :------------------------------------------- | :----------------------------------------- |
| Unit test: `*.test.ts`                       | `project.service.test.ts`                  |
| Integration: `*.integration.test.ts`         | `project.routes.integration.test.ts`       |
| Test utility: `*.helper.ts`                  | `auth.helper.ts`                           |
| Use AAA pattern (Arrange, Act, Assert)       | —                                          |
| Descriptive names: `should...when...`        | `should create project with valid data`    |
| Mock external dependencies                   | DB, email service                          |
| Test behavior, not implementation details    | —                                          |
| Clean up test data in `afterEach`/`afterAll` | —                                          |

---

## 9. Git Workflow

### 9.1 Branch Strategy

```mermaid
gitgraph
    commit id: "Initial setup"
    branch develop
    checkout develop
    commit id: "feat: auth module"
    branch feature/milestone-tracking
    checkout feature/milestone-tracking
    commit id: "feat: milestone CRUD"
    checkout develop
    merge feature/milestone-tracking id: "Merge"
    checkout main
    merge develop id: "Release v0.1.0"
```

| Branch       | Purpose                    | Source    | Merges Into        |
| :----------- | :------------------------- | :------- | :----------------- |
| `main`       | Production-ready code      | —        | —                  |
| `develop`    | Integration branch         | `main`   | `main`             |
| `feature/*`  | New features               | `develop`| `develop`          |
| `bugfix/*`   | Bug fixes                  | `develop`| `develop`          |
| `hotfix/*`   | Critical production fixes  | `main`   | `main` + `develop` |

### 9.2 Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

| Type       | Usage                                | Example                                |
| :--------- | :----------------------------------- | :------------------------------------- |
| `feat`     | New feature                          | `feat(project): add milestone tracking`|
| `fix`      | Bug fix                              | `fix(auth): resolve JWT expiration`    |
| `docs`     | Documentation                        | `docs: update SRS`                     |
| `refactor` | Code change (no fix/feat)            | `refactor(matching): extract strategy` |
| `test`     | Adding/updating tests                | `test(project): add unit tests`        |
| `chore`    | Maintenance, dependencies            | `chore: update Prisma to v5.10`        |

### 9.3 Pull Request Rules

| Rule                                         | Requirement |
| :------------------------------------------- | :---------: |
| Title follows commit convention              | Required    |
| Description explains **what** and **why**    | Required    |
| All CI checks pass                           | Required    |
| At least 1 code review approval              | Required    |
| No direct commits to `main` or `develop`     | Required    |
| PR size ≤ 400 lines changed                  | Recommended |
| Linked to issue/task                         | Recommended |

---

## 10. Code Review Checklist

When reviewing a Pull Request:

**Correctness**
- [ ] Does the code do what the PR says?
- [ ] Are edge cases handled?
- [ ] Are error conditions handled?

**Design**
- [ ] Follows layered architecture (Controller → Service → DAL)?
- [ ] Respects SOLID principles?
- [ ] No unnecessary complexity?
- [ ] No hard-coded values (should be constants/config)?

**Code Quality**
- [ ] Follows naming conventions?
- [ ] Readable without excessive comments?
- [ ] Functions/components small and focused?
- [ ] TypeScript types used properly (no `any`)?

**Security**
- [ ] Inputs validated?
- [ ] Authorization checked (correct role)?
- [ ] Sensitive data handled properly?
- [ ] No SQL injection or XSS risk?

**Testing**
- [ ] Tests for new business logic?
- [ ] Existing tests still pass?
- [ ] Test names descriptive?

---

## 11. Documentation Standards

### 11.1 Code Comments

- **Comment WHY, not WHAT**
- Write comments for non-obvious decisions, workarounds, and business context
- Don't comment obvious code

```typescript
// ✅ GOOD — Explains WHY
// Simulated escrow in MVP; real payment gateway requires Legal approval (V1.1)
async function depositEscrow(projectId: string) { /* ... */ }

// ❌ BAD — States the obvious
// This function deposits escrow
async function depositEscrow(projectId: string) { /* ... */ }
```

### 11.2 JSDoc

Use JSDoc for **public service methods**. Include `@param`, `@returns`, `@throws`.

### 11.3 Module README

Each backend module SHOULD have a brief README with: purpose, file list, key concepts.

---

*End of Coding Standards — SkillBridge MVP v2.0*
