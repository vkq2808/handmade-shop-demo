## HM Monorepo – Cài đặt, Seed dữ liệu và Chạy Dev

Tài liệu này hướng dẫn cài đặt phụ thuộc, cấu hình biến môi trường, seed dữ liệu mẫu và chạy frontend/backend ở môi trường phát triển.

### Yêu cầu
- Node.js 18+ và npm
- MongoDB (máy local hoặc URI đám mây)

## 1) Cài đặt phụ thuộc

Từ thư mục gốc dự án:

```bash
npm install
```

Lệnh này sẽ cài đặt cả frontend và backend thông qua các script ở thư mục gốc.

Cách khác (thủ công):

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2) Cấu hình biến môi trường (backend)

Tạo file `backend/.env` (có thể copy từ file mẫu):

```bash
cp backend/.env.example backend/.env
```

Sau đó chỉnh sửa các giá trị phù hợp. Những biến quan trọng backend đang dùng:
- PORT: Cổng API (mặc định 5000)
- MONGODB_URI: Chuỗi kết nối MongoDB
- JWT_SECRET: Secret ký JWT
- FRONTEND_URL: URL dev của Vite (mặc định http://localhost:5173)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM: Thiết lập SMTP (tuỳ chọn) cho email

## 3) Seed dữ liệu mẫu

Đảm bảo `MONGODB_URI` đã được thiết lập trong `backend/.env`, sau đó chạy từ thư mục gốc repo:

```bash
npm run seed:all
```

Lệnh này sẽ seed cấu hình (settings) và dữ liệu mẫu (users, categories, products, orders) từ `backend/sample_data/`.

Các biến thể hữu ích (chạy bên trong `backend/`):

```bash
npm run seed:sample        # import dữ liệu mẫu
npm run seed:sample:drop   # xoá collection mục tiêu trước khi import
npm run seed:settings      # chỉ seed settings
```

## 4) Chạy ở môi trường phát triển

Cách A – chạy cả frontend + backend từ thư mục gốc:

```bash
npm start
```

Cách B – chạy riêng từng phần:

Backend (Express + MongoDB):
```bash
cd backend
npm run dev
```

Frontend (Vite + React):
```bash
cd frontend
npm run dev
```

## Địa chỉ truy cập
- API base: http://localhost:5000 (có thể thay đổi qua biến `PORT`)
- Frontend: http://localhost:5173 (mặc định của Vite)

## Khắc phục sự cố
- Lỗi kết nối Mongo: kiểm tra `MONGODB_URI` trong `backend/.env`, đảm bảo MongoDB đang chạy và truy cập được.
- Lỗi CORS: thiết lập `FRONTEND_URL` trong `backend/.env` trỏ đúng origin của frontend, ví dụ `http://localhost:5173`.
- Email không gửi: cấu hình đầy đủ biến SMTP trong `backend/.env` và dùng app password nếu nhà cung cấp yêu cầu.
- Thiếu `concurrently`: cài bằng `npm i -D concurrently` ở thư mục gốc, hoặc mở 2 terminal để chạy backend/frontend riêng.

## Tổng quan script
- Root: `npm run install` (cài cả hai), `npm run seed:all`, `npm run start:fe`, `npm run start:be`, `npm start`
- Backend: `npm run dev`, `npm run seed:all`, `npm run seed:sample`, `npm run seed:sample:drop`, `npm run seed:settings`

