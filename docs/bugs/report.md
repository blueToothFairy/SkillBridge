### Lỗi 1: Cho phép chỉnh sửa trạng thái tùy ý không qua kiểm duyệt (Vulnerability in Project Update)
* **Mô tả:** Endpoint `PATCH /api/projects/:id` (sử dụng bởi SME để cập nhật dự án) trực tiếp gán trường `status` nhận từ request body (`data.status`) vào cơ sở dữ liệu nếu dự án không ở trạng thái `OPEN` hoặc `DRAFT`.
* **Hậu quả:** SME có thể dễ dàng bypass quy trình bằng cách gửi request PATCH dự án đang ở `IN_PROGRESS` lên thành `COMPLETED` trực tiếp mà không cần sinh viên hoàn thành các cột mốc, hoặc đưa ngược trở lại `OPEN` dù dự án đã khớp.
* **Đoạn mã gây lỗi:** Trong [project.service.ts](file:///c:/Users/Public/Projects/SkillBridge/backend/src/modules/projects/project.service.ts#L196-L200):
  ```typescript
  if (project.status === ProjectStatus.OPEN || project.status === ProjectStatus.DRAFT) {
    updateData.status = ProjectStatus.UNDER_REVIEW;
  } else if (data.status) {
    updateData.status = data.status; // LỖI: Gán trực tiếp không qua kiểm tra tính hợp lệ của luồng chuyển trạng thái
  }
  ```

### Lỗi 2: Thiếu bước xác nhận/từ chối tham gia của Sinh viên (Missing Student Confirmation Flow)
* **Mô tả:** Tài liệu đặc tả `SRS_MVP.md` yêu cầu luồng chuyển trạng thái: `Matched --> In_Progress` khi "Selected student(s) confirm" (Sinh viên xác nhận) và quay lại `Open` nếu "All selected students decline" (Từ chối). Tuy nhiên, trong mã nguồn backend hiện tại:
  - Khi SME thực hiện nạp tiền ký quỹ mô phỏng (`depositEscrow`), trạng thái dự án tự động nhảy sang `IN_PROGRESS`.
  - Không tồn tại API hay cột cơ sở dữ liệu nào lưu trạng thái xác nhận hoặc từ chối tham gia của sinh viên sau khi được tuyển.
* **Hậu quả:** Hệ thống ép buộc sinh viên vào dự án ngay lập tức khi SME deposit tiền ký quỹ mà không cho sinh viên cơ hội từ chối hay chọn lựa dự án khác.

### Lỗi 3: Chưa triển khai tính năng Hủy dự án (Missing Project Cancellation Logic)
* **Mô tả:** Đặc tả yêu cầu SME có thể hủy dự án khi ở trạng thái `OPEN` (chưa có ứng viên được chấp nhận) chuyển sang `CANCELLED`. Nhưng hệ thống không có endpoint hủy riêng (`PATCH /api/projects/:id/cancel` hoặc tương đương). SME phải tự PATCH trạng thái `status: 'CANCELLED'` qua endpoint chỉnh sửa chung, dẫn tới lỗ hổng bảo mật/nghiệp vụ nếu dự án đã khớp.

### Lỗi 4: Thiếu kiểm tra giới hạn khoảng biên của dự án trên Backend (`durationWeeks` & `maxApplicants`)
* **Mô tả:** Đặc tả quy định thời gian dự án từ 1-8 tuần, và số ứng viên tối đa từ 1-4. Tuy nhiên, Backend hoàn toàn bỏ qua bước kiểm tra này
* **Hậu quả:** Sai lệch luồng nghiệp vụ cốt lõi của MVP.

### Lỗi 5: Cho phép hạn chót dự án ở quá khứ
* **Mô tả:** Endpoint tạo dự án chấp nhận hạn chót cũ hơn thời gian hiện tại.

### Lỗi 6: Cho phép sinh viên nộp deliverables khi mốc trước chưa được duyệt
* **Mô tả:** Cả frontend/backend đều cho phép sinh viên nộp bài mặc dù môc trước chưa được SME phê duyệt.