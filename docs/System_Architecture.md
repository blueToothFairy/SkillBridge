# System Architecture Document

## SkillBridge — MVP / Pilot (Q3/2026)

| Field            | Value                                     |
| :--------------- | :---------------------------------------- |
| **Document ID**  | SAD-SKILLBRIDGE-MVP-001                   |
| **Version**      | 2.0                                       |
| **Date**         | 2026-07-16                                |
| **Authors**      | SkillBridge Engineering Team              |
| **Status**       | Draft                                     |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architectural Goals & Principles](#2-architectural-goals--principles)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Design](#7-database-design)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [API Architecture](#9-api-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Scalability & Evolution](#12-scalability--evolution)
13. [Monitoring & Logging](#13-monitoring--logging)

---

## 1. Introduction

This document describes **how** the SkillBridge MVP is built. For **what** it must do, see the [SRS](./SRS_MVP.md). For coding conventions, see [Coding Standards](./Source_Code_Documentation.md).

---

## 2. Architectural Goals & Principles

### 2.1 Goals

| Goal                    | Description                                                            |
| :---------------------- | :--------------------------------------------------------------------- |
| **Rapid Development**   | Deployable within Q3/2026 by a 2-person team                          |
| **Simplicity**          | Monolithic architecture; avoid over-engineering                        |
| **Extensibility**       | Design for future modularization (V1.1: escrow, V2.0: AI)             |
| **Cost Efficiency**     | Free-tier cloud services; minimal operational overhead                 |

### 2.2 Architectural Principles

1. **Modular Monolith** — Well-structured monolith organized by domain modules, enabling future decomposition
2. **API-First** — Frontend and backend communicate exclusively via REST APIs
3. **Separation of Concerns** — Clear boundaries between presentation, business logic, and data access
4. **Security by Design** — Auth, authorization, and input validation built in from the start

---

## 3. High-Level Architecture

### 3.1 System Context

```mermaid
graph TB
    subgraph "External Users"
        Student["🎓 Student"]
        SME["🏢 SME"]
        Admin["⚙️ Admin"]
    end

    subgraph "SkillBridge Platform"
        WebApp["Web Application<br>(Next.js)"]
        APIServer["API Server<br>(Node.js / Express)"]
        Scheduler["Scheduled Tasks<br>(Acceptance Timeout)"]
        DB["PostgreSQL"]
    end

    Student -->|HTTPS| WebApp
    SME -->|HTTPS| WebApp
    Admin -->|HTTPS| WebApp

    WebApp -->|REST API| APIServer
    APIServer -->|SQL| DB
    Scheduler -->|SQL| DB
```

> [!NOTE]
> External services (Email, OAuth, Cloud Storage) are **not part of the MVP**. See [SRS §13.2](./SRS_MVP.md#132-future-enhancements-not-in-mvp) for the feature roadmap.

### 3.2 Component Architecture

```mermaid
graph LR
    subgraph "Frontend (SPA)"
        Pages["Pages / Routes"]
        Components["UI Components"]
        State["State Management"]
        APIClient["API Client"]
    end

    subgraph "Backend (API Server)"
        Router["Express Router"]
        Middleware["Middleware"]
        Controllers["Controllers"]
        Services["Services"]
        DAL["Data Access (Prisma)"]
    end

    subgraph "Data"
        PG["PostgreSQL"]
    end

    Pages --> Components
    Pages --> State
    State --> APIClient
    APIClient -->|HTTP/JSON| Router
    Router --> Middleware --> Controllers --> Services --> DAL --> PG
```

---

## 4. Technology Stack

### 4.1 Stack Overview

| Layer              | Technology              | Rationale                                         |
| :----------------- | :---------------------- | :------------------------------------------------ |
| **Frontend**       | Next.js (React)         | SSR/SSG, file-based routing, large ecosystem      |
| **Styling**        | CSS Modules             | Scoped styles, no external deps                   |
| **Backend**        | Node.js + Express       | Lightweight, full-stack JS synergy                |
| **Database**       | PostgreSQL              | ACID-compliant, JSON support, free-tier available |
| **ORM**            | Prisma                  | Type-safe queries, auto-migration                 |
| **Auth**           | JWT + bcrypt            | Stateless, industry standard                      |
| **API**            | REST (JSON)             | Simple, sufficient for MVP                        |
| **Email**          | Nodemailer (SMTP)       | Free with Gmail SMTP                              |
| **File Storage**   | Cloudinary              | Free-tier image hosting                           |
| **CI/CD**          | GitHub Actions          | Free, integrated with GitHub                      |
| **Hosting**        | Vercel (FE) + Railway (BE) | Free-tier, auto-deploy                         |

> [!IMPORTANT]
> The entire stack uses **TypeScript** (strict mode) for both frontend and backend.

### 4.2 Version Matrix

| Package    | Version  |
| :--------- | :------- |
| Node.js    | ≥ 20 LTS |
| Next.js    | ≥ 14     |
| React      | ≥ 18     |
| Express    | ≥ 4.18   |
| PostgreSQL | ≥ 15     |
| Prisma     | ≥ 5      |
| TypeScript | ≥ 5      |

---

## 5. Frontend Architecture

### 5.1 Design Decisions

| Decision               | Approach                           | Example                       |
| :--------------------- | :--------------------------------- | :---------------------------- |
| **Routing**            | Next.js App Router (file-based)    | `app/projects/[id]/page.tsx`  |
| **Components**         | Small, focused, composed into pages| `ProjectCard`, `MilestoneList`|
| **State (Server)**     | React Query / SWR                  | Project list, applications    |
| **State (Auth)**       | React Context + localStorage       | Current user, JWT token       |
| **State (UI)**         | Local `useState`                   | Modal open/close, form inputs |
| **Forms**              | React Hook Form                    | Project posting, profile edit |
| **Styling**            | CSS Modules                        | Scoped per component          |

> [!NOTE]
> Folder structure is defined in [Coding Standards §2](./Source_Code_Documentation.md#2-project-structure).

---

## 6. Backend Architecture

### 6.1 Layered Architecture

Each backend module follows a strict **3-layer pattern**:

```mermaid
graph TB
    Request["HTTP Request"] --> Router["Router"]
    Router --> Middleware["Middleware<br>(Auth, Validation)"]
    Middleware --> Controller["Controller"]
    Controller --> Service["Service"]
    Service --> DAL["Prisma ORM"]
    DAL --> DB["PostgreSQL"]

    style Controller fill:#4A90D9,color:#fff
    style Service fill:#7B68EE,color:#fff
    style DAL fill:#2ECC71,color:#fff
```

| Layer          | Responsibility                                                   |
| :------------- | :--------------------------------------------------------------- |
| **Controller** | Parse request, call service, format response. **No business logic.** |
| **Service**    | All business logic. **No access to `req`/`res` objects.**         |
| **Data Access**| Database queries via Prisma. **No business logic.**               |

### 6.2 Middleware Pipeline

| Order | Middleware        | Purpose                                          |
| :---: | :---------------- | :----------------------------------------------- |
| 1     | CORS              | Allow frontend origin                            |
| 2     | Body Parser       | Parse JSON bodies                                |
| 3     | Request Logger    | Log method, path, status, duration               |
| 4     | Rate Limiter      | 100 req/min per IP                               |
| 5     | Auth Middleware    | Verify JWT, attach user                          |
| 6     | Role Middleware    | Check role permissions                           |
| 7     | Validation        | Validate body/params via Zod schemas             |
| 8     | Error Handler     | Catch and format all errors consistently         |

### 6.3 Error Handling Architecture

All errors flow through a centralized error handler. Custom error classes map to HTTP status codes:

| Error Class        | HTTP | Code                 | Usage                       |
| :----------------- | :--: | :------------------- | :-------------------------- |
| `BadRequestError`  | 400  | `BAD_REQUEST`        | Invalid input               |
| `UnauthorizedError`| 401  | `UNAUTHORIZED`       | Missing/invalid auth        |
| `ForbiddenError`   | 403  | `FORBIDDEN`          | Insufficient permissions    |
| `NotFoundError`    | 404  | `NOT_FOUND`          | Resource doesn't exist      |
| `ConflictError`    | 409  | `CONFLICT`           | Duplicate resource          |
| `ValidationError`  | 422  | `VALIDATION_ERROR`   | Schema validation failure   |

**Response envelope:**

```typescript
// Success
{ success: true, data: T, meta?: { total, page, limit, totalPages } }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

> [!NOTE]
> For implementation patterns (controller/service/route code examples), see [Coding Standards §6](./Source_Code_Documentation.md#6-backend-nodejs--express-conventions).

---

## 7. Database Design

### 7.1 Schema

```mermaid
erDiagram
    USER ||--o| STUDENT_PROFILE : has
    USER ||--o| SME_PROFILE : has
    
    USER {
        uuid id PK
        string email UK
        string password_hash
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    STUDENT_PROFILE {
        uuid id PK
        uuid user_id FK "Xác thực duy nhất"
        string full_name
        string university
        string major
        int year
        text bio
        string skill_tags
        string github_url
        string avatar_url
    }

    SME_PROFILE {
        uuid id PK
        uuid user_id FK "Xác thực duy nhất"
        string company_name
        string industry
        text description
        string contact_phone
        string website
        string logo_url
    }

    TAG {
        uuid id PK
        string name UK
        string type
        boolean is_active
    }

    PROJECT {
        uuid id PK
        uuid sme_id FK
        string title
        text description
        string required_skill_tags
        uuid category_tag_id FK
        decimal budget
        int duration_weeks
        int max_applicants
        datetime deadline
        string status
        string escrow_status
        datetime accepted_at
        boolean is_auto_accepted
        datetime created_at
        datetime updated_at
    }

    MILESTONE {
        uuid id PK
        uuid project_id FK
        string title
        text description
        datetime deadline
        int order_index
        string status
        string deliverable_url
        text feedback
        datetime submitted_at
        datetime reviewed_at
    }

    APPLICATION {
        uuid id PK
        uuid project_id FK
        uuid student_id FK
        text cover_message
        string status
        datetime created_at
    }

    VERIFIED_PORTFOLIO_ENTRY {
        uuid id PK
        uuid student_id FK
        uuid project_id FK
        string project_title
        string sme_name
        string student_role
        int duration_weeks
        string skills_applied
        string deliverable_url
        datetime completed_at
        boolean is_verified
    }

    CERTIFICATE {
        uuid id PK
        uuid student_id FK
        uuid project_id FK
        string student_name
        string project_title
        string sme_name
        datetime issued_at
        string verification_code UK
    }

    ACCEPTANCE_REMINDER {
        uuid id PK
        uuid project_id FK
        int reminder_number
        datetime scheduled_at
        datetime triggered_at
    }

    SME_PROFILE ||--o{ PROJECT : posts
    TAG ||--o{ PROJECT : categorizes
    PROJECT ||--o{ MILESTONE : contains
    PROJECT ||--o{ APPLICATION : receives
    STUDENT_PROFILE ||--o{ APPLICATION : submits
    STUDENT_PROFILE ||--o{ VERIFIED_PORTFOLIO_ENTRY : earns
    STUDENT_PROFILE ||--o{ CERTIFICATE : receives
    PROJECT ||--o{ VERIFIED_PORTFOLIO_ENTRY : generates
    PROJECT ||--o{ CERTIFICATE : generates
    PROJECT ||--o{ ACCEPTANCE_REMINDER : tracks
```

> [!NOTE]
> Full entity definitions, enumerations, and constraints are in [SRS §9](./SRS_MVP.md#9-data-models).

### 7.2 Index Strategy

| Table               | Index                      | Type   | Purpose                        |
| :------------------ | :------------------------- | :----- | :----------------------------- |
| `users`             | `email`                    | Unique | Login lookup                   |
| `tags`              | `name`                     | Unique | Tag uniqueness                 |
| `projects`          | `status`                   | B-Tree | Filter by status               |
| `projects`          | `sme_id`                   | B-Tree | SME's project list             |
| `projects`          | `required_skill_tags`      | GIN    | Skill-tag matching             |
| `applications`      | `(project_id, student_id)` | Unique | Prevent duplicate applications |
| `applications`      | `student_id`               | B-Tree | Student's application history  |
| `milestones`        | `project_id`               | B-Tree | Milestone list                 |
| `portfolio_entries` | `student_id`               | B-Tree | Portfolio listing              |
| `certificates`      | `verification_code`        | Unique | Certificate verification       |

### 7.3 Migration

- **Prisma Migrate** for schema versioning
- Development: `npx prisma migrate dev`
- Production: `npx prisma migrate deploy`
- Seed data: `npx prisma db seed`

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as API Server
    participant DB

    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login
    API->>DB: Find user by email
    API->>API: Verify password (bcrypt)
    API-->>Frontend: { token: JWT, user: {...} }
    Frontend->>Frontend: Store token in localStorage

    Note over Frontend,API: Subsequent requests include Bearer token

    Frontend->>API: GET /api/projects
    API->>API: Verify JWT, extract user
    API-->>Frontend: Response
```

### 8.2 JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "STUDENT | SME | ADMIN",
  "iat": 1719792000,
  "exp": 1719878400
}
```

### 8.3 RBAC Matrix

> [!NOTE]
> Full permission matrix is in [SRS §6](./SRS_MVP.md#6-permission-matrix). Summary below.

| Action                 | Student     | SME         | Admin |
| :--------------------- | :---------: | :---------: | :---: |
| View/Search Projects   | ✅          | ✅          | ✅    |
| Create Project         | ❌          | ✅          | ❌    |
| Approve Project Post   | ❌          | ❌          | ✅    |
| Apply to Project       | ✅          | ❌          | ❌    |
| Shortlist/Accept/Reject| ❌          | ✅ (owner)  | ✅    |
| Confirm Participation  | ✅ (accepted)| ❌         | ❌    |
| Submit Deliverable URL | ✅ (member) | ❌          | ❌    |
| Review Milestone       | ❌          | ✅ (owner)  | ✅    |
| Accept/Revise Project  | ❌          | ✅ (owner)  | ✅    |
| View Portfolio         | ✅          | ✅          | ✅    |
| Manage Tags            | ❌          | ❌          | ✅    |
| Manage Users           | ❌          | ❌          | ✅    |

---

## 9. API Architecture

### 9.1 Conventions

| Convention       | Standard                                                            |
| :--------------- | :------------------------------------------------------------------ |
| **Base URL**     | `/api/v1`                                                           |
| **Methods**      | `GET` = read, `POST` = create, `PUT` = update, `DELETE` = delete    |
| **Naming**       | Plural nouns: `/projects`, `/applications`                          |
| **Response**     | JSON with `{ success, data, meta? }` or `{ success, error }` envelope |
| **Pagination**   | `?page=1&limit=10` → `meta: { total, page, limit, totalPages }`    |
| **Filtering**    | Query params: `?status=OPEN&skills=react,nodejs`                    |
| **Sorting**      | `?sort=created_at&order=desc`                                       |
| **Status Codes** | 200, 201, 400, 401, 403, 404, 422, 500                             |

> [!NOTE]
> Full endpoint catalog is in [SRS §10](./SRS_MVP.md#10-api-specification).

---

## 10. Deployment Architecture

### 10.1 Pipeline

```mermaid
graph TB
    Dev["Local Dev"] -->|git push| Repo["GitHub"]
    Repo -->|trigger| Actions["GitHub Actions (CI/CD)"]
    Actions -->|deploy FE| Vercel["Vercel (Frontend)"]
    Actions -->|deploy BE| Railway["Railway (Backend + PostgreSQL)"]
```

### 10.2 Environments

| Environment     | Frontend               | Backend                    | Database              |
| :-------------- | :--------------------- | :------------------------- | :-------------------- |
| **Development** | localhost:3000          | localhost:4000             | localhost:5432        |
| **Staging**     | staging.skillbridge.vn | api-staging.skillbridge.vn | Railway (staging)     |
| **Production**  | skillbridge.vn         | api.skillbridge.vn         | Railway (production)  |

### 10.3 Environment Variables

```bash
# Backend
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/skillbridge
JWT_SECRET=<random-64-char>
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://skillbridge.vn
ACCEPTANCE_TIMEOUT_DAYS=28

# Frontend
NEXT_PUBLIC_API_URL=https://api.skillbridge.vn/api/v1
NEXT_PUBLIC_APP_NAME=SkillBridge
```

> [!NOTE]
> SMTP, OAuth, and Cloudinary environment variables are not needed for MVP. They will be added when those features are implemented in future versions.

---

## 11. Security Architecture

### 11.1 Threat Mitigations

| Threat                       | Mitigation                                             |
| :--------------------------- | :----------------------------------------------------- |
| **SQL Injection**            | Prisma ORM (parameterized queries); no raw SQL         |
| **XSS**                     | React auto-escaping; helmet.js CSP headers             |
| **CSRF**                    | Token-based auth (JWT), no session cookies              |
| **Brute Force Login**       | Rate limiting on auth endpoints (5 attempts/min)        |
| **Data Exposure**           | Role-based API access; query scoping by ownership       |
| **Sensitive Data**          | bcrypt hashing; JWT secret rotation                     |
| **HTTPS**                   | Enforced via Vercel/Railway (automatic SSL)             |
| **Dependency Vulns**        | `npm audit` in CI; Dependabot alerts                    |

---

## 12. Scalability & Evolution

### 12.1 Optimization Strategies (MVP)

| Strategy               | Application                                         |
| :--------------------- | :-------------------------------------------------- |
| Server-Side Rendering  | Next.js SSR for initial loads (SEO + perf)          |
| Static Generation      | Landing page, public portfolios                     |
| Database Indexing      | Key fields indexed (see §7.2)                       |
| Query Optimization     | Prisma `select`/`include` to avoid N+1              |
| Image Optimization     | Next.js `<Image>` + Cloudinary CDN                  |

### 12.2 Scalability Path

```mermaid
graph LR
    subgraph "MVP"
        A["Modular Monolith"]
    end
    subgraph "V1.1"
        B["+ Redis Cache<br>+ BullMQ"]
    end
    subgraph "V2.0"
        C["API Gateway"]
        D["Auth Service"]
        E["Project Service"]
        F["AI Matching"]
        G["Notifications"]
    end
    A -->|Growth| B -->|Scale| C
    C --> D
    C --> E
    C --> F
    C --> G
```

### 12.3 Key Technical Decisions

| Decision                   | MVP Choice       | Future Consideration                                |
| :------------------------- | :--------------- | :-------------------------------------------------- |
| Monolith vs. Microservices | Monolith         | Decompose when team > 5 or traffic > 10k MAU        |
| SQL vs. NoSQL              | PostgreSQL       | Add NoSQL for unstructured data if needed            |
| REST vs. GraphQL           | REST             | Consider GraphQL for mobile app (V2.0)              |
| Payment Gateway            | Simulated        | VNPay / Momo in V1.1                                |
| Search Engine              | PostgreSQL FTS   | Meilisearch in V2.0                                 |
| Message Queue              | None             | BullMQ (Redis) in V1.1                              |

---

## 13. Monitoring & Logging

### 13.1 Logging

| Level   | Usage                                         |
| :------ | :-------------------------------------------- |
| `error` | Unhandled exceptions, critical failures       |
| `warn`  | Unexpected but recoverable situations         |
| `info`  | Business events (user registered, project posted) |
| `debug` | Technical detail (dev/staging only)           |

**Format**: Structured JSON with `timestamp`, `level`, `message`, `context`, `requestId`.

### 13.2 Monitoring Tools

| Tool            | Purpose                            | Tier |
| :-------------- | :--------------------------------- | :--- |
| Railway Metrics | Server CPU, memory, requests       | Free |
| Vercel Analytics| Frontend perf & Core Web Vitals    | Free |
| Sentry          | Error tracking & alerting          | Free |
| UptimeRobot     | Uptime monitoring                  | Free |

---

*End of System Architecture Document — SkillBridge MVP v2.0*
