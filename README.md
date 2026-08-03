# SkillBridge

SkillBridge là nền tảng marketplace kết nối **sinh viên** với các **dự án ngắn hạn từ SME**, hỗ trợ skill-matching, milestone tracking, simulated escrow, verified portfolio và digital certificate.

**Repository:** https://github.com/blueToothFairy/SkillBridge  
**Phạm vi:** MVP phục vụ demo / bảo vệ đồ án Khởi nghiệp (PA6)

---

## 1. Tech stack

| Layer | Công nghệ |
| :---- | :---- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| UI helpers | lucide-react (icons), qrcode (certificate QR) |
| Backend | Node.js (≥ 20), Express.js, TypeScript |
| Auth / security | JWT (`jsonwebtoken`), bcryptjs |
| ORM / DB toolkit | Prisma ORM 5 |
| Database | PostgreSQL (local hoặc Supabase) |
| Package manager | npm |

Chi tiết thư viện, API, template và AI disclosure:  
[`docs/Dependencies_And_AI_Disclosure.md`](./docs/Dependencies_And_AI_Disclosure.md)

---

## 2. Cấu trúc thư mục

```text
SkillBridge/
├── backend/                      # Express API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.ts               # Demo seed data
│   │   └── migrations/           # Versioned SQL migrations
│   ├── src/
│   │   ├── modules/              # auth, projects, applications, milestones, escrow, ...
│   │   ├── middlewares/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/                     # Next.js UI
│   ├── src/
│   │   ├── app/                  # Routes (App Router)
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/api/
│   │   └── types/
│   ├── .env.local.example
│   └── package.json
├── docs/                         # SRS, Architecture, UI spec, screenshots, bug report
│   ├── prototype/                # Screenshot / prototype screens
│   ├── Dependencies_And_AI_Disclosure.md
│   └── ...
├── AI-Audit.md                   # Phụ lục nhật ký prompt/output AI
├── MVP_Plan.md
└── README.md
```

---

## 3. Hướng dẫn cài backend

### Yêu cầu
- Node.js ≥ 20 LTS
- PostgreSQL (local hoặc Supabase)
- npm ≥ 10

### Các bước

```bash
cd backend
npm install
```

Tạo file môi trường từ mẫu:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Chỉnh `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
JWT_SECRET="skillbridge-dev-secret-change-me"
CORS_ORIGIN="http://localhost:3000"
```

> Cần PostgreSQL local hoặc connection string Supabase hợp lệ.  
> Không commit file `.env` chứa secret thật.

---

## 4. Hướng dẫn cài frontend

```bash
cd frontend
npm install
```

Tạo file môi trường từ mẫu:

```bash
# macOS / Linux / Git Bash
cp .env.local.example .env.local

# Windows PowerShell
Copy-Item .env.local.example .env.local
```

Nội dung mặc định của `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 5. Cách migrate / seed database

Chạy trong thư mục `backend/` (sau khi đã cấu hình `.env`).

### 5.1. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5.2. Apply migration (máy / DB sạch)

```bash
npm run prisma:migrate:deploy
```

Migration hiện có:

- `backend/prisma/migrations/20260730000000_init` — khởi tạo toàn bộ schema MVP

### 5.3. Seed dữ liệu demo

```bash
npm run db:seed
```

### 5.4. One-command setup (generate + migrate + seed)

```bash
npm run db:setup
```

### 5.5. Trường hợp đặc biệt

| Tình huống | Cách xử lý |
| :---- | :---- |
| DB sạch, chưa có bảng | `prisma:migrate:deploy` → `db:seed` |
| DB đã tạo bằng `db push` trước đó | **Không** chạy lại init migration (sẽ lỗi CREATE trùng). Đánh dấu đã apply: `npx prisma migrate resolve --applied 20260730000000_init` |
| Đang phát triển, đổi schema | `npm run prisma:migrate` (`prisma migrate dev`) |
| Fallback nhanh (không khuyến nghị cho nộp bài) | `npm run db:push` |

Kiểm tra trạng thái migration:

```bash
npm run prisma:migrate:status
```

---

## 6. Cách chạy project

Cần **2 terminal** (backend + frontend).

### Terminal 1 — Backend (`http://localhost:5000`)

```bash
cd backend
npm run dev
```

Health check: `http://localhost:5000/health`

### Terminal 2 — Frontend (`http://localhost:3000`)

```bash
cd frontend
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

### Build production (tuỳ chọn)

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

---

## 7. Tài khoản demo (Admin / SME / Student)

Sau khi seed, mật khẩu chung: **`password123`**

### Admin
| Email | Role |
| :---- | :---- |
| `admin@skillbridge.com` | ADMIN |

### SME
| Email | Role |
| :---- | :---- |
| `techcorp@sme.com` | SME |
| `folio@sme.com` | SME |
| `growth@sme.com` | SME |

### Student
| Email | Role |
| :---- | :---- |
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

Seed tạo khoảng **1 admin**, **3 SME**, **10 students**, **5 projects** (+ applications/milestones), theo hướng idempotent (chạy lại seed không phình dữ liệu vô hạn).

---

## 8. Demo flow

### Flow 1 — Auth → SME đăng project → Admin duyệt
1. Login SME (`techcorp@sme.com`) → `/sme/post-project`.
2. Điền thông tin, skills, milestones → submit.
3. Project vào `UNDER_REVIEW`.
4. Login Admin → duyệt project → `OPEN`.

### Flow 2 — Student browse → apply → Confirm Match
1. Login Student → `/student/browse` → Apply (cover letter).
2. SME mở Project → **Applicants** (sort theo % skill match).
3. Chọn ứng viên → **Confirm Match** → project `MATCHED`.

### Flow 3 — Escrow → milestones
1. SME Deposit Escrow → `HELD`, project `IN_PROGRESS`.
2. Student nộp deliverable URL theo thứ tự milestone.
3. SME Approve / Request Revision từng mốc.
4. Tất cả mốc `ACCEPTED` → project `PENDING_ACCEPTANCE`.

### Flow 4 — Nghiệm thu → Portfolio → Certificate
1. SME mở `/escrow/[projectId]`.
2. **Approve Project & Release Escrow** → `COMPLETED` + release escrow + tạo Verified Portfolio + Certificate.
3. Hoặc **Request Revision** để trả project về `IN_PROGRESS`.
4. Student xem portfolio tại `/student/profile/[id]` và certificate tại `/certificates` / `/certificates/[code]`.

Video demo E2E và screenshot màn hình: `docs/prototype/` (+ video demo trong hồ sơ nộp bài).

---

## 9. Tính năng đã hoàn thành (MVP)

- Auth JWT cho Student / SME / Admin (register, login, profile)
- Quản lý Tag / Category
- SME đăng project, sửa project, cancel project (khi `OPEN` và chưa có applicant ACCEPTED)
- Admin review project (`UNDER_REVIEW` → `OPEN` / trả về draft)
- Student browse / filter / apply
- Skill-matching **rule-based** (tag overlap deterministic) + Confirm Match
- Simulated Escrow: `PENDING → HELD → RELEASED`
- Milestone submit / review tuần tự (Approve / Revise)
- Project final acceptance + request revision
- Auto-reminder / auto-accept scheduler (PENDING_ACCEPTANCE)
- Verified Portfolio tự tạo sau nghiệm thu
- Digital Certificate + public verify + QR / share / print PDF
- Demo seed data + Prisma versioned migration
- UI các màn MVP chính (Post project, Browse/Apply, Profile/Portfolio, Escrow/Acceptance, Certificates)

---

## 10. Tính năng chưa hoàn thành / giới hạn MVP

### Giới hạn quan trọng của MVP (bắt buộc hiểu khi demo/bảo vệ)

| Hạng mục | Trạng thái MVP | Giải thích |
| :---- | :---- | :---- |
| **Escrow** | **Chỉ mô phỏng** | Không kết nối payment gateway thật. Trạng thái ký quỹ lưu trong DB (`PENDING` / `HELD` / `RELEASED`) để demo luồng nghiệp vụ. |
| **Matching** | **Rule-based, chưa phải AI Matching** | Điểm khớp = % giao giữa skill tags của student và `requiredSkillTags` của project (deterministic). **Không** gọi LLM / ML model. |
| **Community Review** | **Chưa có trong MVP** | Thuộc **V1.1** |
| **Rating / đánh giá hai chiều** | **Chưa có trong MVP** | Thuộc **V1.1** |
| **Talent Pool nâng cao** | **Chưa có trong MVP** | Thuộc **V1.1 / V2.0** |
| **AI Matching** | **Chưa có trong MVP** | Thuộc **V1.1 / V2.0** (sau rule-based MVP) |

### Các hạng mục khác ngoài phạm vi MVP

- Full Project Workspace tích hợp chat/files (prototype Hình 4) — **V1.1**; MVP dùng trang milestones
- Password reset / OAuth login
- Bookmark project
- Thanh toán / giải ngân tiền thật
- Experience timeline đầy đủ trên profile (tab Experience là placeholder)

Known issues / lịch sử bugfix E2E: [`docs/bugs/report.md`](./docs/bugs/report.md)

---

## Phụ lục A — Tài liệu kỹ thuật

| Tài liệu | Mục đích |
| :---- | :---- |
| [`docs/Dependencies_And_AI_Disclosure.md`](./docs/Dependencies_And_AI_Disclosure.md) | Khai báo PA6: lib, framework, API, template, references, AI |
| [`AI-Audit.md`](./AI-Audit.md) | Phụ lục nhật ký prompt/output AI |
| [`docs/SRS_MVP.md`](./docs/SRS_MVP.md) | Đặc tả yêu cầu MVP |
| [`docs/System_Architecture.md`](./docs/System_Architecture.md) | Kiến trúc hệ thống |
| [`docs/Source_Code_Documentation.md`](./docs/Source_Code_Documentation.md) | Quy ước code / cấu trúc |
| [`docs/Prototype_UI_Spec.md`](./docs/Prototype_UI_Spec.md) | Spec UI + ảnh prototype |
| [`docs/MVP_Coding_Checklist.md`](./docs/MVP_Coding_Checklist.md) | Checklist tiến độ theo ngày/người |
| [`MVP_Plan.md`](./MVP_Plan.md) | Kế hoạch coding 7 ngày |

## Phụ lục B — Gợi ý đóng gói nộp bài

1. Đảm bảo GitHub truy cập được.
2. Không commit `.env` / secrets.
3. Có README + migration + seed + disclosure docs.
4. Kèm video demo + screenshot trong hồ sơ/zip.
5. Clean install verify trước khi nén `MãNhóm.zip`.
