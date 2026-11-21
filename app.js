const STORE_KEY = "lop-nhe-v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseStudents(text) {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((full_name, i) => ({ id: `s${i + 1}`, full_name }));
}

function renderAttendance(students, attendance = {}) {
  const box = $("#attendanceBox");
  const list = $("#attendanceList");
  box.hidden = students.length === 0;
  list.innerHTML = students
    .map((s) => {
      const st = attendance[s.id] || "present";
      return `<div class="student-row">
        <span>${s.full_name}</span>
        <div class="status-group" data-id="${s.id}">
          <label><input type="radio" name="att-${s.id}" value="present" ${st === "present" ? "checked" : ""}/><span>Có mặt</span></label>
          <label><input type="radio" name="att-${s.id}" value="late" ${st === "late" ? "checked" : ""}/><span>Muộn</span></label>
          <label><input type="radio" name="att-${s.id}" value="absent" ${st === "absent" ? "checked" : ""}/><span>Vắng</span></label>
        </div>
      </div>`;
    })
    .join("");
}

function renderGrades(students, grades = {}) {
  const list = $("#gradeList");
  if (!students.length) {
    list.innerHTML = "<p>Hãy lưu danh sách lớp ở tab Điểm danh trước.</p>";
    return;
  }
  list.innerHTML = students
    .map(
      (s) => `<div class="student-row grade-row">
      <span>${s.full_name}</span>
      <input type="number" min="0" max="10" step="0.5" data-id="${s.id}" value="${grades[s.id] ?? ""}" placeholder="điểm" />
    </div>`
    )
    .join("");
}

function fillParentSelect(students) {
  const sel = $("#parentStudent");
  sel.innerHTML = students
    .map((s) => `<option value="${s.id}">${s.full_name}</option>`)
    .join("");
}

function hydrate() {
  const data = load();
  if (data.className) $("#className").value = data.className;
  if (data.students?.length) {
    $("#studentList").value = data.students.map((s) => s.full_name).join("\n");
    const att = data.attendance?.[today()] || {};
    renderAttendance(data.students, att);
    renderGrades(data.students, {});
    fillParentSelect(data.students);
  }
}

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    $$(".tab-panel").forEach((p) => {
      const on = p.dataset.panel === tab.dataset.tab;
      p.classList.toggle("active", on);
      p.hidden = !on;
    });
  });
});

$("#saveClass").addEventListener("click", () => {
  const className = $("#className").value.trim() || "Lớp";
  const students = parseStudents($("#studentList").value);
  if (!students.length) {
    alert("Nhập ít nhất một học sinh.");
    return;
  }
  const data = load();
  data.className = className;
  data.students = students;
  data.attendance = data.attendance || {};
  save(data);
  renderAttendance(students, data.attendance[today()] || {});
  renderGrades(students, {});
  fillParentSelect(students);
});

$("#saveAttendance").addEventListener("click", () => {
  const data = load();
  if (!data.students?.length) return;
  const day = today();
  const map = {};
  $$("#attendanceList .status-group").forEach((g) => {
    const checked = g.querySelector("input:checked");
    map[g.dataset.id] = checked ? checked.value : "present";
  });
  data.attendance = data.attendance || {};
  data.attendance[day] = map;
  save(data);
  alert(`Đã lưu điểm danh ${data.className} · ${day}`);
});

$("#saveGrades").addEventListener("click", () => {
  const data = load();
  if (!data.students?.length) {
    alert("Chưa có lớp.");
    return;
  }
  const subject = $("#subject").value;
  const assessment = $("#assessment").value.trim() || "Đánh giá";
  const scores = {};
  $$("#gradeList input[data-id]").forEach((inp) => {
    if (inp.value !== "") scores[inp.dataset.id] = Number(inp.value);
  });
  data.grades = data.grades || [];
  data.grades.push({ subject, assessment, scores, at: new Date().toISOString() });
  save(data);
  alert(`Đã lưu sổ điểm: ${subject} · ${assessment}`);
});

$("#genLesson").addEventListener("click", () => {
  const subject = $("#lpSubject").value.trim() || "Môn";
  const grade = $("#lpGrade").value.trim() || "?";
  const topic = $("#lpTopic").value.trim() || "Chủ đề";
  const text = `GIÁO ÁN ${subject.toUpperCase()} — LỚP ${grade}
Chủ đề: ${topic}

I. MỤC TIÊU
1. Kiến thức: Học sinh nêu / thực hiện được nội dung cốt lõi của bài "${topic}".
2. Năng lực: Quan sát, hợp tác nhóm, trình bày ngắn.
3. Phẩm chất: Chăm chỉ, tôn trọng bạn khi trao đổi.

II. ĐỒ DÙNG DẠY HỌC
- Giáo viên: bảng phụ / phiếu giao việc, đồ dùng trực quan.
- Học sinh: vở bài tập, bút màu.

III. CÁC HOẠT ĐỘNG
1. Khởi động (5 phút): Câu hỏi nối kiến thức cũ → "${topic}".
2. Khám phá (15 phút): Quan sát ví dụ → rút quy tắc / ý chính.
3. Luyện tập (12 phút): 2–3 bài mức độ nhận biết → vận dụng.
4. Vận dụng / trò chơi (5 phút): Tình huống gần đời sống lớp ${grade}.
5. Củng cố (3 phút): 3 câu hỏi nhanh + nhận xét.

IV. ĐIỀU CHỈNH / GHI CHÚ
- Học sinh yếu: kèm cặp câu hỏi gợi ý.
- Học sinh khá/giỏi: thêm bài vận dụng mở.

V. RÚT KINH NGHIỆM
(điền sau tiết dạy)`;

  const out = $("#lessonOut");
  out.hidden = false;
  out.textContent = text;
  $("#copyLesson").hidden = false;

  const data = load();
  data.lessonPlans = data.lessonPlans || [];
  data.lessonPlans.push({ subject, grade, topic, text, at: new Date().toISOString() });
  save(data);
});

$("#copyLesson").addEventListener("click", async () => {
  const text = $("#lessonOut").textContent;
  await navigator.clipboard.writeText(text);
  alert("Đã sao chép giáo án.");
});

const NOTE_TEMPLATES = {
  khen: (name, cls) =>
    `Kính gửi phụ huynh em ${name},\nHôm nay em có tiến bộ rõ trên lớp ${cls}. Cô/thầy rất vui và mong gia đình tiếp tục động viên em ở nhà.\nTrân trọng.`,
  nhac: (name, cls) =>
    `Kính gửi phụ huynh em ${name},\nNhờ quý phụ huynh nhắc em mang đủ đồ dùng / hoàn thành bài về nhà cho lớp ${cls} ngày mai.\nXin cảm ơn.`,
  vang: (name, cls) =>
    `Kính gửi phụ huynh em ${name},\nHôm nay em vắng mặt ở lớp ${cls}. Khi em khỏe, nhờ phụ huynh báo lại để cô/thầy hỗ trợ bài học bù.\nTrân trọng.`,
  hop: (name, cls) =>
    `Kính gửi phụ huynh em ${name},\nNhà trường / lớp ${cls} kính mời quý phụ huynh họp vào [giờ · ngày · địa điểm]. Mong quý phụ huynh sắp xếp tham dự.\nTrân trọng.`,
};

$("#genNote").addEventListener("click", () => {
  const data = load();
  const id = $("#parentStudent").value;
  const student = data.students?.find((s) => s.id === id);
  if (!student) {
    alert("Chưa có học sinh.");
    return;
  }
  const type = $("#noteType").value;
  const msg = NOTE_TEMPLATES[type](student.full_name, data.className || "lớp");
  $("#noteOut").value = msg;
});

$("#copyNote").addEventListener("click", async () => {
  const text = $("#noteOut").value;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  alert("Đã sao chép tin nhắn phụ huynh.");
});

hydrate();
