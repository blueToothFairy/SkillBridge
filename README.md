# SkillBridge

SkillBridge là nền tảng kết nối sinh viên và các dự án thực tế từ doanh nghiệp/SME.

## Cấu trúc dự án

```text
SkillBridge/
├── frontend/       # Next.js 16 (React 19, TypeScript, Tailwind CSS)
├── backend/        # Express.js (TypeScript, Prisma ORM, PostgreSQL)
└── docs/           # SRS, Architecture, Coding Standards, MVP Checklist
```

---

## Hướng dẫn khởi chạy

### Yêu cầu

- Node.js ≥ 20 LTS
- PostgreSQL (local hoặc Supabase) — cấu hình trong `backend/.env`

### 1. Backend (`http://localhost:5000`)

```bash
cd backend
npm install
cp .env.example .env   # chỉnh DATABASE_URL + JWT_SECRET
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

- Health check: `http://localhost:5000/health`
- Demo accounts (password `password123`): xem [`docs/MVP_Coding_Checklist.md`](./docs/MVP_Coding_Checklist.md)

### 2. Frontend (`http://localhost:3000`)

```bash
cd frontend
npm install
npm run dev
```

Tuỳ chọn: tạo `frontend/.env.local` với `NEXT_PUBLIC_API_URL=http://localhost:5000`.

---

## Luồng test nhanh (đã có API thật)

1. Login SME `techcorp@sme.com` → Dashboard / Post project  
2. Admin duyệt project (`UNDER_REVIEW` → `OPEN`) nếu cần  
3. Login Student → Browse → Apply (cover letter)  
4. SME → Project → Applicants (sort theo % skill match) → Confirm Match  
5. SME Deposit Escrow (`PENDING` → `HELD`) → project `IN_PROGRESS`  
6. Student/SME mở `/projects/:id/milestones` để submit/review  

> Acceptance / Certificate / Portfolio: Day 27–28 (Thịnh & Hà) — xem checklist.

---

## Tài liệu

- [`docs/SRS_MVP.md`](./docs/SRS_MVP.md)
- [`docs/System_Architecture.md`](./docs/System_Architecture.md)
- [`docs/Source_Code_Documentation.md`](./docs/Source_Code_Documentation.md)
- [`docs/Prototype_UI_Spec.md`](./docs/Prototype_UI_Spec.md) — **nguồn sự thật UI** (8 ảnh prototype + tokens/layout)
- [`docs/MVP_Coding_Checklist.md`](./docs/MVP_Coding_Checklist.md) — checklist tiến độ theo ngày/người
