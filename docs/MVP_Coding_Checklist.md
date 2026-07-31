# SkillBridge MVP — Coding Checklist (Theo ngày / Theo người)

> Tài liệu theo dõi tiến độ code theo [MVP_Plan.md](../../doc/MVP_Plan.md).  
> UI nguồn sự thật: [`Prototype_UI_Spec.md`](./Prototype_UI_Spec.md)  
> Cập nhật lần cuối: **2026-08-01** (Prisma migration + README/PA6 disclosure docs).

**Legend:** `[x]` hoàn thành đạt · `[~]` hoàn thành nhưng còn note · `[ ]` chưa làm

---

## 25/07/2026 — Thịnh

### Database Schema & Auth Module

- [x] Prisma schema đầy đủ 10 bảng CSDL
  - **Note:** Đã có `users`, `student_profiles`, `sme_profiles`, `tags`, `projects`, `milestones`, `applications`, `verified_portfolio_entries`, `certificates`, `acceptance_reminders`. Ba bảng cuối là stub schema cho Day 27–28.
- [~] Chạy migration / sync DB
  - **Note:** Đã có versioned migration `backend/prisma/migrations/20260730000000_init`. Clean install dùng `npm run prisma:migrate:deploy` (+ `db:seed`). DB cũ từ `db push` dùng `prisma migrate resolve --applied 20260730000000_init`.
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
  - **Note:** Approve & Release đã gọi `acceptProject` (tạo portfolio/cert + release). Request Revision đã wire modal + API.

---

## 27/07/2026 — Thịnh

### Project Acceptance & Auto-Reminder Flow

- [x] `PATCH /api/projects/:id/accept`
- [x] `PATCH /api/projects/:id/revision`
- [x] Logic `acceptance_reminders` + scheduler auto-accept
  - **Note:** Có `setInterval` scheduler trong `backend/src/server.ts` và endpoint test `POST /api/projects/test/trigger-cron`.
- [x] Wire UI nghiệm thu / yêu cầu sửa đổi
  - **Note:** UI được gộp vào `/projects/:id/milestones` thay vì có route riêng `/projects/:id/accept`.
- [x] Schema + lifecycle `acceptance_reminders`

---

## 28/07/2026 — Thịnh

### Verified Portfolio & Student Profile

- [x] Tự động tạo `verified_portfolio_entries` sau nghiệm thu / auto-accept
- [x] `GET /api/portfolio/student/:id`
- [x] UI Student Profile + Verified Portfolio
  - **Note:** Route hiện là `/student/profile/[id]`; đã fetch API thật và hiển thị portfolio entries + link certificate.
- [x] UI Student Profile + Verified Portfolio khớp prototype Hình 2 & 6
  - **Note:** Đã có tabs Overview/Portfolio/Completed/Experience, skill tiers Expert/Proficient/Familiar, stat cards, filters, portfolio cards với Share/Certificate; Experience tab giữ placeholder V1.1.

---

## 28/07/2026 — Hà

### Certificate Generator & Demo Seed Data

- [x] Sinh certificate + verification code
  - **Note:** Giữ auto-create sau nghiệm thu/auto-accept và bổ sung thêm `POST /api/certificates` cho SME/Admin nếu cần issue thủ công.
- [x] Public verify certificate API
  - **Note:** Hỗ trợ đúng path plan `GET /api/certificates/verify/:code` và vẫn giữ alias `GET /api/certificates/:code` để không gãy link cũ.
- [x] UI certificate list + link certificate
  - **Note:** `/certificates` và `/certificates/[id]` đều dùng API thật theo verification code; bỏ phụ thuộc `MOCK_CERTIFICATE`.
- [x] Export PDF / Share
  - **Note:** Certificate detail có QR verify, Export PDF qua print stylesheet, copy link, và native Web Share API (fallback clipboard).
- [x] Seed demo phong phú
  - **Note:** `prisma/seed.ts` hiện tạo 1 admin, 3 SME, 10 students, 5 projects cùng applications + milestones theo hướng idempotent để demo dễ hơn.
- [x] Schema + certificates list API đã có

---

## 29–31/07/2026

- [~] **29 Hà:** E2E Flow 1–2 (Auth → Post → Apply)
  - **Note:** Audit + bugfix 30/7 đã harden Flow 1–2. Minh chứng video/screenshot do thành viên khác chuẩn bị (`docs/prototype/` + video demo).
- [~] **29 Thịnh:** E2E Flow 3–4 + README/screenshots
  - **Note:** Bug T1–T5 + P0 escrow đã FIXED. README PA6-ready + Dependencies/AI disclosure đã bổ sung (01/8).
- [~] **30 Cả 2:** Feature freeze & dry-run demo
  - **Note:** Feature freeze theo MVP; dry-run + video do nhóm hoàn tất ngoài PR docs này.
- [~] **31 Cả 2:** Đóng gói `04.zip` + verify clean install
  - **Note:** Còn bước nén zip theo mã nhóm + verify clean install trước nộp Moodle.

Chi tiết bug: [`docs/bugs/report.md`](./bugs/report.md)  
Disclosure PA6: [`docs/Dependencies_And_AI_Disclosure.md`](./Dependencies_And_AI_Disclosure.md)

---

## Merge Notes — Hà → main (cho Thịnh pull)

| Hạng mục | Mức | Chi tiết |
| :---- | :---- | :---- |
| Applications + confirm-match | **Blocking** | Milestone submit cần `ACCEPTED` |
| Escrow API + enum | **Cao** | Accept nên gọi `escrow/release` |
| Schema stubs Day 28 | **Tích cực** | Portfolio / certificate / reminders |
| Prototype UI Spec | **Chung** | Dùng cho mọi UI task |

**Đã merge phần nền của Hà; hiện cần đồng bộ tiếp các gap còn lại của Day 28 trước khi sang 29/7.**

---

## Demo accounts (`password123`)

| Email | Role |
| :---- | :---- |
| `admin@skillbridge.com` | ADMIN |
| `techcorp@sme.com` | SME |
| `folio@sme.com` | SME |
| `growth@sme.com` | SME |
| `an.nguyen@student.edu.vn` | STUDENT |
| `binh.tran@student.edu.vn` | STUDENT |
| `chi.le@student.edu.vn` | STUDENT |
| `duy.vo@student.edu.vn` | STUDENT |
| `ha.pham@student.edu.vn` | STUDENT |
| `khanh.do@student.edu.vn` | STUDENT |
| `linh.ngo@student.edu.vn` | STUDENT |
| `minh.bui@student.edu.vn` | STUDENT |
| `nhi.truong@student.edu.vn` | STUDENT |
| `phuc.nguyen@student.edu.vn` | STUDENT |
