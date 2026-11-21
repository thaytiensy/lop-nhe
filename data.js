/* Trợ lý GVCN — Dữ liệu mẫu & Hệ thống biểu mẫu tự động điền thông tin Trường · Lớp · GVCN */
window.GvcnData = (() => {
  const DEFAULT_PROFILE = {
    department: "PHÒNG GD&ĐT QUẬN / HUYỆN",
    school: "Trường Tiểu học Bình Minh",
    schoolYear: "2026 - 2027",
    semester: "Học kì I",
    teacherName: "Nguyễn Thị Lan",
    teacherRole: "Cô",
    teacherPhone: "0912 345 678",
    bookSeries: "Kết nối tri thức với cuộc sống",
    group: "Tổ Khối 3",
    slogan: "Mỗi ngày đến trường là một ngày vui"
  };

  const DEFAULT_SUBJECTS = [
    "Toán",
    "Tiếng Việt",
    "Tiếng Anh",
    "Tự nhiên và Xã hội",
    "Khoa học",
    "Lịch sử và Địa lí",
    "Đạo đức",
    "Tin học & Công nghệ",
    "Hoạt động trải nghiệm"
  ];

  const SAMPLE_STUDENTS = [
    { name: "Nguyễn Minh An", parent: "Chị Nguyễn Thị Hoa", phone: "0912345001" },
    { name: "Trần Bảo Ngọc", parent: "Anh Trần Văn Hùng", phone: "0912345002" },
    { name: "Lê Hoàng Nam", parent: "Chị Lê Thu Hà", phone: "0912345003" },
    { name: "Phạm Gia Hân", parent: "Anh Phạm Minh Tuấn", phone: "0912345004" },
    { name: "Võ Đức Anh", parent: "Chị Võ Mỹ Linh", phone: "0912345005" },
    { name: "Đặng Khánh Linh", parent: "Chị Đặng Thanh Mai", phone: "0912345006" },
    { name: "Bùi Quang Huy", parent: "Anh Bùi Quốc Dũng", phone: "0912345007" },
    { name: "Hoàng Thảo Vy", parent: "Chị Hoàng Ngọc Anh", phone: "0912345008" },
    { name: "Đỗ Tuấn Kiệt", parent: "Anh Đỗ Thành Long", phone: "0912345009" },
    { name: "Ngô Phương Anh", parent: "Chị Ngô Bảo Châu", phone: "0912345010" }
  ];

  const SAMPLE_TODOS = [
    { id: "t1", text: "Cập nhật đúng tên Trường, Năm học và Họ tên GVCN ở mục Thông tin Trường · Lớp", done: false },
    { id: "t2", text: "Điểm danh đầu giờ và nhắn phụ huynh các em nghỉ học", done: false },
    { id: "t3", text: "Hoàn thiện nhận xét Thông tư 27 và xuất Slide bài giảng (.pptx)", done: false }
  ];

  const TT27_BANK = {
    Toán: {
      T: [
        "Tính toán nhanh, chính xác; vận dụng linh hoạt kiến thức vào giải toán có lời văn.",
        "Nắm vững kiến thức trọng tâm, tư duy logic tốt, trình bày bài giải khoa học, sạch đẹp.",
        "Hoàn thành tốt các bài tập thực hành, chủ động nêu nhiều cách giải sáng tạo.",
        "Hiểu sâu bản chất phép tính, xử lý tốt bài toán nâng cao và tích cực hỗ trợ bạn."
      ],
      H: [
        "Thực hiện được các phép tính cơ bản; cần rèn thêm tốc độ tính nhẩm và đọc kĩ đề.",
        "Nắm được kiến thức cơ bản của bài học, hoàn thành nhiệm vụ học tập trên lớp.",
        "Biết vận dụng công thức vào bài tập mẫu; cần cẩn thận hơn khi trình bày lời giải.",
        "Hoàn thành các bài tập chuẩn kiến thức; nên luyện thêm dạng toán có lời văn ở nhà."
      ],
      C: [
        "Cần ôn lại bảng tính cơ bản và rèn kĩ năng đọc hiểu đề toán có lời văn.",
        "Còn lúng túng khi đặt tính và thực hiện phép tính có nhớ; cần kèm thêm ở lớp và nhà.",
        "Cần rèn thêm tính cẩn thận khi làm bài và ôn chắc phần kiến thức nền tảng."
      ]
    },
    "Tiếng Việt": {
      T: [
        "Đọc trôi chảy, ngắt nghỉ đúng nhịp, diễn cảm; viết chữ đều đẹp, diễn đạt mạch lạc.",
        "Hiểu sâu nội dung bài đọc, vốn từ phong phú, viết đoạn văn giàu cảm xúc và sáng tạo.",
        "Hăng hái phát biểu, trả lời câu hỏi rõ ràng, chữ viết sạch đẹp đúng chính tả.",
        "Có năng khiếu diễn đạt, sử dụng từ ngữ giàu hình ảnh, trình bày vở rất cẩn thận."
      ],
      H: [
        "Đọc rõ ràng, hiểu được nội dung chính; cần chú ý luyện viết đúng chính tả và giữ vở sạch.",
        "Hoàn thành bài đọc và bài viết đúng yêu cầu; cần mạnh dạn hơn khi chia sẻ trước lớp.",
        "Viết đủ ý đoạn văn ngắn; nên đọc thêm sách để mở rộng vốn từ diễn đạt."
      ],
      C: [
        "Cần luyện đọc to, rõ hàng ngày để cải thiện tốc độ đọc và chính tả nghe – viết.",
        "Còn chậm khi chép bài và diễn đạt câu; cần phụ huynh phối hợp luyện đọc 15 phút mỗi tối."
      ]
    },
    "Tiếng Anh": {
      T: [
        "Phát âm tự tin, nhớ từ vựng nhanh, giao tiếp tốt các mẫu câu trong chủ đề.",
        "Nghe hiểu tốt, tích cực tham gia hoạt động nói theo cặp và trò chơi tiếng Anh.",
        "Sử dụng linh hoạt mẫu câu đã học, phản xạ nhanh và hào hứng trong giờ học."
      ],
      H: [
        "Nhớ được từ vựng và mẫu câu cơ bản; cần luyện nghe và đọc to thêm ở nhà.",
        "Hoàn thành bài tập trên lớp, có cố gắng trong giao tiếp đơn giản."
      ],
      C: [
        "Cần ôn tập lại từ vựng trọng tâm và luyện nghe theo audio sách giáo khoa mỗi ngày."
      ]
    },
    default: {
      T: [
        "Nắm chắc kiến thức bài học, tích cực hợp tác nhóm và biết vận dụng vào thực tế.",
        "Chủ động khám phá, trả lời câu hỏi sắc sảo, hoàn thành xuất sắc sản phẩm học tập.",
        "Có ý thức học tập rất tốt, sáng tạo và nhiệt tình chia sẻ cùng tập thể lớp."
      ],
      H: [
        "Hiểu nội dung cơ bản, tham gia đầy đủ các hoạt động trên lớp; cần mạnh dạn phát biểu hơn.",
        "Hoàn thành nhiệm vụ học tập theo yêu cầu, có ý thức giữ gìn nề nếp lớp học."
      ],
      C: [
        "Cần tập trung hơn trong giờ học và hoàn thành đầy đủ các phiếu bài tập cơ bản."
      ]
    }
  };

  function getTT27Level(score) {
    if (score === "" || score === null || score === undefined || isNaN(Number(score))) return "";
    const n = Number(score);
    if (n >= 8) return "T";
    if (n >= 5) return "H";
    return "C";
  }

  function pickTT27Comment(subject, level, index = 0) {
    const bank = TT27_BANK[subject] || TT27_BANK.default;
    const arr = bank[level] || TT27_BANK.default.H;
    return arr[Math.abs(index) % arr.length];
  }

  function makeOfficialHeader(profile = DEFAULT_PROFILE, className = "3A") {
    const p = { ...DEFAULT_PROFILE, ...profile };
    return `
      <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:14px;">
        <tr>
          <td style="border:none;width:46%;text-align:center;vertical-align:top;">
            <div style="font-size:11.5pt;">${p.department}</div>
            <div style="font-weight:bold;font-size:12pt;">${p.school.toUpperCase()}</div>
            <div style="font-size:11pt;margin-top:2px;">Lớp: ${className} · Năm học ${p.schoolYear}</div>
          </td>
          <td style="border:none;width:54%;text-align:center;vertical-align:top;">
            <div style="font-weight:bold;font-size:11.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight:bold;font-size:12pt;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="font-size:11pt;">————— ★ —————</div>
          </td>
        </tr>
      </table>`;
  }

  const LESSON_PRESETS = {
    toan3: {
      book: "Kết nối tri thức với cuộc sống",
      grade: "3",
      subject: "Toán",
      duration: "1 tiết (35 phút)",
      topic: "Bảng nhân 7 và vận dụng giải toán có lời văn",
      focus: "Thuộc bảng nhân 7 qua trò chơi tiếp sức, vận dụng tính nhanh tình huống thực tế"
    },
    tv4: {
      book: "Chân trời sáng tạo",
      grade: "4",
      subject: "Tiếng Việt",
      duration: "1 tiết (35 phút)",
      topic: "Viết đoạn văn miêu tả một loài cây em yêu thích",
      focus: "Biết dùng từ ngữ gợi tả, biện pháp so sánh, nhân hóa gần gũi"
    },
    tnxh2: {
      book: "Kết nối tri thức với cuộc sống",
      grade: "2",
      subject: "Tự nhiên và Xã hội",
      duration: "1 tiết (35 phút)",
      topic: "An toàn khi tham gia giao thông đường bộ",
      focus: "Nhận biết biển báo quen thuộc và thực hành xử lý tình huống đi bộ an toàn"
    },
    dd5: {
      book: "Cánh Diều",
      grade: "5",
      subject: "Đạo đức",
      duration: "1 tiết (35 phút)",
      topic: "Tôn trọng sự khác biệt của người khác",
      focus: "Biết lắng nghe, không trêu chọc bạn, xây dựng tập thể lớp đoàn kết"
    }
  };

  function buildLessonPlanHTML(cfg, profile = DEFAULT_PROFILE, className = "3A") {
    const p = { ...DEFAULT_PROFILE, ...profile };
    const focusLine = cfg.focus ? `<li><strong>Trọng tâm phân hóa:</strong> ${cfg.focus}</li>` : "";
    return `
      ${makeOfficialHeader(p, className)}
      <h3 style="text-align:center;margin:6px 0 4px;">KẾ HOẠCH BÀI DẠY (CHUẨN CÔNG VĂN 2345)</h3>
      <p style="text-align:center;margin-top:0;">
        <strong>Môn:</strong> ${cfg.subject} · <strong>Lớp:</strong> ${className || cfg.grade} · <strong>Thời lượng:</strong> ${cfg.duration}<br/>
        <strong>Bộ sách:</strong> ${cfg.book} · <strong>Giáo viên thực hiện:</strong> ${p.teacherRole} ${p.teacherName}<br/>
        <strong>Tên bài dạy:</strong> <em>${cfg.topic}</em>
      </p>
      <h4>I. YÊU CẦU CẦN ĐẠT</h4>
      <ul>
        <li><strong>Năng lực đặc thù:</strong> Học sinh nhận biết, trình bày và vận dụng được kiến thức cốt lõi của bài <em>"${cfg.topic}"</em> vào giải quyết bài tập và tình huống thực tế.</li>
        <li><strong>Năng lực chung:</strong> Tự chủ và tự học (chủ động hoàn thành phiếu học tập), giao tiếp và hợp tác (thảo luận nhóm đôi/nhóm 4 hiệu quả).</li>
        <li><strong>Phẩm chất:</strong> Chăm chỉ, trung thực, tôn trọng ý kiến bạn bè, yêu thích môn ${cfg.subject}.</li>
        ${focusLine}
      </ul>
      <h4>II. ĐỒ DÙNG DẠY HỌC</h4>
      <ul>
        <li><strong>Giáo viên:</strong> Kế hoạch bài dạy, bài giảng PowerPoint (Trợ lý GVCN), phiếu bài tập nhóm, bảng phụ.</li>
        <li><strong>Học sinh:</strong> Sách giáo khoa ${cfg.book}, vở ghi, bảng con, bút màu.</li>
      </ul>
      <h4>III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU</h4>
      <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#e6f5f3;">
            <th style="width:22%;">Hoạt động &amp; Thời gian</th>
            <th style="width:39%;">Hoạt động của Giáo viên</th>
            <th style="width:39%;">Hoạt động của Học sinh</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Khởi động</strong><br/>(5 phút)</td>
            <td>Tổ chức trò chơi ngắn "Hộp quà bí mật" ôn kiến thức cũ, dẫn dắt kết nối tự nhiên vào bài <em>"${cfg.topic}"</em>.</td>
            <td>Tham gia trò chơi sôi nổi, trả lời nhanh câu hỏi, xác định nhiệm vụ bài học mới.</td>
          </tr>
          <tr>
            <td><strong>2. Khám phá / Hình thành kiến thức</strong><br/>(12 phút)</td>
            <td>Giao nhiệm vụ quan sát tranh/ví dụ mẫu, tổ chức thảo luận nhóm đôi, gợi mở để HS tự rút ra quy tắc/nội dung chính.</td>
            <td>Thảo luận nhóm, trình bày kết quả, nhận xét chéo và chốt lại ghi nhớ trọng tâm.</td>
          </tr>
          <tr>
            <td><strong>3. Luyện tập – Thực hành</strong><br/>(12 phút)</td>
            <td>Hướng dẫn HS làm bài tập phân hóa theo 2 mức độ (cơ bản – nâng cao), quan sát hỗ trợ kịp thời HS còn lúng túng.</td>
            <td>Làm bài cá nhân/bảng con, đối chiếu đáp án, chữa bài và tự đánh giá mức độ hiểu bài.</td>
          </tr>
          <tr>
            <td><strong>4. Vận dụng – Trải nghiệm</strong><br/>(6 phút)</td>
            <td>Đặt tình huống thực tế gắn với đời sống gia đình/lớp học; khen ngợi, dặn dò chuẩn bị bài sau.</td>
            <td>Liên hệ thực tế, chia sẻ 1 điều em nhớ nhất hôm nay, ghi chú nhiệm vụ về nhà nhẹ nhàng.</td>
          </tr>
        </tbody>
      </table>
      <h4>IV. ĐIỀU CHỈNH SAU BÀI DẠY (nếu có)</h4>
      <p>........................................................................................................................................</p>
    `;
  }

  function buildSlidesFromLesson(cfg, profile = DEFAULT_PROFILE, className = "3A") {
    const p = { ...DEFAULT_PROFILE, ...profile };
    return [
      {
        title: `${cfg.subject.toUpperCase()} — LỚP ${className || cfg.grade}`,
        body: `Bài dạy: ${cfg.topic}\n\n${p.school} · Năm học ${p.schoolYear}\nGiáo viên: ${p.teacherRole} ${p.teacherName}`,
        col2: "",
        layout: "title",
        theme: "emerald",
        fontSize: 18,
        notes: "Chào lớp, ổn định tổ chức và tạo không khí vui vẻ trước khi bắt đầu bài mới."
      },
      {
        title: "Hoạt động 1: Khởi động (5 phút)",
        body: "• Trò chơi nhanh: Hộp quà bí mật\n• Câu hỏi 1: Em hãy nhắc lại kiến thức tiết trước?\n• Câu hỏi 2: Quan sát hình ảnh và đoán chủ đề hôm nay!",
        col2: "",
        layout: "quiz",
        theme: "warm",
        fontSize: 18,
        notes: "Mời 3–4 học sinh xung phong trả lời, tặng sticker hoặc sao khen ngợi."
      },
      {
        title: `Hoạt động 2: Khám phá — ${cfg.topic}`,
        body: "• Quan sát ví dụ mẫu trong sách giáo khoa\n• Thảo luận nhóm đôi trong 3 phút\n• Tự rút ra quy tắc / nội dung cốt lõi của bài",
        col2: cfg.focus ? `Lưu ý trọng tâm:\n${cfg.focus}` : "Ghi nhớ nhanh:\n• Lắng nghe bạn trình bày\n• Ghi ý chính ngắn gọn\n• Hỏi ngay khi chưa rõ",
        layout: "two-col",
        theme: "paper",
        fontSize: 18,
        notes: "Mời 2 nhóm trình bày, giáo viên chốt ngắn gọn kiến thức trọng tâm."
      },
      {
        title: "Hoạt động 3: Luyện tập – Thực hành",
        body: "• Nhiệm vụ 1 (Cơ bản): Hoàn thành bài tập 1 vào bảng con\n• Nhiệm vụ 2 (Vận dụng): Làm bài tập 2 vào vở\n• Thử thách ngôi sao: Chia sẻ cách làm nhanh nhất của em",
        col2: "",
        layout: "content",
        theme: "chalk",
        fontSize: 18,
        notes: "Quan sát hỗ trợ học sinh chậm, khen ngay các em trình bày sạch đẹp."
      },
      {
        title: "Hoạt động 4: Vận dụng & Dặn dò",
        body: "• Em áp dụng kiến thức hôm nay vào việc gì ở nhà?\n• Chia sẻ với bố mẹ 1 điều thú vị em học được\n• Chuẩn bị đồ dùng cho tiết học tiếp theo",
        col2: "",
        layout: "content",
        theme: "navy",
        fontSize: 18,
        notes: "Tổng kết tiết học nhẹ nhàng, biểu dương tinh thần học tập của cả lớp."
      }
    ];
  }

  function buildMeetingSlides(profile = DEFAULT_PROFILE, cls = { name: "3A", students: [] }) {
    const p = { ...DEFAULT_PROFILE, ...profile };
    const total = cls.students?.length || 0;
    return [
      {
        title: `HỌP PHỤ HUYNH LỚP ${cls.name}`,
        body: `${p.school}\nNăm học ${p.schoolYear} · ${p.semester}\n\nGiáo viên chủ nhiệm: ${p.teacherRole} ${p.teacherName}\nSĐT/Zalo: ${p.teacherPhone}`,
        col2: "",
        layout: "title",
        theme: "emerald",
        fontSize: 18,
        notes: "Chào đón quý phụ huynh, giới thiệu ngắn gọn chương trình buổi họp."
      },
      {
        title: "1. Thông tin chung & Đặc điểm lớp",
        body: `• Tổng sĩ số lớp ${cls.name}: ${total} học sinh\n• Bộ sách đang học: ${p.bookSeries}\n• Mục tiêu chung: "${p.slogan}"\n• Tinh thần chung: Đa số các con ngoan, lễ phép, hòa đồng với bạn bè`,
        col2: "",
        layout: "content",
        theme: "paper",
        fontSize: 18,
        notes: "Nhấn mạnh những điểm sáng tích cực của tập thể lớp trước khi nêu lưu ý."
      },
      {
        title: "2. Đánh giá theo Thông tư 27",
        body: "Ưu điểm nổi bật:\n• Duy trì tốt nề nếp chuyên cần\n• Tích cực tham gia thảo luận nhóm\n• Nhiều em tiến bộ rõ ở chữ viết và tính nhẩm",
        col2: "Nội dung cần phối hợp thêm:\n• Rèn thói quen tự soạn sách vở\n• Đọc sách 15 phút mỗi tối\n• Hạn chế điện thoại/TV trước giờ ngủ",
        layout: "two-col",
        theme: "navy",
        fontSize: 18,
        notes: "Giải thích rõ 3 mức T / H / C theo Thông tư 27 để phụ huynh không gây áp lực điểm số."
      },
      {
        title: "3. Thống nhất phối hợp Gia đình – GVCN",
        body: `• Kênh trao đổi chính: Nhóm Zalo lớp ${cls.name} & nhắn riêng GVCN (${p.teacherPhone})\n• Xin phép nghỉ học: Nhắn trước 7h30 sáng để cô/thầy nắm tình hình\n• Cùng đồng hành nhẹ nhàng, khích lệ sự tiến bộ mỗi ngày của các con`,
        col2: "",
        layout: "content",
        theme: "warm",
        fontSize: 18,
        notes: "Dành 10–15 phút lắng nghe ý kiến đóng góp của phụ huynh và cảm ơn."
      }
    ];
  }

  function buildWeeklySlides(profile = DEFAULT_PROFILE, cls = { name: "3A", students: [] }) {
    const p = { ...DEFAULT_PROFILE, ...profile };
    return [
      {
        title: `SINH HOẠT LỚP ${cls.name} — CUỐI TUẦN`,
        body: `${p.school} · Năm học ${p.schoolYear}\n"${p.slogan}"`,
        col2: "",
        layout: "title",
        theme: "plum",
        fontSize: 18,
        notes: "Tổ chức sinh hoạt lớp theo hướng tích cực, khích lệ là chính."
      },
      {
        title: "Những bông hoa việc tốt tuần này",
        body: "• Chuyên cần & Đi học đúng giờ: Cả lớp cố gắng rất tốt!\n• Học tập tích cực: Tuyên dương các bạn hăng hái phát biểu\n• Giữ gìn vệ sinh & Đoàn kết: Các tổ trực nhật sạch sẽ",
        col2: "",
        layout: "content",
        theme: "warm",
        fontSize: 18,
        notes: "Cho lớp trưởng/tổ trưởng nêu tên các bạn nổi bật trong tuần."
      },
      {
        title: "Mục tiêu tuần tới của lớp ta",
        body: "• Đi học đúng giờ, trang phục gọn gàng\n• Mỗi bạn đọc ít nhất 1 câu chuyện hay để chia sẻ\n• Giữ trật tự đầu giờ và giúp đỡ bạn cùng tiến bộ",
        col2: "",
        layout: "content",
        theme: "emerald",
        fontSize: 18,
        notes: "Chốt kế hoạch tuần mới và thưởng sticker/phiếu bé ngoan."
      }
    ];
  }

  function buildParentMessage({ student, profile = DEFAULT_PROFILE, className = "3A", type, extra, gradeRec, gradeSubject }) {
    const p = { ...DEFAULT_PROFILE, ...profile };
    const x = p.teacherRole || "Cô";
    const xLow = x.toLowerCase();
    const stuName = student?.name || "con";
    const parentGreeting = student?.parent ? `Chào ${student.parent} (PH bé ${stuName} - Lớp ${className})` : `Chào gia đình bé ${stuName} (Lớp ${className})`;
    const sign = `\n\nTrân trọng,\n${x} ${p.teacherName} — GVCN lớp ${className} (${p.school})`;
    const extraTxt = extra ? `\n• Ghi nhận thêm: ${extra}` : "";

    const map = {
      khen: `${parentGreeting} ạ,\n\nHôm nay ${xLow} rất vui báo tin để gia đình cùng khích lệ con: trong giờ học con rất tập trung, hoàn thành bài tốt và chủ động phát biểu.${extraTxt}\n\nBố mẹ dành lời khen nhỏ tối nay để con thêm tự tin nhé!${sign}`,
      nhac: `${parentGreeting} ạ,\n\n${x} gửi một lưu ý nhỏ để bố mẹ nhắc giúp con tối nay: con còn thiếu phần bài tập/đồ dùng cho tiết học ngày mai.${extraTxt}\n\nBố mẹ nhắc nhẹ để con tự kiểm tra cặp sách trước khi ngủ giúp rèn tính tự lập ạ.${sign}`,
      vang: `${parentGreeting} ạ,\n\nHôm nay lớp điểm danh thấy con vắng học nên ${xLow} nhắn hỏi thăm sức khỏe của bé.${extraTxt}\n\nGia đình cứ cho con nghỉ ngơi thoải mái, khi con đi học lại ${xLow} sẽ hướng dẫn con nắm lại phần bài chính nhẹ nhàng. Chúc bé mau khỏe!${sign}`,
      hop: `Kính gửi quý phụ huynh lớp ${className} — ${p.school},\n\nNhân dịp ${p.semester} năm học ${p.schoolYear}, ${xLow} trân trọng kính mời quý phụ huynh tham dự buổi họp phụ huynh lớp để cùng trao đổi tình hình học tập của các con.\n• Thời gian: ..................................\n• Địa điểm: Phòng học lớp ${className}${extraTxt}\n\nRất mong nhận được sự hiện diện đầy đủ của quý phụ huynh.${sign}`,
      tuan: `Chào quý phụ huynh lớp ${className} (${p.school}) ạ,\n\n${x} xin gửi nhanh tổng kết tuần học vừa qua của lớp:\n• Điểm sáng: Các con đi học chuyên cần, giữ nề nếp tốt và hào hứng trong hoạt động nhóm.\n• Phối hợp tuần tới: Bố mẹ nhắc con đọc sách 15 phút mỗi tối và mang đầy đủ đồ dùng học tập.${extraTxt}\n\nChúc các gia đình cuối tuần thật ấm áp!${sign}`,
      kem: `${parentGreeting} ạ,\n\nQua theo dõi vài tiết gần đây, ${xLow} thấy con rất ngoan nhưng còn hơi chậm ở phần kiến thức nền. Nếu được, ${xLow} và gia đình cùng phối hợp ôn nhẹ 10–15 phút mỗi tối để con bắt kịp và tự tin hơn.${extraTxt}\n\nKhi nào tiện, bố mẹ nhắn lại ${xLow} trao đổi thêm cách hỗ trợ phù hợp nhất cho bé nhé!${sign}`,
      diem: `${parentGreeting} ạ,\n\n${x} xin gửi kết quả đánh giá môn ${gradeSubject || "Toán"} gần nhất của bé ${stuName}:\n• Điểm số: ${gradeRec?.score ?? "—"}\n• Mức đạt (TT27): ${gradeRec?.level === "T" ? "Hoàn thành tốt (T)" : gradeRec?.level === "H" ? "Hoàn thành (H)" : gradeRec?.level === "C" ? "Chưa hoàn thành (C)" : "—"}\n• Nhận xét: ${gradeRec?.comment || "Con có cố gắng trong học tập."}${extraTxt}\n\nMong gia đình tiếp tục khích lệ và đồng hành cùng con ạ!${sign}`
    };
    return map[type] || map.khen;
  }

  const WORD_TEMPLATES = {
    khbd: (profile, cls) => buildLessonPlanHTML(LESSON_PRESETS.toan3, profile, cls?.name || "3A"),
    khcn: (profile = DEFAULT_PROFILE, cls = { name: "3A", students: [] }) => {
      const p = { ...DEFAULT_PROFILE, ...profile };
      return `
        ${makeOfficialHeader(p, cls.name)}
        <h2 style="text-align:center;">KẾ HOẠCH CÔNG TÁC CHỦ NHIỆM LỚP ${cls.name}</h2>
        <p style="text-align:center;"><strong>Năm học:</strong> ${p.schoolYear} · <strong>GVCN:</strong> ${p.teacherRole} ${p.teacherName} (${p.group})</p>
        <h4>I. ĐẶC ĐIỂM TÌNH HÌNH LỚP</h4>
        <ul>
          <li><strong>Sĩ số:</strong> ${cls.students?.length || 0} học sinh.</li>
          <li><strong>Bộ sách sử dụng:</strong> ${p.bookSeries}.</li>
          <li><strong>Khẩu hiệu thi đua:</strong> "${p.slogan}".</li>
        </ul>
        <h4>II. MỤC TIÊU &amp; CHỈ TIÊU PHẤN ĐẤU</h4>
        <ul>
          <li>100% học sinh đi học chuyên cần, thực hiện tốt nề nếp, lễ phép với thầy cô và đoàn kết với bạn bè.</li>
          <li>Hoàn thành chương trình lớp học theo Thông tư 27; hỗ trợ kịp thời học sinh còn chậm tiến bộ.</li>
          <li>Xây dựng mối liên hệ chặt chẽ, tích cực giữa GVCN và 100% phụ huynh học sinh.</li>
        </ul>
        <h4>III. BIỆN PHÁP THỰC HIỆN CHÍNH</h4>
        <p>1. Tổ chức giờ sinh hoạt lớp tích cực, tuyên dương kịp thời những tiến bộ nhỏ hàng tuần.<br/>
        2. Phối hợp thường xuyên với phụ huynh qua nhóm lớp và trao đổi riêng khi cần hỗ trợ.<br/>
        3. Kết hợp trò chơi học tập, trải nghiệm sáng tạo để tạo hứng thú đến trường cho các em.</p>
        <p style="text-align:right;margin-top:24px;"><strong>Giáo viên chủ nhiệm</strong><br/><br/><em>${p.teacherName}</em></p>`;
    },
    bienban: (profile = DEFAULT_PROFILE, cls = { name: "3A", students: [] }) => {
      const p = { ...DEFAULT_PROFILE, ...profile };
      return `
        ${makeOfficialHeader(p, cls.name)}
        <h2 style="text-align:center;">BIÊN BẢN HỌP PHỤ HUYNH LỚP ${cls.name}</h2>
        <p><strong>1. Thời gian:</strong> ... giờ ..., ngày ... tháng ... năm 20...</p>
        <p><strong>2. Địa điểm:</strong> Phòng học lớp ${cls.name} — ${p.school}</p>
        <p><strong>3. Thành phần:</strong> GVCN ${p.teacherRole} ${p.teacherName} và ...... / ${cls.students?.length || 0} phụ huynh</p>
        <p><strong>4. Nội dung trao đổi chính:</strong></p>
        <ul>
          <li>Đánh giá tình hình nề nếp, chuyên cần và kết quả học tập ${p.semester} theo Thông tư 27.</li>
          <li>Thống nhất phương pháp phối hợp giữa gia đình và nhà trường (rèn tự học, đọc sách, hạn chế thiết bị điện tử).</li>
          <li>Ý kiến đóng góp của phụ huynh và kế hoạch hoạt động trải nghiệm sắp tới.</li>
        </ul>
        <p><strong>5. Kết luận:</strong> 100% phụ huynh tham dự nhất trí với kế hoạch giáo dục của lớp.</p>
        <table style="width:100%;margin-top:26px;border:none;">
          <tr>
            <td style="border:none;text-align:center;"><strong>Thư kí cuộc họp</strong><br/><em>(Kí, ghi rõ họ tên)</em></td>
            <td style="border:none;text-align:center;"><strong>Giáo viên chủ nhiệm</strong><br/><br/><strong>${p.teacherName}</strong></td>
          </tr>
        </table>`;
    },
    phieu: (profile = DEFAULT_PROFILE, cls = { name: "3A" }) => {
      const p = { ...DEFAULT_PROFILE, ...profile };
      return `
        <p style="text-align:center;margin-bottom:4px;"><strong>${p.school.toUpperCase()}</strong> · Lớp ${cls.name} · Năm học ${p.schoolYear}</p>
        <h2 style="text-align:center;margin-top:0;">PHIẾU BÀI TẬP CUỐI TUẦN</h2>
        <p><strong>Họ và tên:</strong> ..................................................... &nbsp;&nbsp; <strong>Lớp:</strong> ${cls.name}</p>
        <p><strong>Phần I. Trắc nghiệm nhanh (Khoanh tròn chữ cái trước câu trả lời đúng)</strong></p>
        <p>Câu 1: Kết quả của phép tính 7 × 8 là: &nbsp; A. 49 &nbsp;&nbsp; B. 54 &nbsp;&nbsp; C. 56 &nbsp;&nbsp; D. 63</p>
        <p>Câu 2: Từ nào dưới đây chỉ hoạt động? &nbsp; A. Xinh đẹp &nbsp;&nbsp; B. Chăm chỉ &nbsp;&nbsp; C. Đọc sách &nbsp;&nbsp; D. Bàn học</p>
        <p><strong>Phần II. Tự luận &amp; Vận dụng</strong></p>
        <p>Bài 1: Đặt tính rồi tính: 348 + 275 &nbsp;&nbsp;|&nbsp;&nbsp; 620 − 184</p>
        <p>Bài 2: Em hãy viết 3–4 câu kể về một việc tốt em đã làm cùng gia đình cuối tuần này.</p>
        <p><em>Nhận xét của ${p.teacherRole} ${p.teacherName}: ........................................................................................</em></p>`;
    },
    giaykhen: (profile = DEFAULT_PROFILE, cls = { name: "3A", students: [] }) => {
      const p = { ...DEFAULT_PROFILE, ...profile };
      const firstStu = cls.students?.[0]?.name || "NGUYỄN MINH AN";
      return `
        <div style="border:4px double #0f766e;padding:28px;text-align:center;">
          <p style="letter-spacing:1.5px;font-weight:bold;color:#0f766e;">${p.school.toUpperCase()} · LỚP ${cls.name}</p>
          <h1 style="color:#b45309;margin:10px 0;">THƯ KHEN HỌC SINH</h1>
          <p>${p.teacherRole} nhiệt liệt tuyên dương em:</p>
          <h2 style="margin:8px 0;">${firstStu.toUpperCase()}</h2>
          <p>Đã có thành tích <strong>tiến bộ vượt bậc trong học tập, chăm ngoan và tích cực giúp đỡ bạn bè</strong> trong ${p.semester} năm học ${p.schoolYear}.</p>
          <p style="margin-top:20px;"><em>"${p.slogan}"</em></p>
          <p style="text-align:right;margin-top:26px;"><strong>Giáo viên chủ nhiệm</strong><br/>${p.teacherName}</p>
        </div>`;
    },
    don: (profile = DEFAULT_PROFILE, cls = { name: "3A" }) => {
      const p = { ...DEFAULT_PROFILE, ...profile };
      return `
        <p style="text-align:center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>Độc lập – Tự do – Hạnh phúc</p>
        <h2 style="text-align:center;">ĐƠN XIN NGHỈ PHÉP</h2>
        <p><strong>Kính gửi:</strong> Ban Giám hiệu ${p.school}</p>
        <p><strong>Tôi tên là:</strong> ${p.teacherName} — Giáo viên chủ nhiệm lớp ${cls.name} (${p.group})</p>
        <p>Nay tôi viết đơn này kính xin Ban Giám hiệu cho phép tôi nghỉ phép ngày ..../..../20.... vì lý do: .................................</p>
        <p>Tôi đã bàn giao kế hoạch dạy thay đầy đủ để đảm bảo không ảnh hưởng đến việc học của lớp ${cls.name}.</p>
        <p>Kính mong Ban Giám hiệu xem xét chấp thuận. Tôi xin chân thành cảm ơn!</p>
        <p style="text-align:right;margin-top:24px;"><strong>Người làm đơn</strong><br/><br/>${p.teacherName}</p>`;
    }
  };

  const SHEET_TEMPLATES = {
    fund: [
      ["STT", "Ngày", "Nội dung Thu / Chi quỹ lớp", "Thu (VNĐ)", "Chi (VNĐ)", "Ghi chú"],
      [1, "01/11", "Tồn quỹ đầu tháng", 1500000, 0, "Chuyển sang"],
      [2, "05/11", "In phiếu bài tập cuối tuần", 0, 120000, "40 bản"],
      [3, "10/11", "Mua sticker & phần thưởng khen", 0, 185000, "Khen học sinh"],
      [4, "15/11", "Phụ huynh ủng hộ quỹ trải nghiệm", 500000, 0, "Tự nguyện"],
      [5, "18/11", "Nước uống giờ sinh hoạt", 0, 95000, ""],
      ["", "", "TỔNG CỘNG / CÒN LẠI", "=SUM(D2:D6)", "=SUM(E2:E6)", "=D7-E7"]
    ],
    schedule: [
      ["Tiết", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"],
      ["Tiết 1", "HĐTN (Chào cờ)", "Toán", "Tiếng Việt", "Toán", "Tiếng Việt"],
      ["Tiết 2", "Tiếng Việt", "Tiếng Việt", "Toán", "Tiếng Việt", "Toán"],
      ["Tiết 3", "Toán", "Tiếng Anh", "TNXH", "Tiếng Anh", "Đạo đức"],
      ["Tiết 4", "Tin học", "Âm nhạc", "Mĩ thuật", "GDTC", "SHL (Cuối tuần)"]
    ]
  };

  return {
    DEFAULT_PROFILE,
    DEFAULT_SUBJECTS,
    SAMPLE_STUDENTS,
    SAMPLE_TODOS,
    LESSON_PRESETS,
    WORD_TEMPLATES,
    SHEET_TEMPLATES,
    getTT27Level,
    pickTT27Comment,
    makeOfficialHeader,
    buildLessonPlanHTML,
    buildSlidesFromLesson,
    buildMeetingSlides,
    buildWeeklySlides,
    buildParentMessage
  };
})();
