# BÁO CÁO THIẾT KẾ & KẾT QUẢ KIỂM THỬ BẢNG QUYẾT ĐỊNH (DECISION TABLE TESTING)
## Dự án: SkillBridge MVP
## Phân hệ kiểm thử: Quyền ghi/cập nhật với tài nguyên yêu cầu quyền hợp lệ

Báo cáo này trình bày chi tiết việc áp dụng kỹ thuật **Kiểm thử Bảng quyết định (Decision Table Testing)** để thiết kế các ca kiểm thử cho phân quyền thực hiện các tác vụ ghi/cập nhật tài nguyên trên hệ thống SkillBridge. Báo cáo bao gồm phân tích cả Frontend và Backend, kết quả chạy kiểm thử tự động, tổng hợp lỗi phát hiện và hướng khắc phục đề xuất.

Mã nguồn kiểm thử tự động được triển khai tại: [decision_table.test.ts](file:///c:/Users/Public/Projects/SkillBridge/tests/decision-table/decision_table.test.ts)

---

## 1. Thiết kế Bảng Quyết định (Decision Tables)

Chúng tôi thiết kế bảng quyết định cho 3 tác vụ ghi/cập nhật cốt lõi yêu cầu quyền và trạng thái hợp lệ theo tài liệu `SRS_MVP.md`:
1. **Nộp sản phẩm cột mốc** (`PATCH /api/milestones/:id/submit`)
2. **Đánh giá cột mốc** (`PATCH /api/milestones/:id/review`)
3. **Ứng tuyển dự án** (`POST /api/applications`)

### 1.1 Bảng Quyết định 1: Nộp sản phẩm cột mốc (`PATCH /api/milestones/:id/submit`)
*Sinh viên nộp link deliverable URL cho cột mốc của dự án.*

| Điều kiện (Conditions) | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Vai trò người dùng** | STUDENT | STUDENT | STUDENT | STUDENT | STUDENT | SME/ADMIN | GUEST |
| **C2: Trạng thái dự án** | IN_PROGRESS | IN_PROGRESS | IN_PROGRESS | IN_PROGRESS | Khác | IN_PROGRESS | IN_PROGRESS |
| **C3: Trạng thái ghép cặp (Matched)** | Có | Có | Có | Không | Có | Không | Không |
| **C4: Trạng thái cột mốc** | Chưa duyệt | Chưa duyệt | Đã duyệt | Chưa duyệt | Chưa duyệt | Chưa duyệt | Chưa duyệt |
| **C5: Link bàn giao (Deliverable URL)** | Hợp lệ | Trống/Sai | Hợp lệ | Hợp lệ | Hợp lệ | Hợp lệ | Hợp lệ |
| **Hành động (Actions)** | | | | | | | |
| **A1: Chấp nhận nộp (200 OK, Cập nhật trạng thái mốc = SUBMITTED)** | **X** | | | | | | |
| **A2: Từ chối với lỗi xác thực đầu vào (400 Bad Request)** | | **X** | **X** | | | | |
| **A3: Từ chối do sai quyền/trạng thái (403 Forbidden)** | | | | **X** | **X** | **X** | |
| **A4: Từ chối do chưa đăng nhập (401 Unauthorized)** | | | | | | | **X** |

---

### 1.2 Bảng Quyết định 2: Đánh giá cột mốc (`PATCH /api/milestones/:id/review`)
*SME hoặc Admin phê duyệt hoặc yêu cầu sửa đổi cột mốc của dự án.*

| Điều kiện (Conditions) | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Vai trò người dùng** | SME Owner | SME Owner | SME Owner | SME Owner | ADMIN | SME Other | STUDENT | GUEST |
| **C2: Trạng thái cột mốc** | SUBMITTED | SUBMITTED | SUBMITTED | Khác | SUBMITTED | SUBMITTED | SUBMITTED | SUBMITTED |
| **C3: Hành động đánh giá (Action)**| APPROVE | REVISE | REVISE | APPROVE | APPROVE | APPROVE | APPROVE | APPROVE |
| **C4: Nhập ý kiến phản hồi (Feedback)** | Bất kỳ | Đầy đủ | Rỗng | Bất kỳ | Bất kỳ | Bất kỳ | Bất kỳ | Bất kỳ |
| **Hành động (Actions)** | | | | | | | | |
| **A1: Chấp nhận duyệt mốc (200 OK, Trạng thái = ACCEPTED)** | **X** | | | | **X** | | | |
| **A2: Chấp nhận yêu cầu sửa (200 OK, Trạng thái = REVISION_REQUIRED)** | | **X** | | | | | | |
| **A3: Từ chối do thiếu thông tin (400 Bad Request)** | | | **X** | **X** | | | | |
| **A4: Từ chối do sai quyền (403 Forbidden)** | | | | | | **X** | **X** | |
| **A5: Từ chối do chưa đăng nhập (401 Unauthorized)** | | | | | | | | **X** |

---

### 1.3 Bảng Quyết định 3: Ứng tuyển dự án (`POST /api/applications`)
*Sinh viên ứng tuyển vào một dự án.*

| Điều kiện (Conditions) | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Vai trò người dùng** | STUDENT | STUDENT | STUDENT | STUDENT | SME/ADMIN | GUEST |
| **C2: Trạng thái dự án** | OPEN | OPEN | OPEN | Khác | OPEN | OPEN |
| **C3: Mức độ hoàn thiện hồ sơ** | Đầy đủ | Thiếu | Đầy đủ | Đầy đủ | N/A | N/A |
| **C4: Đã ứng tuyển trước đó** | Chưa | Chưa | Rồi | Chưa | Chưa | Chưa |
| **Hành động (Actions)** | | | | | | |
| **A1: Tạo đơn thành công (201 Created, Trạng thái = APPLIED)** | **X** | | | | | |
| **A2: Từ chối do dữ liệu không hợp lệ (400 Bad Request)** | | **X** | **X** | **X** | | |
| **A3: Từ chối do sai vai trò (403 Forbidden)** | | | | | **X** | |
| **A4: Từ chối do chưa đăng nhập (401 Unauthorized)** | | | | | | **X** |

---

## 2. Thiết kế các Ca kiểm thử (Test Cases)

Dựa trên các luật (Rules) được định nghĩa ở các bảng quyết định trên, chúng tôi xây dựng bộ ca kiểm thử tích hợp:

### 2.1 Các ca kiểm thử nộp sản phẩm cột mốc (`DT1-R*`)
* **DT1-R1**: Nộp link sản phẩm thành công (Vai trò STUDENT matched, dự án IN_PROGRESS, mốc PENDING, link hợp lệ).
* **DT1-R2**: Từ chối nộp link sản phẩm sai định dạng (Vai trò STUDENT matched, dự án IN_PROGRESS, mốc PENDING, link sai định dạng).
* **DT1-R2b**: Từ chối nộp link sản phẩm rỗng (Vai trò STUDENT matched, dự án IN_PROGRESS, mốc PENDING, link rỗng).
* **DT1-R3**: Từ chối nộp sản phẩm vào cột mốc đã được phê duyệt (Vai trò STUDENT matched, dự án IN_PROGRESS, mốc ACCEPTED, link hợp lệ).
* **DT1-R4**: Từ chối nộp sản phẩm từ sinh viên không tham gia dự án (Vai trò STUDENT unmatched, dự án IN_PROGRESS, mốc PENDING, link hợp lệ).
* **DT1-R5**: Từ chối nộp sản phẩm khi dự án không ở trạng thái hoạt động (Vai trò STUDENT matched, dự án COMPLETED, mốc PENDING, link hợp lệ).
* **DT1-R6a**: Từ chối tài khoản doanh nghiệp (SME) nộp sản phẩm (Vai trò SME, dự án IN_PROGRESS, mốc PENDING, link hợp lệ).
* **DT1-R6b**: Từ chối tài khoản ADMIN nộp sản phẩm (Vai trò ADMIN, dự án IN_PROGRESS, mốc PENDING, link hợp lệ).
* **DT1-R7**: Từ chối khách vãng lai nộp sản phẩm (Chưa đăng nhập, dự án IN_PROGRESS, mốc PENDING, link hợp lệ).

### 2.2 Các ca kiểm thử đánh giá cột mốc (`DT2-R*`)
* **DT2-R1**: Phê duyệt cột mốc thành công từ chủ dự án (Vai trò SME Owner, mốc SUBMITTED, action APPROVE).
* **DT2-R2**: Yêu cầu sửa đổi thành công có kèm ý kiến (Vai trò SME Owner, mốc SUBMITTED, action REVISE, có feedback).
* **DT2-R3**: Từ chối yêu cầu sửa đổi nếu bỏ trống ý kiến đánh giá (Vai trò SME Owner, mốc SUBMITTED, action REVISE, feedback rỗng).
* **DT2-R4**: Từ chối phê duyệt/yêu cầu sửa nếu cột mốc chưa được sinh viên nộp bài (Vai trò SME Owner, mốc ACCEPTED/PENDING, action APPROVE).
* **DT2-R5**: ADMIN có quyền phê duyệt cột mốc thay thế SME (Vai trò ADMIN, mốc SUBMITTED, action APPROVE).
* **DT2-R6**: Doanh nghiệp khác không thể đánh giá cột mốc dự án này (Vai trò SME Other, mốc SUBMITTED, action APPROVE).
* **DT2-R7**: Sinh viên thực hiện dự án không tự duyệt cột mốc của mình (Vai trò STUDENT matched, mốc SUBMITTED, action APPROVE).
* **DT2-R8**: Khách vãng lai không thể đánh giá cột mốc (Chưa đăng nhập, mốc SUBMITTED, action APPROVE).

### 2.3 Các ca kiểm thử ứng tuyển dự án (`DT3-R*`)
* **DT3-R1**: Ứng tuyển thành công (Vai trò STUDENT, dự án OPEN, hồ sơ hoàn chỉnh, chưa ứng tuyển).
* **DT3-R2**: Từ chối đơn ứng tuyển từ sinh viên chưa hoàn thiện hồ sơ (Vai trò STUDENT, dự án OPEN, hồ sơ thiếu thông tin bắt buộc).
* **DT3-R3**: Chặn ứng tuyển trùng lặp (Vai trò STUDENT, dự án OPEN, hồ sơ hoàn chỉnh, đã ứng tuyển trước đó).
* **DT3-R4**: Chặn ứng tuyển vào dự án không còn mở nhận đơn (Vai trò STUDENT, dự án IN_PROGRESS, hồ sơ hoàn chỉnh).
* **DT3-R5**: Chặn doanh nghiệp ứng tuyển dự án (Vai trò SME, dự án OPEN).
* **DT3-R6**: Chặn khách vãng lai ứng tuyển (Chưa đăng nhập, dự án OPEN).

---

## 3. Thực hiện Kiểm thử và Kết quả chạy thực tế (Actual Results)

Kiểm thử được chạy tự động trên môi trường tích hợp bằng cách truy vấn API thông qua `supertest` kết hợp kiểm tra trạng thái DB qua `Prisma`.

### Tóm tắt kết quả kiểm thử tự động
* **Tổng số ca kiểm tra (Assertions):** 27
* **Đạt (Passed):** 23
* **Thất bại (Failed):** 4

### Bảng đối chiếu kết quả kỳ vọng và thực tế

| Mã TC | Mô tả ca kiểm thử | Kết quả kỳ vọng (Status) | Kết quả Backend thực tế | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **DT1-R1** | Nộp link sản phẩm thành công | **200** | 200 OK | ✅ **PASS** |
| **DT1-R2** | Từ chối link sai định dạng | **400** | 400 Bad Request | ✅ **PASS** |
| **DT1-R2b**| Từ chối link rỗng | **400** | 400 Bad Request | ✅ **PASS** |
| **DT1-R3** | Từ chối nộp sản phẩm vào mốc đã duyệt | **400** hoặc **403** | **500 Internal Error** | ❌ **FAIL** (Lỗi hệ thống) |
| **DT1-R4** | Từ chối nộp bài từ sinh viên unmatched | **403** | 403 Forbidden | ✅ **PASS** |
| **DT1-R5** | Từ chối nộp bài khi dự án kết thúc | **403** | **404 Not Found** | ❌ **FAIL** (Sai mã lỗi) |
| **DT1-R6a**| Từ chối SME nộp bài | **403** | 403 Forbidden | ✅ **PASS** |
| **DT1-R6b**| Từ chối Admin nộp bài | **403** | 403 Forbidden | ✅ **PASS** |
| **DT1-R7** | Từ chối khách vãng lai nộp bài | **401** | 401 Unauthorized | ✅ **PASS** |
| **DT2-R1** | SME Owner duyệt mốc thành công | **200** | 200 OK | ✅ **PASS** |
| **DT2-R2** | SME Owner yêu cầu sửa đổi thành công | **200** | 200 OK | ✅ **PASS** |
| **DT2-R3** | SME yêu cầu sửa đổi nhưng thiếu feedback | **400** | **500 Internal Error** | ❌ **FAIL** (Lỗi hệ thống) |
| **DT2-R4** | SME duyệt mốc khi mốc chưa nộp bài | **403** hoặc **400** | 403 Forbidden | ✅ **PASS** |
| **DT2-R5** | Admin duyệt mốc thành công | **200** | 200 OK | ✅ **PASS** |
| **DT2-R6** | SME khác đánh giá mốc bị từ chối | **403** | 403 Forbidden | ✅ **PASS** |
| **DT2-R7** | Sinh viên tự duyệt bài bị từ chối | **403** | 403 Forbidden | ✅ **PASS** |
| **DT2-R8** | Khách vãng lai duyệt bài bị từ chối | **401** | 401 Unauthorized | ✅ **PASS** |
| **DT3-R1** | Ứng tuyển thành công vào dự án OPEN | **201** | 201 Created | ✅ **PASS** |
| **DT3-R2** | Chặn ứng tuyển từ sinh viên thiếu hồ sơ | **400** | **201 Created** | ❌ **FAIL** (Lọt lưới) |
| **DT3-R3** | Chặn ứng tuyển trùng lặp | **400** | 400 Bad Request | ✅ **PASS** |
| **DT3-R4** | Chặn ứng tuyển vào dự án đã IN_PROGRESS | **400** | 400 Bad Request | ✅ **PASS** |
| **DT3-R5** | Chặn SME ứng tuyển dự án | **403** | 403 Forbidden | ✅ **PASS** |
| **DT3-R6** | Chặn khách vãng lai ứng tuyển | **401** | 401 Unauthorized | ✅ **PASS** |

---

## 4. Phân tích cả Frontend và Backend

### 4.1 Đánh giá Frontend
Qua kiểm tra mã nguồn giao diện (Next.js), chúng tôi nhận thấy cơ chế kiểm soát quyền và validation như sau:
* **Giao diện Không gian làm việc (`workspace/[id]/page.tsx`):**
  - **Kiểm soát quyền hiển thị:** Frontend ẩn/hiện form nộp bài và các nút hành động dựa trên `userRole` của tài khoản hiện tại (ví dụ: chỉ hiện form nộp bài khi `userRole === 'STUDENT'` và dự án ở trạng thái `IN_PROGRESS`). Tương tự, chỉ hiện nút duyệt mốc cho `userRole === 'SME'`.
  - **Validation link bàn giao:** Frontend kiểm tra định dạng URL cơ bản thông qua biểu thức chính quy (Regex) và hiển thị cảnh báo `alert('Vui lòng nhập định dạng URL hợp lệ.')` nếu định dạng không khớp, ngăn chặn các chuỗi không phải link gửi lên backend.
  - **Lỗ hổng bảo mật Frontend:** Toàn bộ quyền quyết định hành động đều phụ thuộc vào logic xác định `userRole` tại Client. Nếu người dùng sử dụng các công cụ can thiệp HTTP (như Postman/Burp Suite) để gửi request trực tiếp lên API, mọi cơ chế ẩn/hiện nút tại giao diện hoàn toàn bị vô hiệu hóa. Do đó, việc xác thực an toàn tuyệt đối phải diễn ra ở Backend.

### 4.2 Đánh giá Backend
Mặc dù Backend đã có các Middleware phân quyền theo Token (`authenticateJwt` và `requireRole`), kết quả kiểm thử phía trên đã chỉ ra các lỗ hổng xử lý nghiệp vụ nghiêm trọng (phân tích chi tiết tại Phần 5).

---

## 5. Tổng hợp các lỗi nghiêm trọng phát hiện được (Bugs Summary)

### Lỗi 1 (DT1-R3): API nộp sản phẩm trả về mã lỗi 500 khi mốc đã duyệt
* **Mô tả:** Khi sinh viên nộp sản phẩm vào một cột mốc đã được phê duyệt (`status === 'ACCEPTED'`), service ném ra lỗi `'Cannot submit to an already accepted milestone'`. Tuy nhiên, controller không bắt lỗi này để phản hồi mã 400, dẫn đến phản hồi lỗi hệ thống **500 Internal Server Error**.
* **Mã nguồn lỗi:** Xem [milestone.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/milestones/milestone.controller.ts#L85-L93) không xử lý kiểm tra biệt lệ này.

### Lỗi 2 (DT1-R5): Phản hồi sai mã lỗi 404 thay vì 403 khi dự án không trong quá trình thực hiện
* **Mô tả:** Khi nộp sản phẩm cho dự án không ở trạng thái `IN_PROGRESS` (ví dụ: `COMPLETED`), hệ thống trả về mã lỗi **404 Not Found**. Về mặt ngữ nghĩa, cột mốc vẫn tồn tại trong cơ sở dữ liệu, việc chặn nộp bài ở đây thuộc về quyền logic nghiệp vụ, do đó mã lỗi đúng phải là **403 Forbidden** hoặc **400 Bad Request**.
* **Mã nguồn lỗi:** Xem [milestone.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/milestones/milestone.controller.ts#L86-L88).

### Lỗi 3 (DT2-R3): API đánh giá mốc trả về mã lỗi 500 khi thiếu ý kiến sửa đổi
* **Mô tả:** Khi SME gửi yêu cầu sửa đổi (`REVISE`) nhưng bỏ trống trường phản hồi (`feedback`), service ném ra lỗi `'Feedback is required to request revision'`. Controller không có cấu trúc xử lý thông tin lỗi này và trả về mã lỗi **500 Internal Server Error**.
* **Mã nguồn lỗi:** Xem [milestone.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/milestones/milestone.controller.ts#L143-L151).

### Lỗi 4 (DT3-R2): Bỏ qua xác thực hồ sơ hoàn thiện khi ứng tuyển dự án
* **Mô tả:** Backend cho phép sinh viên ứng tuyển dự án ngay cả khi hồ sơ hoàn toàn trống (Họ tên rỗng, trường rỗng, ngành học rỗng, chưa chọn kỹ năng nào), vi phạm nghiêm trọng tài liệu đặc tả `SRS_MVP.md §5.2` (Bypass thành công với mã 201).
* **Mã nguồn lỗi:** Hàm `applyToProject` tại [application.service.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/applications/application.service.ts#L23-L31) chỉ kiểm tra sự tồn tại của bản ghi hồ sơ sinh viên (`student`) trong DB chứ không kiểm tra tính đầy đủ/hợp lệ các trường bên trong bản ghi đó.

---

## 6. Hướng khắc phục đề xuất (Proposed Remediation)

### 6.1 Khắc phục các mã lỗi 500 và 404 tại Milestone Controller
Cập nhật lại phần bắt lỗi (`catch`) trong các hàm controller tại [milestone.controller.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/milestones/milestone.controller.ts) để chuyển đổi các lỗi logic thành mã phản hồi 400 hợp lý:

```typescript
// Trong hàm submitDeliverable:
} catch (error: any) {
  if (error.message.includes('not found')) {
    return sendError(res, error.message, 404, 'NOT_FOUND');
  }
  if (error.message.includes('not in progress')) {
    // Trả về 403 thay vì 404
    return sendError(res, error.message, 403, 'FORBIDDEN');
  }
  if (error.message.includes('already accepted')) {
    // Trả về 400 thay vì lọt xuống 500
    return sendError(res, error.message, 400, 'BAD_REQUEST');
  }
  if (error.message.includes('Unauthorized') || error.message.includes('not matched')) {
    return sendError(res, error.message, 403, 'FORBIDDEN');
  }
  return sendError(res, error.message || 'Failed to submit milestone deliverable', 500, 'SERVER_ERROR');
}
```

```typescript
// Trong hàm reviewMilestone:
} catch (error: any) {
  if (error.message.includes('not found')) {
    return sendError(res, error.message, 404, 'NOT_FOUND');
  }
  if (error.message.includes('Feedback is required')) {
    // Trả về 400 thay vì lọt xuống 500
    return sendError(res, error.message, 400, 'BAD_REQUEST');
  }
  if (error.message.includes('Unauthorized') || error.message.includes('review')) {
    return sendError(res, error.message, 403, 'FORBIDDEN');
  }
  return sendError(res, error.message || 'Failed to review milestone', 500, 'SERVER_ERROR');
}
```

### 6.2 Bổ sung kiểm tra tính đầy đủ của Hồ sơ Sinh viên khi ứng tuyển
Trong file [application.service.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/applications/application.service.ts#L23), cập nhật hàm `applyToProject` để xác thực hồ sơ:

```typescript
export async function applyToProject(
  userId: string,
  projectId: string,
  coverMessage?: string
) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw new Error('Student profile not found');
  }

  // Bổ sung kiểm tra đầy đủ hồ sơ theo SRS §5.2
  const isProfileComplete = 
    student.fullName && student.fullName.trim().length >= 2 &&
    student.university && student.university.trim().length > 0 &&
    student.major && student.major.trim().length > 0 &&
    student.year >= 1 && student.year <= 6 &&
    Array.isArray(student.skills) && student.skills.length >= 1;

  if (!isProfileComplete) {
    throw new Error('Student profile must be complete before applying (fullName, university, major, year, and at least 1 skill tag required)');
  }
  // ... phần logic còn lại
```
