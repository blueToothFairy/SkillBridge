# SkillBridge — Dependencies, References & AI Disclosure

> Tài liệu khai báo theo yêu cầu **PA6** (Yêu cầu đồ án môn Khởi nghiệp):  
> *“Cần khai báo rõ thư viện, framework, API, template, mã nguồn tham khảo hoặc AI-generated code được sử dụng.”*  
> Cập nhật: **2026-08-01**

Đây là file **chính** cho phần disclosure.  
Nhật ký chi tiết prompt/output AI nằm ở [`../AI-Audit.md`](../AI-Audit.md) (phụ lục).

---

## 1. Framework & runtime

| Thành phần | Công nghệ | Phiên bản (lockfile gần đúng) | Vai trò |
| :---- | :---- | :---- | :---- |
| Frontend framework | **Next.js** (App Router) | 16.2.11 | UI, routing, SSR/CSR pages |
| UI library | **React** / **React DOM** | 19.2.4 | Component UI |
| Backend runtime | **Node.js** | ≥ 20 LTS (yêu cầu chạy) | Chạy Express API |
| Backend framework | **Express.js** | ^4.18.3 | REST API |
| Ngôn ngữ | **TypeScript** | ^5.x | Type-safe FE + BE |
| ORM / DB toolkit | **Prisma** | ^5.10.0 | Schema, migrate, client, seed |
| Database | **PostgreSQL** | — (local / Supabase) | Lưu trữ dữ liệu MVP |
| CSS | **Tailwind CSS** | ^4 | Styling utility-first |

---

## 2. Thư viện chính (dependencies)

### Backend (`backend/package.json`)

| Package | Mục đích |
| :---- | :---- |
| `@prisma/client` | Prisma Client truy vấn DB |
| `express` | HTTP server / routing |
| `cors` | CORS cho frontend `localhost:3000` |
| `dotenv` | Load biến môi trường `.env` |
| `jsonwebtoken` | Phát hành / xác thực JWT |
| `bcryptjs` | Hash mật khẩu |

**Dev:** `prisma`, `ts-node`, `ts-node-dev`, `typescript`, `@types/*`, `supertest` (có sẵn cho test thủ công).

### Frontend (`frontend/package.json`)

| Package | Mục đích |
| :---- | :---- |
| `next` | Framework web |
| `react`, `react-dom` | UI |
| `lucide-react` | Icon set |
| `qrcode` | Sinh QR verification trên trang certificate |

**Dev:** `tailwindcss`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next`, `@types/*`, `typescript`.

---

## 3. API / dịch vụ bên ngoài

| Hạng mục | Có dùng? | Ghi chú |
| :---- | :---- | :---- |
| Payment gateway thật | **Không** | Escrow là **simulated** trong DB |
| AI inference API (OpenAI, …) trong runtime app | **Không** | Skill-matching là thuật toán overlap deterministic |
| OAuth Google/GitHub login | **Không** | Auth email/password + JWT |
| Email/SMS provider | **Không** | Reminder chỉ log/scheduler nội bộ |
| Hosted DB (tuỳ môi trường nhóm) | **Có thể** | PostgreSQL qua Supabase connection string trong `.env` (không commit secret) |
| CDN icon/font đặc thù | **Không bắt buộc** | Chủ yếu system font + lucide |

**API nội bộ của hệ thống:** REST dưới prefix `/api/*` (auth, tags, projects, applications, milestones, escrow, portfolio, certificates). Chi tiết xem `docs/SRS_MVP.md` và `docs/System_Architecture.md`.

---

## 4. Template / scaffolding / design references

| Nguồn | Phạm vi sử dụng |
| :---- | :---- |
| **create-next-app** (Next.js default scaffold) | Khởi tạo thư mục `frontend/` (cấu trúc App Router, ESLint, Tailwind baseline) |
| Prototype UI (Vercel mockups của nhóm) | Tham chiếu layout/màu/flow MVP — lưu trong `docs/prototype/` + mô tả `docs/Prototype_UI_Spec.md` |
| Lucide icons | Icon UI, không copy business logic bên thứ ba |

**Không** fork/copy nguyên một codebase marketplace hoàn chỉnh làm sản phẩm chính.

---

## 5. Mã nguồn tham khảo / tài liệu tham khảo

| Nguồn | Cách dùng |
| :---- | :---- |
| Tài liệu chính thức Next.js, React, Express, Prisma | Học API / best practice khi implement |
| Prisma Migrate docs | Thiết lập `prisma/migrations` cho PA6 |
| JWT / bcrypt pattern phổ biến | Auth module tự viết trên Express |
| Business Plan / SRS nội bộ nhóm | Định hướng MVP features |
| `docs/SRS_MVP.md`, `System_Architecture.md`, `Source_Code_Documentation.md` | Spec kỹ thuật do nhóm (có hỗ trợ AI soạn thảo — xem mục 6) |

---

## 6. AI-generated code & công cụ AI

### 6.1. Công cụ đã dùng

| Công cụ | Vai trò |
| :---- | :---- |
| **Cursor** (Agent / Chat) | Hỗ trợ viết docs kỹ thuật, implement module, refactor, bugfix, README/disclosure |
| **Claude** (qua Cursor, nhiều phiên) | Sinh/soát SRS, architecture, coding checklist, một phần code FE/BE theo prompt nhóm |

### 6.2. Phạm vi AI hỗ trợ (tóm tắt)

| Hạng mục | Mức độ AI | Ghi chú |
| :---- | :---- | :---- |
| Tài liệu SRS / Architecture / Source Code Docs / UI Spec / Checklist | **Cao** | AI soạn theo Business Plan + review nhóm |
| Modules backend (auth, projects, applications, milestones, escrow, portfolio, certificates, scheduler) | **Trung bình–cao** | AI hỗ trợ implement theo plan; nhóm review/merge/test |
| Frontend pages/components MVP | **Trung bình–cao** | AI hỗ trợ UI + API wiring; chỉnh theo prototype |
| Skill-matching algorithm | **Thấp–trung bình** | Logic deterministic do nhóm định nghĩa; AI hỗ trợ code |
| Prisma schema / seed / migration | **Trung bình** | Schema theo SRS; migration/seed được chuẩn hóa cho demo |
| Bug fix E2E Flow 1–4 | **Trung bình** | AI hỗ trợ audit + patch; nhóm verify |

### 6.3. Phần nhóm tự chịu trách nhiệm

- Quyết định phạm vi MVP / phân công Hà–Thịnh
- Review PR, test thủ công các luồng demo
- Cấu hình DB/secrets, quay video demo, screenshot nộp bài
- Nội dung Business Plan / slide (ngoài repo mã nguồn)

### 6.4. Cam kết disclosure

Nhóm **không** trình bày toàn bộ mã nguồn như viết 100% tay không hỗ trợ AI.  
AI được dùng như công cụ hỗ trợ lập trình/tài liệu; sản phẩm cuối được nhóm kiểm thử và chịu trách nhiệm giải thích khi bảo vệ.

Nhật ký chi tiết một số phiên prompt: [`AI-Audit.md`](../AI-Audit.md).

---

## 7. Secrets & dữ liệu nhạy cảm

- **Không** commit file `.env` / `.env.local` chứa `DATABASE_URL` hoặc `JWT_SECRET` thật.
- Dùng `.env.example` / `.env.local.example` làm mẫu.
- Tài khoản seed chỉ phục vụ demo (`password123`), không dùng cho production thật.

---

## 8. Checklist đối chiếu PA6 (phần mã nguồn)

| Yêu cầu PA6 | File / minh chứng |
| :---- | :---- |
| Toàn bộ source code | Repo `backend/` + `frontend/` |
| README cài đặt / chạy / sử dụng | [`README.md`](../README.md) |
| Dữ liệu mẫu / tài khoản demo | `backend/prisma/seed.ts` + mục Demo accounts trong README |
| Khai báo lib / framework / API / template / AI | **File này** |
| Tài liệu kỹ thuật liên quan | `docs/SRS_MVP.md`, `System_Architecture.md`, `Source_Code_Documentation.md`, … |
| Migration / schema DB | `backend/prisma/migrations/` + `schema.prisma` |
| Video demo + screenshot | Do nhóm chuẩn bị (`docs/prototype/` + video ngoài/trong hồ sơ zip) |
| GitHub truy cập được | https://github.com/blueToothFairy/SkillBridge |
