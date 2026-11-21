/* Dữ liệu mẫu & Ngân hàng nội dung VIP Pro cho Giáo viên Tiểu học (CTGDPT 2018 · TT27 · CV2345) */
window.LopNheData = (() => {
  const SAMPLE_STUDENTS = [
    "Nguyễn Minh An",
    "Trần Bảo Ngọc",
    "Lê Hoàng Nam",
    "Phạm Gia Hân",
    "Võ Đức Anh",
    "Đặng Khánh Linh",
    "Bùi Quang Huy",
    "Hoàng Thảo Vy",
    "Đỗ Tuấn Kiệt",
    "Ngô Phương Anh"
  ];

  const SAMPLE_TODOS = [
    { id: "t1", text: "Điểm danh đầu giờ lớp 3A và nhắn PH học sinh vắng", done: false },
    { id: "t2", text: "Hoàn thiện nhận xét Thông tư 27 môn Toán giữa kì I", done: false },
    { id: "t3", text: "Xuất giáo án KHBD 2345 & bộ Slide tiết Toán ngày mai", done: true }
  ];

  const TT27_BANK = {
    Toán: {
      T: [
        "Tính toán nhanh, chính xác; vận dụng linh hoạt kiến thức vào giải toán có lời văn.",
        "Nắm vững kiến thức trọng tâm, tư duy logic tốt, trình bày bài giải khoa học, sạch đẹp.",
        "Hoàn thành tốt các bài tập thực hành, chủ động nêu nhiều cách giải hay."
      ],
      H: [
        "Thực hiện được các phép tính cơ bản; cần rèn thêm tốc độ tính nhẩm và đọc kĩ đề.",
        "Nắm được kiến thức cơ bản của bài học, hoàn thành nhiệm vụ học tập trên lớp.",
        "Biết vận dụng công thức vào bài tập mẫu; cần cẩn thận hơn khi trình bày lời giải."
      ],
      C: [
        "Cần ôn lại bảng tính cơ bản và rèn kĩ năng đọc hiểu đề toán có lời văn.",
        "Còn lúng túng khi đặt tính và thực hiện phép tính có nhớ; cần kèm thêm ở lớp và nhà."
      ]
    },
    "Tiếng Việt": {
      T: [
        "Đọc trôi chảy, ngắt nghỉ đúng nhịp, diễn cảm; viết chữ đều đẹp, diễn đạt mạch lạc.",
        "Hiểu sâu nội dung bài đọc, vốn từ phong phú, viết đoạn văn giàu cảm xúc và sáng tạo.",
        "Hăng hái phát biểu, trả lời câu hỏi rõ ràng, chữ viết sạch đẹp đúng chính tả."
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
        "Nghe hiểu tốt, tích cực tham gia hoạt động nói theo cặp và trò chơi tiếng Anh."
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
        "Chủ động khám phá, trả lời câu hỏi sắc sảo, hoàn thành xuất sắc sản phẩm học tập."
      ],
      H: [
        "Hiểu nội dung cơ bản, tham gia đầy đủ các hoạt động trên lớp; cần mạnh dạn phát biểu hơn.",
        "Hoàn thành nhiệm vụ học tập theo yêu cầu, có ý thức giữ gìn nề nếp."
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
    return arr[index % arr.length];
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

  function buildLessonPlanHTML({ book, grade, subject, duration, topic, focus }) {
    const focusLine = focus ? `<li><strong>Trọng tâm phân hóa:</strong> ${focus}</li>` : "";
    return `
      <h3 style="text-align:center;margin-bottom:4px;">KẾ HOẠCH BÀI DẠY (CHUẨN CÔNG VĂN 2345)</h3>
      <p style="text-align:center;margin-top:0;"><strong>Môn:</strong> ${subject} · <strong>Lớp:</strong> ${grade} · <strong>Thời lượng:</strong> ${duration}<br/>
      <strong>Bộ sách:</strong> ${book} · <strong>Bài dạy:</strong> ${topic}</p>
      <h4>I. YÊU CẦU CẦN ĐẠT</h4>
      <ul>
        <li><strong>Năng lực đặc thù:</strong> Học sinh nhận biết, trình bày và vận dụng được kiến thức cốt lõi của bài <em>"${topic}"</em> vào giải quyết bài tập và tình huống gần gũi.</li>
        <li><strong>Năng lực chung:</strong> Tự chủ và tự học (chủ động hoàn thành phiếu học tập), giao tiếp và hợp tác (thảo luận nhóm đôi/nhóm 4 hiệu quả).</li>
        <li><strong>Phẩm chất:</strong> Chăm chỉ, trung thực, tôn trọng ý kiến bạn bè, yêu thích môn ${subject}.</li>
        ${focusLine}
      </ul>
      <h4>II. ĐỒ DÙNG DẠY HỌC</h4>
      <ul>
        <li><strong>Giáo viên:</strong> Kế hoạch bài dạy, bài giảng điện tử (Slide Lớp Nhẹ Pro), phiếu bài tập nhóm, bảng phụ.</li>
        <li><strong>Học sinh:</strong> Sách giáo khoa ${book}, vở ghi, bảng con, bút màu.</li>
      </ul>
      <h4>III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU</h4>
      <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#eef6f1;">
            <th style="width:22%;">Hoạt động &amp; Thời gian</th>
            <th style="width:39%;">Hoạt động của Giáo viên</th>
            <th style="width:39%;">Hoạt động của Học sinh</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Khởi động</strong><br/>(5 phút)</td>
            <td>Tổ chức trò chơi ngắn "Hộp quà bí mật" ôn kiến thức cũ, dẫn dắt kết nối tự nhiên vào bài <em>"${topic}"</em>.</td>
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

  function buildSlidesFromLesson({ grade, subject, topic, focus }) {
    return [
      {
        title: `${subject.toUpperCase()} LỚP ${grade}`,
        body: `Bài dạy: ${topic}\n\nGiáo viên thực hiện: ........................\nLớp Nhẹ Pro · Bài giảng điện tử`,
        col2: "",
        layout: "title",
        theme: "chalk",
        notes: "Chào lớp, ổn định tổ chức và tạo không khí vui vẻ trước khi vào bài."
      },
      {
        title: "Hoạt động 1: Khởi động (5 phút)",
        body: "• Trò chơi nhanh: Hộp quà bí mật\n• Câu hỏi 1: Em hãy nhắc lại kiến thức tiết trước?\n• Câu hỏi 2: Quan sát hình ảnh và đoán chủ đề hôm nay!",
        col2: "",
        layout: "quiz",
        theme: "warm",
        notes: "Cho 3–4 học sinh xung phong, thưởng sticker/sao khen ngợi."
      },
      {
        title: `Hoạt động 2: Khám phá — ${topic}`,
        body: "• Quan sát ví dụ mẫu trong sách giáo khoa\n• Thảo luận nhóm đôi trong 3 phút\n• Rút ra quy tắc / nội dung cốt lõi của bài",
        col2: focus ? `Lưu ý trọng tâm:\n${focus}` : "Ghi nhớ nhanh:\n• Lắng nghe bạn trình bày\n• Ghi ý chính ngắn gọn\n• Hỏi ngay khi chưa rõ",
        layout: "two-col",
        theme: "paper",
        notes: "Mời 2 nhóm trình bày, giáo viên chốt kiến thức ngắn gọn lên bảng."
      },
      {
        title: "Hoạt động 3: Luyện tập – Thực hành",
        body: "• Nhiệm vụ 1 (Cơ bản): Hoàn thành bài tập 1 vào bảng con\n• Nhiệm vụ 2 (Vận dụng): Làm bài tập 2 vào vở\n• Thử thách ngôi sao: Chia sẻ cách làm nhanh nhất của em",
        col2: "",
        layout: "content",
        theme: "chalk",
        notes: "Đi quanh lớp hỗ trợ học sinh chậm, khen ngay các em trình bày sạch đẹp."
      },
      {
        title: "Hoạt động 4: Vận dụng & Dặn dò",
        body: "• Em áp dụng kiến thức hôm nay vào việc gì ở nhà?\n• Chia sẻ với bố mẹ 1 điều thú vị em học được\n• Chuẩn bị đồ dùng cho tiết học tiếp theo",
        col2: "",
        layout: "content",
        theme: "navy",
        notes: "Tổng kết tiết học nhẹ nhàng, biểu dương tinh thần học tập của cả lớp."
      }
    ];
  }

  function buildParentMessage({ studentName, className, role, type, extra }) {
    const x = role || "Cô";
    const xLow = x.toLowerCase();
    const extraTxt = extra ? `\n• Ghi nhận thêm: ${extra}` : "";
    const map = {
      khen: `Chào gia đình bé ${studentName} (Lớp ${className}) ạ,\n\nHôm nay ${xLow} rất vui báo tin để bố mẹ cùng khích lệ con: trong giờ học con rất tập trung, hoàn thành bài tốt và chủ động phát biểu.${extraTxt}\n\nMong bố mẹ dành lời khen nhỏ tối nay để con thêm tự tin nhé. Cảm ơn gia đình đã luôn đồng hành cùng ${xLow}!`,
      nhac: `Chào gia đình bé ${studentName} (Lớp ${className}) ạ,\n\n${x} xin gửi một lưu ý nhỏ để bố mẹ nhắc giúp con tối nay: con còn thiếu một phần bài/đồ dùng cho tiết học ngày mai.${extraTxt}\n\nBố mẹ chỉ cần nhắc nhẹ để con tự kiểm tra cặp sách trước khi ngủ giúp rèn tính tự lập ạ. Cảm ơn gia đình nhiều!`,
      vang: `Chào gia đình bé ${studentName} (Lớp ${className}) ạ,\n\nHôm nay lớp điểm danh thấy con nghỉ học nên ${xLow} nhắn hỏi thăm tình hình sức khỏe của bé.${extraTxt}\n\nGia đình cứ cho con nghỉ ngơi thoải mái, khi nào con khỏe lại ${xLow} sẽ hướng dẫn con nắm lại phần bài chính nhẹ nhàng. Chúc bé mau khỏe!`,
      hop: `Kính gửi quý phụ huynh lớp ${className},\n\nThay mặt nhà trường, ${xLow} trân trọng kính mời quý phụ huynh tham dự buổi họp phụ huynh trao đổi tình hình học tập và phối hợp giáo dục các con.\n• Thời gian: ..................................\n• Địa điểm: Phòng học lớp ${className}${extraTxt}\n\nRất mong nhận được sự hiện diện đầy đủ của quý phụ huynh. Trân trọng cảm ơn!`,
      tuan: `Chào quý phụ huynh lớp ${className} ạ,\n\n${x} xin gửi nhanh tổng kết tuần học vừa qua của lớp:\n• Điểm sáng: Các con đi học chuyên cần, giữ nề nếp tốt và hăng hái tham gia hoạt động nhóm.\n• Lưu ý tuần tới: Bố mẹ nhắc con đọc sách 15 phút mỗi tối và mang đầy đủ đồ dùng học tập.${extraTxt}\n\nChúc các gia đình cuối tuần thật ấm áp và vui vẻ!`,
      kem: `Chào gia đình bé ${studentName} (Lớp ${className}) ạ,\n\nQua theo dõi vài tiết gần đây, ${xLow} thấy con rất ngoan nhưng còn hơi chậm ở phần kiến thức nền. Nếu được, ${xLow} và gia đình cùng phối hợp ôn nhẹ 10–15 phút mỗi tối để con bắt kịp và tự tin hơn.${extraTxt}\n\nKhi nào tiện, bố mẹ nhắn ${xLow} trao đổi thêm cách hỗ trợ phù hợp nhất cho bé nhé!`
    };
    return map[type] || map.khen;
  }

  const WORD_TEMPLATES = {
    khbd: () => buildLessonPlanHTML(LESSON_PRESETS.toan3),
    bienban: (className = "3A") => `
      <p style="text-align:center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>Độc lập – Tự do – Hạnh phúc</p>
      <h2 style="text-align:center;">BIÊN BẢN HỌP PHỤ HUYNH LỚP ${className}</h2>
      <p><strong>1. Thời gian:</strong> ... giờ ..., ngày ... tháng ... năm 20...</p>
      <p><strong>2. Địa điểm:</strong> Phòng học lớp ${className}</p>
      <p><strong>3. Thành phần:</strong> Giáo viên chủ nhiệm và ...... phụ huynh (Vắng: ......)</p>
      <p><strong>4. Nội dung trao đổi chính:</strong></p>
      <ul>
        <li>Đánh giá tình hình nề nếp, chuyên cần và kết quả học tập theo Thông tư 27.</li>
        <li>Thống nhất phương pháp phối hợp giữa gia đình và giáo viên (rèn tự học, hạn chế thiết bị điện tử).</li>
        <li>Ý kiến đóng góp của phụ huynh và kế hoạch hoạt động trải nghiệm sắp tới.</li>
      </ul>
      <p><strong>5. Kết luận &amp; Thống nhất:</strong> 100% phụ huynh nhất trí với kế hoạch giáo dục của lớp.</p>
      <table border="0" style="width:100%;margin-top:24px;border:none;">
        <tr><td style="border:none;text-align:center;"><strong>Thư kí cuộc họp</strong><br/><em>(Kí, ghi rõ họ tên)</em></td>
        <td style="border:none;text-align:center;"><strong>Giáo viên chủ nhiệm</strong><br/><em>(Kí, ghi rõ họ tên)</em></td></tr>
      </table>`,
    phieu: (className = "3A") => `
      <h2 style="text-align:center;">PHIẾU BÀI TẬP CUỐI TUẦN — LỚP ${className}</h2>
      <p><strong>Họ và tên:</strong> ..................................................... &nbsp;&nbsp; <strong>Lớp:</strong> ${className}</p>
      <p><strong>Phần I. Trắc nghiệm nhanh (Khoanh tròn chữ cái trước câu trả lời đúng)</strong></p>
      <p>Câu 1: Kết quả của phép tính 7 × 8 là: &nbsp; A. 49 &nbsp;&nbsp; B. 54 &nbsp;&nbsp; C. 56 &nbsp;&nbsp; D. 63</p>
      <p>Câu 2: Từ nào dưới đây chỉ hoạt động? &nbsp; A. Xinh đẹp &nbsp;&nbsp; B. Chăm chỉ &nbsp;&nbsp; C. Đọc sách &nbsp;&nbsp; D. Bàn học</p>
      <p><strong>Phần II. Tự luận &amp; Vận dụng</strong></p>
      <p>Bài 1: Đặt tính rồi tính: 348 + 275 &nbsp;&nbsp;|&nbsp;&nbsp; 620 − 184</p>
      <p>Bài 2: Em hãy viết 3–4 câu kể về một việc tốt em đã làm cùng gia đình cuối tuần này.</p>
      <p><em>Nhận xét của thầy/cô: ........................................................................................</em></p>`,
    giaykhen: (className = "3A") => `
      <div style="border:4px double #146c43;padding:28px;text-align:center;">
        <p style="letter-spacing:2px;font-weight:bold;color:#146c43;">TRƯỜNG TIỂU HỌC · LỚP ${className}</p>
        <h1 style="color:#b45309;margin:10px 0;">THƯ KHEN HỌC SINH</h1>
        <p>Thầy/Cô nhiệt liệt tuyên dương em:</p>
        <h2 style="margin:8px 0;">NGUYỄN MINH AN</h2>
        <p>Đã có thành tích <strong>tiến bộ vượt bậc trong học tập, chăm ngoan và tích cực giúp đỡ bạn bè</strong> tuần này.</p>
        <p style="margin-top:24px;"><em>Chúc em luôn giữ vững niềm vui đến trường mỗi ngày!</em></p>
        <p style="text-align:right;margin-top:24px;"><strong>Giáo viên chủ nhiệm</strong></p>
      </div>`,
    don: () => `
      <p style="text-align:center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>Độc lập – Tự do – Hạnh phúc</p>
      <h2 style="text-align:center;">ĐƠN XIN NGHỈ PHÉP</h2>
      <p><strong>Kính gửi:</strong> Ban Giám hiệu Trường Tiểu học ...............................</p>
      <p><strong>Tôi tên là:</strong> ....................................... — Giáo viên chủ nhiệm lớp: .........</p>
      <p>Nay tôi viết đơn này kính xin Ban Giám hiệu cho phép tôi nghỉ phép ngày ..../..../20.... vì lý do: .................................</p>
      <p>Tôi đã bàn giao kế hoạch dạy thay đầy đủ cho cô/thầy ........................ để đảm bảo không ảnh hưởng đến việc học của lớp.</p>
      <p>Kính mong Ban Giám hiệu xem xét chấp thuận. Tôi xin chân thành cảm ơn!</p>
      <p style="text-align:right;margin-top:24px;"><strong>Người làm đơn</strong><br/><em>(Kí, ghi rõ họ tên)</em></p>`
  };

  const SHEET_TEMPLATES = {
    fund: [
      ["STT", "Ngày", "Nội dung Thu / Chi quỹ lớp", "Thu (VNĐ)", "Chi (VNĐ)", "Ghi chú"],
      [1, "01/11", "Tồn quỹ đầu tháng", 1500000, 0, "Chuyển sang"],
      [2, "05/11", "In phiếu bài tập cuối tuần", 0, 120000, "40 bản"],
      [3, "10/11", "Mua sticker & phần thưởng khen", 0, 185000, "Khen học sinh"],
      [4, "15/11", "Phụ huynh ủng hộ quỹ trải nghiệm", 500000, 0, "Tự nguyện"],
      [5, "18/11", "Nước uống giờ sinh hoạt", 0, 95000, ""],
      ["", "", "TỔNG CỘNG", "=SUM(D2:D6)", "=SUM(E2:E6)", "=D7-E7"]
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
    SAMPLE_STUDENTS,
    SAMPLE_TODOS,
    LESSON_PRESETS,
    WORD_TEMPLATES,
    SHEET_TEMPLATES,
    getTT27Level,
    pickTT27Comment,
    buildLessonPlanHTML,
    buildSlidesFromLesson,
    buildParentMessage
  };
})();
