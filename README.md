# Trợ lý GVCN — Quản lý lớp & Bộ Office cho Giáo viên Chủ nhiệm

Ứng dụng web gọn đẹp, linh hoạt dành cho giáo viên chủ nhiệm (chuẩn CTGDPT 2018 · Thông tư 27 · Công văn 2345), lưu tự động trên trình duyệt và tích hợp đầy đủ bộ Office văn phòng.

## Tính năng nổi bật
- **Thông tin chung Trường · Lớp · GVCN:** Nhập một lần (Sở/Phòng GD, Tên trường, Năm học, Học kì, Họ tên GVCN, Xưng hô, SĐT/Zalo, Bộ sách, Khẩu hiệu) — tự động điền vào mọi Giáo án, Biên bản, Thư khen, Slide PowerPoint, Sổ Excel và Tin nhắn Phụ huynh.
- **Quản lý nhiều lớp & Danh bạ Phụ huynh:** Thêm/đổi tên/xóa lớp, sửa từng học sinh kèm tên PH & SĐT Zalo, nhập hàng loạt hoặc từ Excel/CSV, tìm kiếm tức thì.
- **Điểm danh linh hoạt:** 4 trạng thái + ghi chú lý do nghỉ + 1 chạm nhắn hỏi thăm PH ngay từ dòng học sinh vắng.
- **Sổ điểm Thông tư 27:** Thêm môn học tùy chỉnh, lọc theo mức T/H/C, tự điền & đổi mẫu nhận xét (`↻`), tạo phiếu báo điểm gửi PH.
- **Giáo án Công văn 2345:** Chỉnh sửa trực tiếp trên khung xem trước, 1 chạm mở sang Word hoặc sinh bộ Slide bài giảng `.pptx`.
- **Nhắn Phụ huynh cá nhân & hàng loạt:** 7 tình huống chuẩn sư phạm, tự ghép tên Trường/Lớp/GVCN.
- **Tải lên / Tải xuống & Kéo-thả file:** Kéo thả `.json`, `.xlsx`, `.csv`, `.docx`, `.txt` trực tiếp vào màn hình.
- **Bộ Office 3 trong 1 tích hợp:**
  - **Word A4:** Quản lý nhiều tài liệu, chèn Quốc hiệu & Trường/Lớp 1 chạm, 6 mẫu GVCN, mở `.docx`, tải `.doc` / In PDF.
  - **Excel:** Nhiều Sheet, điều hướng phím mũi tên như Excel thật, công thức `SUM/AVERAGE/MIN/MAX/COUNT/IF`, mở & tải `.xlsx`/`.csv`.
  - **PowerPoint:** Tạo file `.pptx` thật trực tiếp nội bộ (không phụ thuộc CDN, tải tức thì 100%, mở tốt trên PowerPoint/Google Slides/WPS), kèm trình chiếu toàn màn hình & xuất `.html`.

## Cấu hình bán hàng & liên hệ (Monetization)

- Toàn bộ thông tin liên hệ chính thức (**Liên hệ Admin** · Zalo `0353205414` / `https://zalo.me/0353205414` · Email `thaytiensy@gmail.com`) và bảng giá ưu đãi mở bán được cấu hình tập trung trong `monetization-config.js` (`window.CONFIG_MONETIZATION`).
- Bảng giá mở bán hiện hành: **Bản Cơ bản `0đ`** (miễn phí tính năng lõi) · **Gói Pro GVCN `149.000đ/năm học`** (giá gốc `299.000đ`, `~12.000đ/tháng`) · **Thiết kế riêng Trường & App `Từ 1.990.000đ/gói`** (giá gốc `2.500.000đ`).
- Ảnh chia sẻ MXH (`og-cover.png`, 1200×630) và thẻ Open Graph / Twitter Card trong `index.html` trỏ trực tiếp về `https://lop-nhe.vercel.app`.
