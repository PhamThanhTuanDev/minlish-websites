# Minlish Websites (Frontend)

Frontend cho hệ thống học từ vựng Minlish, xây dựng bằng React + TypeScript + Vite + Tailwind.

## 1. Tổng quan

- Framework UI: React 18
- Ngôn ngữ: TypeScript
- Build tool: Vite
- UI primitives: shadcn/ui + Radix UI
- State/data: TanStack Query + localStorage (auth token)
- Kiểm thử: Vitest + Playwright (fixture có sẵn)

## 2. Yêu cầu môi trường

- Node.js 18+ (khuyến nghị Node.js 20 LTS)
- npm hoặc bun (repo đã có `bun.lockb`)

## 3. Cài đặt và chạy local

### Bước 1: Cài dependencies

```bash
npm install
```

Hoặc dùng bun:

```bash
bun install
```

### Bước 2: Tạo file môi trường

Sao chép file mẫu:

```bash
cp .env.example .env
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Bước 3: Chạy dev server

```bash
npm run dev
```

Mặc định frontend chạy tại:

- `http://localhost:2910`

## 4. Scripts chính

- `npm run dev`: chạy môi trường phát triển
- `npm run build`: build production
- `npm run preview`: chạy preview sau khi build
- `npm run lint`: kiểm tra eslint
- `npm run test`: chạy unit test (vitest)
- `npm run test:watch`: chạy test watch mode

## 5. Cấu hình ENV

Các biến môi trường frontend (Vite) phải có prefix `VITE_`:

- `VITE_API_BASE_URL`: URL backend API, ví dụ `http://localhost:8080`

Lưu ý bảo mật:

- Không commit file `.env` thật lên GitHub
- Chỉ commit `.env.example`

## 6. Kết nối với backend

- Backend local mặc định: `http://localhost:8080`
- Frontend dev đã cấu hình proxy `/api` sang backend trong `vite.config.ts`
- Đăng nhập Google redirect về frontend theo `UI_URL` phía backend

Để luồng OAuth local chạy đúng:

1. Frontend chạy cổng `2910`
2. Backend `UI_URL` phải là `http://localhost:2910`
3. Google OAuth redirect URI trên backend phải đúng domain local đang dùng

## 7. Cấu trúc thư mục chính

```text
src/
	components/        # UI components dùng lại
	hooks/             # custom hooks
	lib/               # api client, utils, store, types
	pages/             # các trang theo route
	test/              # setup + test files
```

## 8. Quy ước làm việc

- Ưu tiên tách API call vào `src/lib/api.ts`
- Type dùng chung đặt ở `src/lib/types.ts`
- Component dùng lại đặt trong `src/components`
- Không hard-code secret/token trong mã nguồn

## 9. Troubleshooting nhanh

### 9.1 Lỗi CORS khi gọi API

- Kiểm tra backend đã mở CORS cho `http://localhost:2910`
- Kiểm tra backend có đang chạy không (`:8080`)

### 9.2 Đăng nhập Google thành công nhưng không vào app

- Kiểm tra `UI_URL` phía backend có đúng `http://localhost:2910`
- Kiểm tra callback redirect có trả về `accessToken`
- Kiểm tra token có được lưu vào localStorage

### 9.3 Lỗi `Uncaught (in promise)` trong `onboarding.js`

- Thường đến từ extension/script ngoài trình duyệt, không phải code app
- Thử chạy bằng cửa sổ ẩn danh hoặc tắt extension để xác minh

## 10. Build production

```bash
npm run build
```

Thư mục output:

- `dist/`
