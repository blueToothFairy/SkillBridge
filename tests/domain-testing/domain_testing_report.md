# BÁO CÁO THIẾT KẾ & KẾT QUẢ KIỂM THỬ MIỀN XÁC ĐỊNH (DOMAIN TESTING)
## Kỹ thuật áp dụng: Phân vùng tương đương (EP) + Phân tích giá trị biên (BVA)
## Dự án: SkillBridge MVP

Tài liệu này trình bày chi tiết thiết kế các ca kiểm thử, kết quả chạy kiểm thử tự động trên Backend, phân tích tính hợp lệ trên Frontend, tổng hợp các lỗi (bugs) phát hiện được và đề xuất giải pháp khắc phục.

---

## 1. Thiết kế Ca kiểm thử Miền xác định (EP + BVA)

Dựa trên mục **5. Validation Rules** của tài liệu đặc tả đặc tả yêu cầu sản phẩm `SRS_MVP.md`, chúng tôi đã phân tích các thuộc tính đầu vào thành các phân vùng tương đương (Equivalence Partitions - EP) và các giá trị biên (Boundary Values - BVA).

### 1.1 Kiểm thử Xác thực Dự án (Project Validation - SRS §5.1)

| Trường dữ liệu | Phân vùng hợp lệ (Valid EP) | Phân vùng không hợp lệ (Invalid EP) | Giá trị biên kiểm thử (BVA) |
| :--- | :--- | :--- | :--- |
| **Tiêu đề (Title)** | Độ dài từ 5 đến 200 ký tự | Độ dài < 5 ký tự; Độ dài > 200 ký tự | 4, 5, 200, 201 ký tự |
| **Mô tả (Description)** | Độ dài từ 20 đến 5000 ký tự | Độ dài < 20 ký tự; Độ dài > 5000 ký tự | 19, 20, 5000, 5001 ký tự |
| **Ngân sách (Budget)** | Số dương > 0 | Số âm (≤ 0) | -1, 0, 1 VND |
| **Thời gian (Duration)**| Từ 1 đến 8 tuần | < 1 tuần; > 8 tuần | 0, 1, 8, 9 tuần |
| **Số ứng viên tối đa** | Từ 1 đến 4 sinh viên | < 1 sinh viên; > 4 sinh viên | 0, 1, 4, 5 sinh viên |
| **Kỹ năng (Skills)** | Từ 1 đến 10 thẻ trong hệ thống | Không chọn thẻ (0); Chọn > 10 thẻ | 0, 1, 10, 11 thẻ |
| **Cột mốc (Milestones)**| Từ 1 đến 10 cột mốc | Không có (0); > 10 cột mốc | 0, 1, 10, 11 cột mốc |
| **Hạn chót (Deadline)** | Ngày trong tương lai (> Hiện tại) | Ngày trong quá khứ (≤ Hiện tại) | Hôm qua, Hôm nay, Ngày mai |

---

### 1.2 Kiểm thử Cập nhật Hồ sơ Sinh viên (Student Profile Validation - SRS §5.4)

| Trường dữ liệu | Phân vùng hợp lệ (Valid EP) | Phân vùng không hợp lệ (Invalid EP) | Giá trị biên kiểm thử (BVA) |
| :--- | :--- | :--- | :--- |
| **Họ & Tên (fullName)** | Độ dài từ 2 đến 100 ký tự | Độ dài < 2 ký tự; Độ dài > 100 ký tự | 1, 2, 100, 101 ký tự |
| **Năm học (year)** | Từ năm 1 đến năm 6 | < 1; > 6 | 0, 1, 6, 7 |
| **Kỹ năng (skills)** | Từ 1 đến 15 thẻ kỹ năng hệ thống | Không chọn (0); Chọn > 15 thẻ | 0, 1, 15, 16 thẻ |
| **Tiểu sử (bio)** | Từ 0 đến 2000 ký tự | Độ dài > 2000 ký tự | 2000, 2001 ký tự |

---

### 1.3 Kiểm thử Đơn ứng tuyển (Application Validation - SRS §5.2)

| Quy tắc / Trường dữ liệu | Phân vùng hợp lệ (Valid EP) | Phân vùng không hợp lệ (Invalid EP) | Giá trị biên kiểm thử (BVA) |
| :--- | :--- | :--- | :--- |
| **Thư giới thiệu (cover)** | Từ 0 đến 2000 ký tự | Độ dài > 2000 ký tự | 2000, 2001 ký tự |
| **Hồ sơ sinh viên** | Đã đầy đủ thông tin bắt buộc | Còn thiếu thông tin bắt buộc | Hồ sơ thiếu Họ tên/Năm học/Kỹ năng |
| **Trạng thái dự án** | Dự án đang có trạng thái `OPEN` | Dự án ở trạng thái khác (`DRAFT`, `IN_PROGRESS`) | Trạng thái `OPEN`, Trạng thái `UNDER_REVIEW`/`DRAFT` |

---

### 1.4 Kiểm thử Cột mốc (Milestone Validation - SRS §5.3)

| Quy tắc / Trường dữ liệu | Phân vùng hợp lệ (Valid EP) | Phân vùng không hợp lệ (Invalid EP) | Giá trị biên kiểm thử (BVA) |
| :--- | :--- | :--- | :--- |
| **URL sản phẩm (Url)** | Định dạng URL hợp lệ, không rỗng | Rỗng; Sai định dạng URL | Chuỗi trống, chuỗi thường, URL chuẩn |
| **Tiêu đề cột mốc** | Từ 3 đến 200 ký tự | < 3 ký tự; > 200 ký tự | 2, 3, 200, 201 ký tự |
| **Mô tả cột mốc** | Từ 10 đến 2000 ký tự | < 10 ký tự; > 2000 ký tự | 9, 10, 2000, 2001 ký tự |
| **Hạn chót cột mốc** | Hạn chót ≤ Hạn chót của dự án | Hạn chót > Hạn chót của dự án | Ngày sau hạn dự án, ngày bằng hạn dự án |

---

## 2. Kết quả Chạy Kiểm thử Tự động trên Backend

Mã nguồn kiểm thử tự động được triển khai tại file: [domain.test.ts](file:///c:/Users/Public/Projects/SkillBridge/tests/domain-testing/domain.test.ts). Kết quả chạy kiểm thử cho thấy tỷ lệ lỗi không hợp lệ lọt qua kiểm tra backend rất cao:

### Tóm tắt kết quả
* **Tổng số ca kiểm thử:** 29
* **Đạt (Passed):** 12
* **Không đạt (Failed):** 17

### Chi tiết các ca kiểm thử và trạng thái thực tế:

| Mã TC | Phân hệ kiểm thử | Mô tả ca kiểm thử | Kỳ vọng | Kết quả Backend thực tế | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-PROJ-VAL-01** | Projects | Từ chối tiêu đề dự án quá ngắn (< 5 ký tự) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-02** | Projects | Chấp nhận tiêu đề dự án bằng biên dưới (= 5 ký tự) | 201 | 201 Created | ✅ **PASS** |
| **TC-PROJ-VAL-03** | Projects | Từ chối tiêu đề dự án quá dài (> 200 ký tự) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-04** | Projects | Từ chối mô tả dự án quá ngắn (< 20 ký tự) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-05** | Projects | Từ chối ngân sách dự án ≤ 0 | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-PROJ-VAL-06** | Projects | Từ chối thời gian dự án ngắn hơn biên (< 1 tuần) | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-PROJ-VAL-07** | Projects | Từ chối thời gian dự án dài hơn biên (> 8 tuần) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-08** | Projects | Từ chối số ứng viên tối đa < 1 | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-09** | Projects | Từ chối số ứng viên tối đa > 4 | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-10** | Projects | Từ chối dự án không khai báo kỹ năng (< 1 kỹ năng) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-11** | Projects | Từ chối dự án khai báo quá nhiều kỹ năng (> 10 kỹ năng)| 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROJ-VAL-12** | Projects | Từ chối dự án không có cột mốc nào | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-PROJ-VAL-13** | Projects | Từ chối dự án có quá nhiều cột mốc (> 10 cột mốc) | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-PROJ-VAL-14** | Projects | Từ chối dự án có hạn chót trong quá khứ | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-01** | Student Profile | Từ chối họ tên sinh viên quá ngắn (< 2 ký tự) | 400 | **200 OK** (Lưu chuỗi 1 ký tự) | ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-02** | Student Profile | Từ chối họ tên sinh viên quá dài (> 100 ký tự) | 400 | **200 OK** (Lưu chuỗi 101 ký tự)| ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-03** | Student Profile | Từ chối năm học không hợp lệ (< 1) | 400 | **200 OK** (Lưu năm = 0) | ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-04** | Student Profile | Từ chối năm học vượt mức (> 6) | 400 | **200 OK** (Lưu năm = 7) | ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-05** | Student Profile | Từ chối sinh viên có ít hơn 1 kỹ năng | 400 | **200 OK** (Lưu mảng rỗng) | ❌ **FAIL** (Lọt lưới) |
| **TC-PROF-VAL-06** | Student Profile | Từ chối sinh viên có nhiều hơn 15 kỹ năng | 400 | **200 OK** (Lưu mảng 16 thẻ) | ❌ **FAIL** (Lọt lưới) |
| **TC-APP-VAL-01**  | Applications | Từ chối thư giới thiệu quá dài (> 2000 ký tự) | 400 | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **TC-APP-VAL-02**  | Applications | Chặn ứng tuyển nếu hồ sơ sinh viên chưa hoàn thiện | 400 | **201 Created** (Bypass thành công)| ❌ **FAIL** (Lọt lưới) |
| **TC-APP-VAL-03**  | Applications | Chỉ cho phép ứng tuyển vào dự án có trạng thái `OPEN`| 400 | 400 Bad Request | ✅ **PASS** |
| **TC-MILE-VAL-01** | Milestones | Yêu cầu URL sản phẩm khi nộp cột mốc | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-MILE-VAL-02** | Milestones | Từ chối sản phẩm có định dạng URL không hợp lệ | 400 | 400 Bad Request | ✅ **PASS** |
| **TC-MILE-VAL-03** | Milestones | Chấp nhận nộp sản phẩm với định dạng URL hợp lệ | 200 | 200 OK | ✅ **PASS** |

---

## 3. Phân tích Xác thực trên Frontend

Qua việc phân tích trực tiếp mã nguồn Frontend của dự án (Next.js), chúng tôi đánh giá mức độ triển khai kiểm thử miền xác định trên giao diện người dùng như sau:

### 3.1 Form đăng bài dự án (`ProjectForm.tsx`)
* **Kiểm tra rỗng:** Frontend thực hiện kiểm tra tốt các trường không được để trống bao gồm Tiêu đề (`title`), Danh mục (`categoryTagId`), Mô tả (`description`), và thông tin Cột mốc (`milestones`).
* **Số lượng ứng viên tối đa (`maxApplicants`):** Khống chế tốt bằng cơ chế điều khiển của React (`Math.min(4, Math.max(1, value))`), giúp người dùng không thể nhập số ngoài khoảng 1-4 trên giao diện.
* **Thời gian dự án (`durationWeeks`) & Hạn chót (`deadline`):** Thay vì cho phép người dùng tự điền, Frontend tự động tính toán dựa trên ngày hạn chót của các cột mốc đã thêm. Đây là một cơ chế thiết kế thông minh (UX tốt), tuy nhiên **thiếu kiểm tra giới hạn trên biên** (ví dụ, nếu người dùng thêm một cột mốc có hạn chót cách hiện tại 10 tuần, hệ thống vẫn tự động tính ra `durationWeeks = 10` và gửi lên backend mà không báo lỗi vượt quá 8 tuần).
* **Độ dài chuỗi (`title`, `description`):** Hoàn toàn chưa có kiểm tra độ dài tối thiểu/tối đa (ví dụ: Title dưới 5 hoặc trên 200 ký tự vẫn cho bấm lưu và gửi đi).

### 3.2 Trang Đăng ký (`register/page.tsx`) & Modal chỉnh sửa hồ sơ (`EditProfileModal.tsx`)
* **Hồ sơ sinh viên:** Hệ thống kiểm tra điều kiện bắt buộc nhập Họ tên, Trường, Ngành học và bắt buộc chọn ít nhất 1 kỹ năng trên giao diện.
* **Độ dài chuỗi:** Frontend hoàn toàn không giới hạn độ dài của Họ tên (`fullName`), ngành học, trường học. Người dùng có thể nhập chuỗi 1 ký tự hoặc 1000 ký tự mà không bị cảnh báo.
* **Năm học (`year`):** Sử dụng thẻ `<select>` giới hạn từ Year 1 đến Year 5+, ngăn chặn dữ liệu biên bất thường ngay tại giao diện.
* **Thư giới thiệu ứng tuyển (`coverMessage`):** Hoàn toàn chưa có cơ chế kiểm soát giới hạn 2000 ký tự trên textarea.

---

## 4. Tổng hợp các Lỗi nghiêm trọng phát hiện được (Bugs Summary)

### Lỗi 1: Thiếu kiểm tra độ dài chuỗi ở toàn bộ các thực thể trên Backend
* **Mô tả:** Backend chấp nhận tạo dự án có tiêu đề 1-4 ký tự hoặc hàng nghìn ký tự; chấp nhận Họ tên sinh viên chỉ có 1 ký tự; chấp nhận thư giới thiệu (`coverMessage`) vượt quá 2000 ký tự.
* **Hậu quả:** Gây tràn dữ liệu, lỗi hiển thị giao diện và nguy cơ bị tấn công DDoS/Resource Exhaustion bằng cách gửi dữ liệu cực lớn.

### Lỗi 2: Thiếu kiểm tra giới hạn khoảng biên của dự án trên Backend (`durationWeeks` & `maxApplicants`)
* **Mô tả:** Đặc tả quy định thời gian dự án từ 1-8 tuần, và số ứng viên tối đa từ 1-4. Tuy nhiên, Backend hoàn toàn bỏ qua bước kiểm tra này, chấp nhận các giá trị không hợp lệ (ví dụ: duration = 9 tuần, maxApplicants = 0 hoặc 5).
* **Hậu quả:** Sai lệch luồng nghiệp vụ cốt lõi của MVP.

### Lỗi 3: Không kiểm tra tính hợp lệ của danh sách kỹ năng
* **Mô tả:** Backend chấp nhận các dự án và hồ sơ sinh viên không chọn bất kỳ kỹ năng nào, hoặc chọn vượt số lượng tối đa cho phép (Dự án > 10 thẻ, Sinh viên > 15 thẻ).
* **Hậu quả:** Ảnh hưởng nghiêm trọng đến tính năng Gợi ý/Khớp kỹ năng (Matching), dẫn đến kết quả khớp bằng 0 hoặc tràn bộ nhớ.

### Lỗi 4: Bỏ qua kiểm tra độ hoàn thiện của hồ sơ sinh viên khi ứng tuyển
* **Mô tả:** Mặc dù đặc tả yêu cầu sinh viên phải hoàn thiện hồ sơ mới được ứng tuyển, nhưng API `POST /api/applications` chấp nhận sinh viên có thông tin trống (fullName, university, major rỗng, year = 0) nộp đơn thành công.
* **Hậu quả:** SME nhận được đơn ứng tuyển rỗng thông tin, không thể đánh giá ứng viên.

### Lỗi 5: Cho phép hạn chót dự án ở quá khứ
* **Mô tả:** Endpoint tạo dự án chấp nhận hạn chót cũ hơn thời gian hiện tại.
* **Hậu quả:** Tạo ra các dự án "chết" ngay khi vừa tạo, sinh viên không thể ứng tuyển được hoặc gây lỗi logic hệ thống.

---

## 5. Hướng khắc phục đề xuất (Proposed Remediation)

### 5.1 Cải tiến Backend (Bổ sung bộ lọc xác thực đầu vào)

Chúng tôi đề xuất tích hợp thêm các kiểm tra xác thực trực tiếp tại tầng Controller của Backend:

1. **Khắc phục lỗi tạo dự án (Tệp [project.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/projects/project.controller.ts#L16)):**
   Bổ sung kiểm tra điều kiện biên vào hàm `createProject`:
   ```typescript
   // 1. Kiểm tra độ dài tiêu đề và mô tả dự án
   if (title.trim().length < 5 || title.trim().length > 200) {
     return sendError(res, 'Tiêu đề dự án phải từ 5 đến 200 ký tự', 400, 'VALIDATION_ERROR');
   }
   if (description.trim().length < 20 || description.trim().length > 5000) {
     return sendError(res, 'Mô tả dự án phải từ 20 đến 5000 ký tự', 400, 'VALIDATION_ERROR');
   }
   // 2. Kiểm tra khoảng tuần và số ứng viên
   if (Number(durationWeeks) < 1 || Number(durationWeeks) > 8) {
     return sendError(res, 'Thời gian dự án phải từ 1 đến 8 tuần', 400, 'VALIDATION_ERROR');
   }
   if (maxApplicants && (Number(maxApplicants) < 1 || Number(maxApplicants) > 4)) {
     return sendError(res, 'Số lượng ứng viên tối đa phải từ 1 đến 4', 400, 'VALIDATION_ERROR');
   }
   // 3. Kiểm tra số lượng kỹ năng yêu cầu
   if (!requiredSkillTags || !Array.isArray(requiredSkillTags) || requiredSkillTags.length < 1 || requiredSkillTags.length > 10) {
     return sendError(res, 'Dự án yêu cầu từ 1 đến 10 thẻ kỹ năng', 400, 'VALIDATION_ERROR');
   }
   // 4. Kiểm tra hạn chót
   if (new Date(deadline).getTime() <= Date.now()) {
     return sendError(res, 'Hạn chót dự án phải ở trong tương lai', 400, 'VALIDATION_ERROR');
   }
   ```

2. **Khắc phục lỗi xác thực hồ sơ Sinh viên (Tệp [auth.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/auth/auth.controller.ts#L179)):**
   Bổ sung kiểm tra tại hàm `updateProfile`:
   ```typescript
   if (role === 'STUDENT') {
     if (updateData.fullName && (updateData.fullName.trim().length < 2 || updateData.fullName.trim().length > 100)) {
       return sendError(res, 'Họ tên phải từ 2 đến 100 ký tự', 400, 'VALIDATION_ERROR');
     }
     if (updateData.year && (Number(updateData.year) < 1 || Number(updateData.year) > 6)) {
       return sendError(res, 'Năm học không hợp lệ (chỉ chấp nhận từ 1-6)', 400, 'VALIDATION_ERROR');
     }
     if (updateData.skills) {
       const expertCount = updateData.skills.expert?.length || 0;
       const proficientCount = updateData.skills.proficient?.length || 0;
       const familiarCount = updateData.skills.familiar?.length || 0;
       const totalSkills = expertCount + proficientCount + familiarCount;
       if (totalSkills < 1 || totalSkills > 15) {
         return sendError(res, 'Số lượng kỹ năng phải từ 1 đến 15 thẻ', 400, 'VALIDATION_ERROR');
       }
     }
   }
   ```

3. **Khắc phục lỗi nộp đơn ứng tuyển (Tệp [application.service.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/applications/application.service.ts#L23)):**
   Bổ sung kiểm tra hồ sơ hoàn thiện và thư giới thiệu trong hàm `applyToProject`:
   ```typescript
   // 1. Kiểm tra độ dài coverMessage
   if (coverMessage && coverMessage.trim().length > 2000) {
     throw new Error('Thư giới thiệu không được vượt quá 2000 ký tự');
   }
   // 2. Kiểm tra tính hoàn thiện hồ sơ sinh viên
   const hasSkills = student.skills && typeof student.skills === 'object' && 
     ((student.skills as any).expert?.length > 0 || (student.skills as any).proficient?.length > 0 || (student.skills as any).familiar?.length > 0);

   if (!student.fullName.trim() || !student.university.trim() || !student.major.trim() || student.year < 1 || !hasSkills) {
     throw new Error('Hồ sơ của bạn chưa hoàn thiện. Vui lòng cập nhật đầy đủ thông tin cá nhân và ít nhất 1 kỹ năng trước khi ứng tuyển.');
   }
   ```

### 5.2 Cải tiến Frontend (Đồng bộ các luật validation lên Giao diện)

1. **Đối với `ProjectForm.tsx` (Tạo dự án):**
   * Thêm thuộc tính giới hạn nhập liệu: `minLength={5}` và `maxLength={200}` cho thẻ `<input>` tiêu đề.
   * Thêm cảnh báo động về độ dài mô tả khi người dùng nhập dưới 20 hoặc trên 5000 ký tự.
   * Hiển thị thông báo chặn nếu hạn chót tính toán vượt quá 8 tuần kể từ thời điểm hiện tại.

2. **Đối với `EditProfileModal.tsx` & `RegisterPage` (Hồ sơ sinh viên):**
   * Thiết lập `minLength={2}` và `maxLength={100}` trên ô nhập Họ tên.
   * Bổ sung cảnh báo nếu sinh viên chọn quá 15 kỹ năng (chỉ cho phép lưu khi số kỹ năng chọn nằm trong khoảng 1–15).
