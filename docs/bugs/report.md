# SkillBridge — Bug Report (E2E Flow 1–4)

> Cập nhật: **2026-07-30**  
> Phạm vi: rà soát code + đối chiếu SRS/MVP plan cho Flow 1–2 (Auth → Post → Apply → Match) và Flow 3–4 (Escrow → Milestone → Accept → Portfolio/Certificate).  
> Legend: `[FIXED]` đã sửa · `[OPEN]` còn mở (không blocker demo) · `[WONTFIX-MVP]` chấp nhận trong phạm vi MVP

---

## A. Bug gốc của Thịnh (Flow lifecycle / validation)

### Bug T1 — PATCH project cho phép gán `status` tùy ý
- **Severity:** High (security / state machine)
- **Status:** `[FIXED]` (Thịnh — PR #10)
- **Mô tả gốc:** `PATCH /api/projects/:id` nhận `data.status` và ghi thẳng vào DB.
- **Fix:** `updateProject` không còn nhận/ghi arbitrary status; chỉ cho phép edit khi `DRAFT|OPEN|UNDER_REVIEW` và ép về `UNDER_REVIEW` khi SME sửa nội dung OPEN/DRAFT.

### Bug T2 — Thiếu hủy dự án (cancel)
- **Severity:** High
- **Status:** `[FIXED]` (Thịnh core + Hà/audit cứng hóa 30/7)
- **Mô tả gốc:** Không có endpoint/UI cancel riêng.
- **Fix:**
  - Có `PATCH /api/projects/:id/cancel` + nút Cancel trên SME project detail khi `OPEN`.
  - Bổ sung chặn cancel nếu đã có application `ACCEPTED` (khớp FR-PROJ-08).

### Bug T3 — Thiếu validate `durationWeeks` (1–8) & `maxApplicants` (1–4)
- **Severity:** Medium
- **Status:** `[FIXED]` (Thịnh — PR #10)
- **Fix:** Validate trên create + update trong `project.controller.ts`. Schema default `maxApplicants` đổi về `4`.

### Bug T4 — Cho phép deadline dự án ở quá khứ
- **Severity:** Medium
- **Status:** `[FIXED]` (Thịnh + tinh chỉnh 30/7)
- **Fix:** So sánh theo calendar day để tránh false reject với date-only `YYYY-MM-DD` (UTC midnight).

### Bug T5 — Nộp deliverable khi mốc trước chưa ACCEPTED
- **Severity:** High (Flow 3)
- **Status:** `[FIXED]` (Thịnh — PR #10)
- **Fix:** Backend sequential check trong `submitDeliverable`; UI milestones/workspace cũng gate theo mốc trước.

---

## B. Bug mới phát hiện khi audit E2E 30/7 — đã fix

### Bug N1 — Escrow “Approve & Release” không nghiệm thu project (P0 Flow 4)
- **Severity:** Critical
- **Status:** `[FIXED]` (2026-07-30)
- **Mô tả:** `/escrow/[id]` chỉ gọi `releaseEscrowApi` → escrow `RELEASED` nhưng project vẫn `PENDING_ACCEPTANCE`, **không** tạo portfolio/certificate. Đây là đường CTA chính từ SME dashboard.
- **Fix:** CTA gọi `acceptProjectApi` (accept + release escrow + portfolio + certificate trong một path).

### Bug N2 — Escrow “Request Revision” còn stub disabled
- **Severity:** High
- **Status:** `[FIXED]` (2026-07-30)
- **Mô tả:** Nút disabled với note “API chưa wire” dù `PATCH /projects/:id/revision` đã có.
- **Fix:** Wire modal feedback + `requestProjectRevisionApi` trên trang escrow.

### Bug N3 — Confirm Match có thể chạy lại sau khi project đã MATCHED
- **Severity:** High
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Backend chỉ cho confirm khi `OPEN`; UI disable Confirm khi `project.status !== 'OPEN'`.

### Bug N4 — `POST /api/tags` không auth
- **Severity:** High
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** `authenticateJwt` + `requireRole(['ADMIN'])`.

### Bug N5 — ProjectForm báo success dù không có token / không gọi API
- **Severity:** High
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Block submit khi `!token`, không redirect giả.

### Bug N6 — Public `GET /api/projects?status=UNDER_REVIEW` lộ project chưa duyệt
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Public browse ép về `OPEN` nếu không phải SME `mine` / Admin.

### Bug N7 — Tạo project thiếu validate title/description/skills/budget
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Title 5–200, description 20–5000, skills 1–10, budget > 0 trên create + update.

### Bug N8 — Apply khi student chưa có skill
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** `applyToProject` yêu cầu ≥ 1 skill trong profile.

### Bug N9 — Auto-accept cron không check `PENDING_ACCEPTANCE`
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Reminder #3 chỉ auto-accept khi project đang `PENDING_ACCEPTANCE`.

### Bug N10 — Mốc kế tiếp không unlock sang `IN_PROGRESS` sau khi approve
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Khi APPROVE milestone, set milestone `orderIndex + 1` từ `PENDING` → `IN_PROGRESS`.

### Bug N11 — Escrow status UI giả lập release theo từng mốc trong khi release là lump-sum
- **Severity:** Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** `heldAmount`/`releasedAmount`/`isFundReleased` chỉ phụ thuộc `escrowStatus` HELD/RELEASED.

### Bug N12 — Cancel submission có thể wipe `REVISION_REQUIRED`
- **Severity:** Low–Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Chỉ cho cancel khi milestone đang `SUBMITTED`.

### Bug N13 — Lỗi sequential submit trả HTTP 500
- **Severity:** Low
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Map về `400 VALIDATION_ERROR`.

### Bug N14 — List projects không trả `applicantCount`
- **Severity:** Low
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** Include `_count.applications` trong list mapping.

### Bug N15 — `durationWeeks` tính sai (span giữa milestones thay vì now → deadline cuối)
- **Severity:** Low–Medium
- **Status:** `[FIXED]` (2026-07-30)
- **Fix:** ProjectForm tính từ `now` tới deadline muộn nhất, clamp 1–8.

---

## C. Item còn lại / chấp nhận trong MVP

| ID | Item | Status | Note |
| :-- | :-- | :-- | :-- |
| O1 | Bookmark trên ProjectCard không làm gì | `[WONTFIX-MVP]` | V1.1 |
| O2 | Experience tab trên profile là placeholder | `[WONTFIX-MVP]` | Đã ghi rõ V1.1 |
| O3 | Mock fallback còn sót trên vài route legacy (`proj-*`) | `[OPEN]` low | Không ảnh hưởng UUID thật |
| O4 | Chưa có Prisma migration versioned (đang `db push`) | `[OPEN]` docs | Nên document rõ trước PA6 |
| O5 | Password reset (FR-AUTH-05) | `[WONTFIX-MVP]` | Ngoài scope MVP |
| O6 | Workspace không có panel final accept | `[WONTFIX-MVP]` | Accept nằm ở escrow + milestones |

---

## D. Kết luận E2E theo flow

| Flow | Kết luận sau fix 30/7 |
| :-- | :-- |
| **1** Auth → Post → Admin approve → OPEN | Pass (validation + cancel hardened) |
| **2** Browse → Apply → Applicants → Confirm Match | Pass (confirm chỉ 1 lần khi OPEN; skill gate) |
| **3** Deposit → Submit tuần tự → Review | Pass (sequential + unlock next milestone) |
| **4** PENDING_ACCEPTANCE → Accept/Revise → Portfolio/Cert | Pass trên escrow page sau khi wire accept + revision |

**Khuyến nghị test lại tay trước demo:** chạy seed → SME post → Admin approve → Student apply → Confirm → Deposit → submit/approve từng mốc → Accept trên `/escrow/[id]` → kiểm tra `/certificates` và profile portfolio.
