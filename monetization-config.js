/* ==========================================================================
   CẤU HÌNH BÁN HÀNG, GÓI NÂNG CẤP & LIÊN HỆ — TRỢ LÝ GVCN
   ==========================================================================
   Mọi thông tin liên hệ, bảng giá ưu đãi và mẫu tin nhắn trong ứng dụng
   được quản lý tập trung tại window.CONFIG_MONETIZATION.
   ========================================================================== */

window.CONFIG_MONETIZATION = {
  // 1. THÔNG TIN LIÊN HỆ CHÍNH THỨC
  brandName: "Trợ lý GVCN",
  authorLabel: "Liên hệ Admin",
  liveUrl: "https://lop-nhe.vercel.app",
  zaloPhone: "0353205414",
  zaloUrl: "https://zalo.me/0353205414",
  facebookUrl: "",
  email: "thaytiensy@gmail.com",
  supportHours: "8:00 – 21:00 (Thứ 2 – Chủ nhật)",
  paymentNote:
    "Nhắn Zalo 0353205414 hoặc gửi Email thaytiensy@gmail.com để kích hoạt nhanh trong 5 phút",

  // 2. NỘI DUNG CHIA SẺ NHANH LÊN FACEBOOK / ZALO
  shareTitle:
    "Trợ lý GVCN — Quản lý lớp học, Sổ điểm TT27, Giáo án 2345 & Bộ Office miễn phí",
  shareText:
    "Chia sẻ cho thầy cô công cụ Trợ lý GVCN dùng miễn phí ngay trên trình duyệt (không cần cài đặt, không cần đăng nhập):\n" +
    "✓ Điểm danh, lưu SĐT & nhắn nhanh Zalo phụ huynh\n" +
    "✓ Sổ điểm Thông tư 27 tự động xếp T/H/C\n" +
    "✓ Soạn Giáo án CV 2345 & tạo Slide PowerPoint (.pptx) thật\n" +
    "✓ Tích hợp sẵn Word, Excel, PowerPoint 3-in-1\n" +
    "Dùng thử ngay tại: https://lop-nhe.vercel.app",

  // 3. BẢNG GÓI DỊCH VỤ (ƯU ĐÃI MỞ BÁN)
  pricingDisclaimer:
    "Ưu đãi mở bán áp dụng trực tiếp khi đăng ký qua Zalo 0353205414 hoặc Email thaytiensy@gmail.com.",
  plans: [
    {
      id: "free",
      badge: "Đang sử dụng",
      name: "Bản Cơ bản",
      subtitle: "Mở miễn phí toàn bộ tính năng cốt lõi trên web",
      price: "0đ",
      period: "/ mãi mãi",
      originalPrice: "",
      promoTag: "",
      priceHint: "Dùng ngay không cần đăng nhập",
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
      badge: "Ưu đãi mở bán",
      name: "Gói Pro GVCN",
      subtitle: "Tiết kiệm tối đa thời gian suốt năm học",
      price: "149.000đ",
      period: "/ năm học",
      originalPrice: "299.000đ",
      promoTag: "Giảm 50%",
      priceHint: "Chỉ ~12.000đ/tháng",
      featured: true,
      ctaLabel: "Đăng ký Gói Pro — 149.000đ",
      ctaAction: "select",
      serviceValue: "Gói Pro GVCN (149.000đ/năm học)",
      features: [
        "Toàn bộ tính năng của Bản Cơ bản miễn phí",
        "Đồng bộ đám mây giữa Máy tính & Điện thoại",
        "Kho 50+ mẫu Giáo án, Biên bản họp PH, Thư khen chuẩn",
        "Xuất tài liệu sạch, hỗ trợ in ấn & báo cáo cuối kì nhanh",
        "Cài đặt & hướng dẫn sử dụng 1-1 qua Zalo trong năm học",
        "Ưu tiên cập nhật biểu mẫu mới theo quy định ngành"
      ]
    },
    {
      id: "custom-school",
      badge: "Ưu đãi mở bán",
      name: "Thiết kế riêng Trường & App",
      subtitle: "Cho Trường học, Tổ khối hoặc đặt làm App theo yêu cầu",
      price: "Từ 1.990.000đ",
      period: "/ gói",
      originalPrice: "2.500.000đ",
      promoTag: "Ưu đãi Trường",
      priceHint: "Bàn giao trọn gói & hỗ trợ kỹ thuật",
      featured: false,
      ctaLabel: "Nhận báo giá thiết kế riêng",
      ctaAction: "select",
      serviceValue: "Thiết kế riêng Trường & App (Từ 1.990.000đ/gói)",
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
      free: "Miễn phí 100%",
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
      feature: "Hỗ trợ kỹ thuật & Kích hoạt",
      free: "Hướng dẫn nhanh",
      pro: "Hỗ trợ 1-1 qua Zalo 0353205414",
      custom: "Hỗ trợ ưu tiên & bảo trì riêng"
    }
  ],

  // 5. DANH SÁCH NHU CẦU TRONG FORM LIÊN HỆ
  services: [
    "Gói Pro GVCN (149.000đ/năm học)",
    "Thiết kế riêng Trường & App (Từ 1.990.000đ/gói)",
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
