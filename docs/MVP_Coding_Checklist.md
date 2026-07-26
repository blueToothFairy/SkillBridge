# SkillBridge MVP — Coding Checklist (Theo ngày / Theo người)

> Tài liệu theo dõi tiến độ code theo [MVP_Plan.md](../../doc/MVP_Plan.md).  
> UI nguồn sự thật: [`Prototype_UI_Spec.md`](./Prototype_UI_Spec.md)  
> Cập nhật lần cuối: **2026-07-27** (nhánh `ha`).

**Legend:** `[x]` hoàn thành đạt · `[~]` hoàn thành nhưng còn note · `[ ]` chưa làm

---

## 25/07/2026 — Thịnh

### Database Schema & Auth Module

- [x] Prisma schema đầy đủ 10 bảng CSDL
  - **Note:** Đã có `users`, `student_profiles`, `sme_profiles`, `tags`, `projects`, `milestones`, `applications`, `verified_portfolio_entries`, `certificates`, `acceptance_reminders`. Ba bảng cuối là stub schema cho Day 27–28.
- [~] Chạy migration / sync DB
  - **Note:** Dùng `npx prisma db push` (+ `prisma generate`). Nên tạo migration versioned trước demo cuối.
- [x] Backend Auth API: `POST /api/auth/register`, `POST /api/auth/login`
- [x] JWT middleware + `GET /api/auth/me`, `PATCH /api/auth/profile`
- [x] Frontend AuthContext + `/login`, `/register`
- [x] Lưu JWT trong `localStorage` (`sb_auth_token`)

### Project Management & Tag System

- [x] API Tags: `GET /api/tags`, `POST /api/tags`
- [x] API Projects: `POST /api/projects`, `GET /api/projects`, `GET /api/projects/:id`
- [x] Bổ sung: `PATCH /api/projects/:id`, admin review, `?mine=true` cho SME dashboard
- [x] UI `ProjectForm.tsx` (budget, skill tags, category, milestones)
  - **Note UI:** Tham chiếu Hình 1 stepper — polish visual còn lại cho Thịnh.
- [x] Trang browse `/projects`, `/student/browse`
- [x] Alias đăng bài `/projects/create` → `/sme/post-project`

---

## 26/07/2026 — Hà

### Application & Skill Matching

- [x] API `POST /api/applications` (sinh viên ứng tuyển + cover letter)
- [x] API `GET /api/applications/me`
- [x] API `GET /api/applications/project/:projectId` (SME xem ứng viên, sort theo match %)
- [x] API `PATCH /api/applications/:id/status` (SHORTLISTED / ACCEPTED / REJECTED)
- [x] API `POST /api/applications/confirm-match`
- [x] API `DELETE /api/applications/:id` (withdraw)
- [x] Algorithm skill-matching deterministic (`backend/src/utils/skillMatch.ts`)
- [x] UI `ApplyModal.tsx` + Apply từ Browse card / project detail
  - **Note UI:** Align prototype Hình 3; primary `#2563EB`.
- [x] UI SME applicants `/sme/projects/:id/applicants` (sorted by % match)
- [x] Redirect legacy `/sme/matching/:id` → applicants page
- [x] Trang `/student/applications` dùng API thật
- [x] Browse Projects layout khớp Hình 3 (search bar, filter list, 2-col cards, Apply CTA)

---

## 26/07/2026 — Thịnh

### Milestone Tracking System

- [x] API tạo milestone: `POST /api/milestones` (+ tạo kèm khi `POST /api/projects`)
- [x] API `GET /api/milestones?projectId=`
- [x] API `PATCH /api/milestones/:id/submit`
- [x] API `PATCH /api/milestones/:id/review` (APPROVE / REVISE)
- [x] API `PATCH /api/milestones/:id/cancel` (extra)
- [x] UI Milestone Progress Bar + `/projects/:id/milestones`
- [x] Lifecycle PENDING → SUBMITTED → ACCEPTED / REVISION_REQUIRED
  - **Note UI:** Workspace full (Hình 4) là V1.1 — MVP dùng trang milestones.

---

## 27/07/2026 — Hà

### Simulated Escrow System

- [x] API `POST /api/escrow/deposit`
- [x] API `POST /api/escrow/release`
- [x] API `GET /api/escrow/status?projectId=`
- [x] State machine `PENDING → HELD → RELEASED` (HELD ≈ SRS `LOCKED`)
  - **Note:** Enum giữ `NONE` legacy; API normalize → `PENDING`.
- [x] Deposit sau match → `HELD` + `IN_PROGRESS` khi đã ACCEPTED applicants
- [x] Tracking quỹ theo milestone trên status API
- [x] UI `EscrowModal.tsx`
- [x] UI `EscrowBadge.tsx`
- [x] Trang `/escrow/[id]` khớp Hình 5 (summary, Released/Ready/Locked, Decision card)
  - **Note:** Nút Request Revision disabled stub — chờ Thịnh API revise.

---

## 27/07/2026 — Thịnh *(chưa làm trên nhánh `ha`)*

### Project Acceptance & Auto-Reminder Flow

- [ ] `POST /api/projects/:id/accept`
- [ ] `POST /api/projects/:id/revise`
- [ ] Logic `acceptance_reminders` + cron/utility auto-accept
- [ ] Wire UI Decision card Hình 5 (Accept + Request Revision)
- [~] Schema stub `acceptance_reminders` đã có trên `ha`

---

## 28/07/2026 — Thịnh

### Verified Portfolio & Student Profile

- [ ] API tạo `verified_portfolio_entries` sau nghiệm thu
- [ ] `GET /api/portfolio/student/:id`
- [ ] UI Profile (Hình 2) + Verified Portfolio (Hình 6)
- [~] Schema stub đã có · Spec: `Prototype_UI_Spec.md` §3 & §7

---

## 28/07/2026 — Hà

### Certificate Generator & Demo Seed Data

- [ ] `POST /api/certificates` + verification code
- [ ] `GET /api/certificates/verify/:code`
- [ ] UI `/certificates/:code` + nút Certificate (Hình 6)
- [~] Seed demo cơ bản đã có — chưa đủ 5+ projects / 10+ students / 3+ SME
- [~] Schema stub `certificates` đã có

---

## 29–31/07/2026

- [ ] **29 Hà:** E2E Flow 1–2 (Auth → Post → Apply)
- [ ] **29 Thịnh:** E2E Flow 3–4 + README/screenshots
- [ ] **30 Cả 2:** Feature freeze & dry-run demo
- [ ] **31 Cả 2:** Đóng gói `04.zip` + verify clean install

---

## Merge Notes — Hà → main (cho Thịnh pull)

| Hạng mục | Mức | Chi tiết |
| :---- | :---- | :---- |
| Applications + confirm-match | **Blocking** | Milestone submit cần `ACCEPTED` |
| Escrow API + enum | **Cao** | Accept nên gọi `escrow/release` |
| Schema stubs Day 28 | **Tích cực** | Portfolio / certificate / reminders |
| Prototype UI Spec | **Chung** | Dùng cho mọi UI task |

**Khuyến nghị:** merge `ha` → `main` sớm trước khi Thịnh code Acceptance.

---

## Demo accounts (`password123`)

| Email | Role |
| :---- | :---- |
| `admin@skillbridge.com` | ADMIN |
| `techcorp@sme.com` | SME |
| `an.nguyen@student.edu.vn` | STUDENT |
| `binh.tran@student.edu.vn` | STUDENT |
