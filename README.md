# SkillBridge

SkillBridge là nền tảng kết nối sinh viên và các dự án thực tế từ doanh nghiệp/SME.

## 📁 Cấu trúc dự án

```text
SkillBridge/
├── frontend/       # Next.js 16 (React 19, TypeScript, Tailwind CSS)
├── backend/        # Express.js (TypeScript, Prisma ORM, PostgreSQL)
└── docs/           # Tài liệu thiết kế hệ thống (SRS, Architecture, Coding Standards)
```

---

## 🚀 Hướng dẫn khởi chạy dự án

### 1. Khởi chạy Backend (`/backend`)

Yêu cầu: Node.js (≥ 20 LTS)

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies (nếu chưa cài)
npm install

# 3. Tạo file cấu hình môi trường (.env)
# (Copy từ file .env.example)

# 4. Khởi chạy server ở chế độ Development
npm run dev
```

* **Server URL**: `http://localhost:5000`
* **Kiểm tra trạng thái (Health Check)**: `http://localhost:5000/health`

---

### 2. Khởi chạy Frontend (`/frontend`)

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies (nếu chưa cài)
npm install

# 3. Khởi chạy ứng dụng Next.js ở chế độ Development
npm run dev
```

* **Frontend App URL**: `http://localhost:3000`

---

## 📚 Tài liệu dự án

Tất cả tài liệu chi tiết được lưu trữ trong thư mục [`docs/`](./docs):

- [`SRS_MVP.md`](./docs/SRS_MVP.md): Yêu cầu phần mềm và luồng chức năng MVP.
- [`System_Architecture.md`](./docs/System_Architecture.md): Kiến trúc hệ thống và luồng dữ liệu.
- [`Source_Code_Documentation.md`](./docs/Source_Code_Documentation.md): Quy chuẩn mã nguồn và cấu trúc thư mục.