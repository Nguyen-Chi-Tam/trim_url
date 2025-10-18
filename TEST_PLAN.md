# Kế hoạch kiểm thử toàn diện cho dự án URL Shortener

Tài liệu này mô tả kế hoạch kiểm thử chi tiết cho ứng dụng URL Shortener, bao gồm kiểm thử Backend API, Frontend UI/UX và các luồng End-to-End (E2E).

## 1. Kiểm thử API (Backend)

Sử dụng một công cụ như Postman, Insomnia hoặc `curl` để kiểm tra các endpoint.

### 1.1. Authentication (`/api/auth`)

| Endpoint | Method | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| `/signup` | `POST` | Đăng ký người dùng mới thành công | `{ "email": "testuser@example.com", "password": "password123" }` | `201 Created` |
| `/signup` | `POST` | Đăng ký với email đã tồn tại | `{ "email": "testuser@example.com", "password": "password123" }` | `400 Bad Request` |
| `/signup` | `POST` | Đăng ký với mật khẩu yếu | `{ "email": "newuser@example.com", "password": "123" }` | `400 Bad Request` (Nếu có validation) |
| `/login` | `POST` | Đăng nhập thành công | `{ "email": "testuser@example.com", "password": "password123" }` | `200 OK` và trả về JWT token |
| `/login` | `POST` | Đăng nhập với sai mật khẩu | `{ "email": "testuser@example.com", "password": "wrongpassword" }` | `400 Bad Request` hoặc `401 Unauthorized` |
| `/login` | `POST` | Đăng nhập với email không tồn tại | `{ "email": "nouser@example.com", "password": "password123" }` | `400 Bad Request` hoặc `404 Not Found` |

### 1.2. URL Management (Sử dụng Supabase API)

Các endpoint này tương tác trực tiếp với Supabase. Cần có `apiKey` và `Authorization: Bearer <JWT_TOKEN>` (nếu có Row Level Security).

| Endpoint | Method | Kịch bản | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `/urls` | `POST` | Tạo một URL mới | `201 Created` |
| `/urls` | `GET` | Lấy danh sách các URL của người dùng | `200 OK` |
| `/urls?id=eq.{url_id}` | `PATCH` | Cập nhật thông tin một URL | `200 OK` |
| `/urls?id=eq.{url_id}` | `DELETE` | Xóa một URL | `204 No Content` |
| `/urls?id=eq.{non_existent_id}` | `GET` | Lấy URL không tồn tại | `200 OK` với mảng rỗng |

### 1.3. Bio Page Management (Sử dụng Supabase API)

| Endpoint | Method | Kịch bản | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `/bio_page` | `POST` | Tạo một trang bio mới | `201 Created` |
| `/bio_page` | `GET` | Lấy danh sách các trang bio của người dùng | `200 OK` |
| `/bio_page?id=eq.{bio_id}` | `PATCH` | Cập nhật thông tin trang bio | `200 OK` |
| `/bio_page?id=eq.{bio_id}` | `DELETE` | Xóa một trang bio | `204 No Content` |

### 1.4. Click Tracking (Sử dụng Supabase API)

| Endpoint | Method | Kịch bản | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `/clicks` | `POST` | Ghi nhận một lượt click mới | `201 Created` |
| `/clicks?url_id=eq.{url_id}` | `GET` | Lấy tất cả lượt click của một URL | `200 OK` |

---

## 2. Kiểm thử Giao diện người dùng (Frontend)

Thực hiện thủ công trên trình duyệt.

### 2.1. Luồng xác thực

- **Đăng ký:**
  - [ ] Đăng ký tài khoản mới thành công và được chuyển hướng đến trang Dashboard.
  - [ ] Thử đăng ký với email đã tồn tại, nhận được thông báo lỗi.
  - [ ] Thử đăng ký với mật khẩu không hợp lệ (ví dụ: quá ngắn), nhận được thông báo lỗi.
- **Đăng nhập:**
  - [ ] Đăng nhập với thông tin hợp lệ, được chuyển hướng đến Dashboard.
  - [ ] Thử đăng nhập với mật khẩu sai, nhận được thông báo lỗi.
  - [ ] Thử truy cập trang Dashboard (`/dashboard`) khi chưa đăng nhập, bị chuyển hướng về trang đăng nhập.
- **Đăng xuất:**
  - [ ] Nhấn nút đăng xuất, được chuyển hướng về trang chủ/trang đăng nhập.

### 2.2. Trang Dashboard

- **Hiển thị:**
  - [ ] Các thẻ thống kê hiển thị đúng số lượng link và tổng số click.
  - [ ] Danh sách các link đã tạo được hiển thị chính xác.
- **Chức năng:**
  - [ ] **Tạo link:** Mở form, nhập URL hợp lệ, tạo link thành công và link mới xuất hiện trong danh sách.
  - [ ] **Tìm kiếm:** Nhập từ khóa vào ô tìm kiếm, danh sách được lọc chính xác.
  - [ ] **Sắp xếp:** Thay đổi tùy chọn sắp xếp (A-Z, Z-A, Mới nhất, Cũ nhất), danh sách được sắp xếp lại đúng thứ tự.
  - [ ] **Phân trang:**
    - [ ] Khi có nhiều hơn 8 link, các nút phân trang xuất hiện.
    - [ ] Nhấn nút "Tiếp", "Trước", "Đầu", "Cuối" hoạt động chính xác.
  - [ ] **Chỉnh sửa link:** Mở form chỉnh sửa, thay đổi tiêu đề, lưu lại và thấy thay đổi.
  - [ ] **Xóa link:** Nhấn nút xóa, xác nhận và link biến mất khỏi danh sách.

### 2.3. Trang Profile

- [ ] Cập nhật thông tin người dùng (nếu có).
- [ ] **Upload ảnh đại diện:**
  - [ ] Chọn một file ảnh hợp lệ, upload thành công và ảnh mới được hiển thị.
  - [ ] Thử upload file không phải ảnh, nhận được thông báo lỗi.

### 2.4. Chuyển hướng URL

- [ ] Truy cập một link rút gọn (`/{shortUrl}`), được chuyển hướng chính xác đến URL gốc.
- [ ] Kiểm tra trong Dashboard, số lượt click của link đó tăng lên.

---

## 3. Kiểm thử End-to-End (E2E)

Mô phỏng một luồng hoàn chỉnh của người dùng.

### Kịch bản 1: Người dùng mới tạo và quản lý link

1.  [ ] Truy cập trang chủ.
2.  [ ] Nhấn vào nút "Sign Up" và đăng ký một tài khoản mới.
3.  [ ] Sau khi đăng ký thành công, được chuyển hướng đến Dashboard.
4.  [ ] Trên Dashboard, nhấn "Create Link".
5.  [ ] Nhập một URL dài vào và tạo link rút gọn.
6.  [ ] Sao chép link rút gọn vừa tạo.
7.  [ ] Mở một tab mới và dán link rút gọn, xác nhận được chuyển hướng đúng đến URL gốc.
8.  [ ] Quay lại Dashboard, làm mới trang và kiểm tra xem số lượt click đã tăng lên 1.
9.  [ ] Sử dụng chức năng tìm kiếm để tìm lại link vừa tạo.
10. [ ] Nhấn nút đăng xuất.

### Kịch bản 2: Quản lý Bio Page

1.  [ ] Đăng nhập vào tài khoản đã có.
2.  [ ] Điều hướng đến mục quản lý Bio Page.
3.  [ ] Tạo một Bio Page mới với tiêu đề và mô tả.
4.  [ ] Thêm một vài link đã tạo vào Bio Page.
5.  [ ] Truy cập trang Bio Page công khai, kiểm tra tất cả thông tin và link hiển thị chính xác.
6.  [ ] Quay lại trang quản lý, xóa Bio Page vừa tạo.
