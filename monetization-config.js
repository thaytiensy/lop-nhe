/* ==========================================================================
   CẤU HÌNH BÁN HÀNG, GÓI NÂNG CẤP & LIÊN HỆ — TRỢ LÝ GVCN
   ==========================================================================
   Chủ sở hữu chỉ cần chỉnh các biến trong CONFIG_MONETIZATION dưới đây
   trước khi đẩy lên GitHub/Vercel. Mọi bảng giá, nút Zalo, Email và mẫu
   tin nhắn đặt hàng trong ứng dụng sẽ tự động cập nhật theo file này.
   ========================================================================== */

window.CONFIG_MONETIZATION = {
  // 1. THÔNG TIN THƯƠNG HIỆU & LIÊN HỆ
  // Thay các chuỗi "__...__" bằng thông tin thật trước khi đẩy live:
  brandName: "Trợ lý GVCN",
  authorLabel: "__TEN_TAC_GIA_HOAC_DON_VI__",      // VD: "Thầy Tiến Sỹ · EduTech VN"
  liveUrl: "https://lop-nhe.vercel.app",
  zaloPhone: "__DIEN_SDT_ZALO_CUA_BAN__",          // VD: "09xx xxx xxx"
  zaloUrl: "__DIEN_LINK_ZALO_ME__",                // VD: "https://zalo.me/09xxxxxxxx"
  facebookUrl: "__DIEN_LINK_FACEBOOK_HOAC_PAGE__", // VD: "https://m.me/yourpage" (hoặc để "")
  email: "__DIEN_EMAIL_LIEN_HE__",                 // VD: "lienhe@tenmien.vn"
  supportHours: "8:00 – 21:00 (Thứ 2 – Chủ nhật)",
  paymentNote: "__DIEN_THONG_TIN_CHUYEN_KHOAN_HOAC_DE_TRONG__",

  // 2. NỘI DUNG CHIA SẺ NHANH LÊN FACEBOOK / ZALO
  shareTitle: "Trợ lý GVCN — Quản lý lớp học, Sổ điểm TT27, Giáo án 2345 & Bộ Office miễn phí",
  shareText:
    "Chia sẻ cho thầy cô công cụ Trợ lý GVCN dùng miễn phí ngay trên trình duyệt (không cần cài đặt, không cần đăng nhập):\n" +
    "✓ Điểm danh, lưu SĐT & nhắn nhanh Zalo phụ huynh\n" +
    "✓ Sổ điểm Thông tư 27 tự động xếp T/H/C\n" +
    "✓ Soạn Giáo án CV 2345 & tạo Slide PowerPoint (.pptx) thật\n" +
    "✓ Tích hợp sẵn Word, Excel, PowerPoint 3-in-1\n" +
    "Dùng thử ngay tại: https://lop-nhe.vercel.app",

  // 3. BẢNG GÓI DỊCH VỤ (Giá tham chiếu — sửa dễ dàng tại đây)
  pricingDisclaimer:
    "Mức giá hiển thị là giá tham chiếu dự kiến — có thể điều chỉnh linh hoạt theo quy mô lớp, tổ khối hoặc yêu cầu riêng.",
  plans: [
    {
      id: "free",
      badge: "Đang sử dụng",
      name: "Bản Miễn phí",
      subtitle: "Dành cho GVCN cá nhân dùng hàng ngày",
      price: "0đ",
      period: "/ mãi mãi",
      featured: false,
      ctaLabel: "Tiếp tục dùng miễn phí",
      ctaAction: "close",
      features: [
        "Quản lý hồ sơ Trường · Lớp · GVCN (nhập 1 lần tự điền)",
        "Điểm danh hàng ngày, danh bạ & nhắn Zalo phụ huynh",
        "Sổ điểm Thông tư 27, tự điền T/H/C & xuất Excel",
        "Soạn Giáo án CV 2345 & xuất file Word / PowerPoint",
        "Bộ Office 3-in-1 (Word, Excel, PowerPoint .pptx)",
        "Dữ liệu lưu cục bộ riêng tư 100% trên thiết bị"
      ]
    },
    {
      id: "pro-gvcn",
      badge: "Phổ biến nhất",
      name: "Gói Pro GVCN",
      subtitle: "Tiết kiệm tối đa thời gian suốt năm học",
      price: "199.000đ",
      period: "/ năm học (tham chiếu)",
      featured: true,
      ctaLabel: "Đăng ký Gói Pro",
      ctaAction: "select",
      serviceValue: "Gói Pro GVCN (Cá nhân)",
      features: [
        "Toàn bộ tính năng của Bản Miễn phí",
        "Đồng bộ đám mây giữa Máy tính & Điện thoại",
        "Kho 50+ mẫu Giáo án, Biên bản họp PH, Thư khen chuẩn",
        "Xuất tài liệu sạch, hỗ trợ in ấn & báo cáo cuối kì nhanh",
        "Cài đặt & hướng dẫn sử dụng 1-1 qua Zalo trong năm học",
        "Ưu tiên cập nhật biểu mẫu mới theo quy định ngành"
      ]
    },
    {
      id: "custom-school",
      badge: "Theo yêu cầu",
      name: "Thiết kế riêng Trường & App",
      subtitle: "Cho Trường học, Tổ khối hoặc đặt làm App giáo dục",
      price: "Từ 2.500.000đ",
      period: "/ gói (tham chiếu)",
      featured: false,
      ctaLabel: "Nhận báo giá thiết kế riêng",
      ctaAction: "select",
      serviceValue: "Thiết kế riêng theo Trường / Khối",
      features: [
        "Gắn Logo, tên Trường & tên miền riêng chuyên nghiệp",
        "Quản trị đa lớp, đa khối, tổng hợp báo cáo cho BGH",
        "Tùy chỉnh đúng biểu mẫu Phòng/Sở GD&ĐT địa phương",
        "Nhận lập trình Web App giáo dục / công cụ riêng theo ý tưởng",
        "Bàn giao trọn gói, hỗ trợ kỹ thuật & nâng cấp lâu dài",
        "Tặng buổi tập huấn online cho toàn bộ giáo viên trường"
      ]
    }
  ],

  // 4. BẢNG SO SÁNH NHANH
  comparison: [
    {
      feature: "Điểm danh, Sổ điểm TT27, Giáo án 2345, Office 3-in-1",
      free: "Đầy đủ",
      pro: "Đầy đủ + Mẫu nâng cao",
      custom: "Tùy chỉnh theo trường"
    },
    {
      feature: "Lưu trữ & Sao lưu dữ liệu",
      free: "Trên thiết bị (.json)",
      pro: "Đồng bộ đa thiết bị",
      custom: "Hệ thống riêng của trường"
    },
    {
      feature: "Biểu mẫu theo Sở/Phòng GD&ĐT & Logo trường",
      free: "Mẫu chuẩn chung",
      pro: "Kho 50+ mẫu chọn lọc",
      custom: "Thiết kế 100% theo mẫu trường"
    },
    {
      feature: "Phân quyền BGH / Tổ trưởng / Nhiều lớp",
      free: "GVCN cá nhân",
      pro: "Nhiều lớp cá nhân",
      custom: "Toàn trường & BGH"
    },
    {
      feature: "Hỗ trợ kỹ thuật & Chỉnh sửa tính năng",
      free: "Hướng dẫn nhanh",
      pro: "Hỗ trợ 1-1 qua Zalo",
      custom: "Hỗ trợ ưu tiên & bảo trì riêng"
    }
  ],

  // 5. DANH SÁCH NHU CẦU TRONG FORM LIÊN HỆ
  services: [
    "Gói Pro GVCN (Cá nhân)",
    "Thiết kế riêng theo Trường / Khối",
    "Đặt làm Web App Giáo dục / Công cụ riêng",
    "Hợp tác giới thiệu / Cộng tác viên"
  ]
};

window.GvcnMonetizationHelper = {
  isPlaceholder(val) {
    if (!val || typeof val !== "string") return true;
    const trimmed = val.trim();
    return !trimmed || /^__.*__$/.test(trimmed);
  },
  hasLiveZalo() {
    const c = window.CONFIG_MONETIZATION || {};
    return !this.isPlaceholder(c.zaloUrl) && /^https?:\/\//i.test(c.zaloUrl.trim());
  },
  hasLivePhone() {
    const c = window.CONFIG_MONETIZATION || {};
    return !this.isPlaceholder(c.zaloPhone);
  },
  hasLiveEmail() {
    const c = window.CONFIG_MONETIZATION || {};
    return !this.isPlaceholder(c.email) && c.email.includes("@");
  },
  hasLiveFacebook() {
    const c = window.CONFIG_MONETIZATION || {};
    return !this.isPlaceholder(c.facebookUrl) && /^https?:\/\//i.test(c.facebookUrl.trim());
  },
  hasLivePayment() {
    const c = window.CONFIG_MONETIZATION || {};
    return !this.isPlaceholder(c.paymentNote);
  }
};
