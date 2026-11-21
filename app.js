/* Lớp Nhẹ Pro — Core App Engine */
(() => {
  const STORE_KEY = "lop-nhe-pro-v2";
  const LEGACY_KEY = "lop-nhe-v1";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const VIEW_META = {
    dashboard: ["Tổng quan lớp học", "Thống kê nhanh hôm nay · truy cập 1 chạm"],
    attendance: ["Lớp & Điểm danh", "Quản lý nhiều lớp, điểm danh 1 chạm, nhập/xuất Excel"],
    grades: ["Sổ điểm & Nhận xét TT27", "Tự phân mức T / H / C và gợi ý nhận xét học bạ"],
    lesson: ["Soạn Giáo án CV 2345", "Khung 4 hoạt động chuẩn — mở thẳng sang Word & Slide"],
    parent: ["Nhắn Phụ huynh VIP", "Mẫu tin nhắn sư phạm, cá nhân hóa tên bé, dán Zalo ngay"],
    office: ["Bộ Office Văn Phòng VIP", "Soạn thảo Word · Bảng tính Excel công thức · Trình chiếu PowerPoint"]
  };

  let state = {
    theme: "light",
    activeClassId: "c1",
    classes: {},
    todos: []
  };

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    $("#toastStack").appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function createSampleClass() {
    const students = window.LopNheData.SAMPLE_STUDENTS.map((name, i) => ({ id: `s${i + 1}`, name }));
    const att = {};
    students.forEach((s, i) => (att[s.id] = i === 6 ? "late" : "present"));
    const sampleScores = [9.5, 9, 8, 8.5, 7, 9.5, 6.5, 8.5, 7.5, 10];
    const records = {};
    students.forEach((s, i) => {
      const score = sampleScores[i];
      const level = window.LopNheData.getTT27Level(score);
      records[s.id] = { score, level, comment: window.LopNheData.pickTT27Comment("Toán", level, i) };
    });
    return {
      id: "c1",
      name: "3A",
      students,
      attendance: { [today()]: att },
      grades: [{ id: "g1", subject: "Toán", assessment: "Kiểm tra giữa kì I", records, at: new Date().toISOString() }]
    };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (raw && raw.classes && Object.keys(raw.classes).length) {
        state = raw;
        return;
      }
      // Migrate from v1 if present
      const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
      if (old?.students?.length) {
        state.classes = {
          c1: {
            id: "c1",
            name: old.className || "3A",
            students: old.students.map((s, i) => ({ id: s.id || `s${i + 1}`, name: s.full_name || s.name })),
            attendance: old.attendance || {},
            grades: []
          }
        };
        state.activeClassId = "c1";
        state.todos = JSON.parse(JSON.stringify(window.LopNheData.SAMPLE_TODOS));
        save();
        return;
      }
    } catch {}

    // Default VIP sample so first impression is rich and ready
    state.classes = { c1: createSampleClass() };
    state.activeClassId = "c1";
    state.todos = JSON.parse(JSON.stringify(window.LopNheData.SAMPLE_TODOS));
    save();
  }

  function getActiveClass() {
    return state.classes[state.activeClassId] || Object.values(state.classes)[0];
  }

  /* ===================== NAVIGATION ===================== */
  function showView(view) {
    $$(".nav-item").forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach((v) => {
      const on = v.dataset.panel === view;
      v.classList.toggle("active", on);
      v.hidden = !on;
    });
    const [t, sub] = VIEW_META[view] || VIEW_META.dashboard;
    $("#pageTitle").textContent = t;
    $("#pageSub").textContent = sub;
    $("#sidebar").classList.remove("open");
  }

  /* ===================== CLASS PICKER & KPI ===================== */
  function renderClassPicker() {
    const sel = $("#activeClassSelect");
    sel.innerHTML = Object.values(state.classes)
      .map((c) => `<option value="${esc(c.id)}" ${c.id === state.activeClassId ? "selected" : ""}>Lớp ${esc(c.name)} (${c.students.length} HS)</option>`)
      .join("");
  }

  function renderDashboard() {
    const cls = getActiveClass();
    const total = cls.students.length;
    $("#kpiStudents").textContent = total;
    $("#kpiClassName").textContent = `Lớp ${cls.name}`;

    const att = cls.attendance?.[today()] || {};
    const attKeys = Object.keys(att);
    if (attKeys.length) {
      const present = Object.values(att).filter((v) => v === "present" || v === "late").length;
      const absent = total - present;
      $("#kpiPresent").textContent = `${present}/${total}`;
      $("#kpiAbsentNote").textContent = absent > 0 ? `Vắng ${absent} em hôm nay` : "Đi học đầy đủ 100%";
    } else {
      $("#kpiPresent").textContent = "—";
      $("#kpiAbsentNote").textContent = "Chưa điểm danh hôm nay";
    }

    const lastGrade = cls.grades?.[cls.grades.length - 1];
    if (lastGrade) {
      const scores = Object.values(lastGrade.records || {})
        .map((r) => Number(r.score))
        .filter((n) => !isNaN(n) && n > 0);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
      $("#kpiAvg").textContent = avg;
      $("#kpiGradeNote").textContent = `${lastGrade.subject} · ${lastGrade.assessment}`;
    } else {
      $("#kpiAvg").textContent = "—";
      $("#kpiGradeNote").textContent = "Chưa có đợt kiểm tra";
    }

    // Todos
    $("#todoList").innerHTML = state.todos.length
      ? state.todos
          .map(
            (t) => `<li class="todo-item ${t.done ? "done" : ""}" data-tid="${esc(t.id)}">
              <input type="checkbox" ${t.done ? "checked" : ""} />
              <span>${esc(t.text)}</span>
              <button type="button" data-del="${esc(t.id)}" title="Xóa">✕</button>
            </li>`
          )
          .join("")
      : `<li class="hint-line">Chưa có việc nào. Thêm việc cần làm ở trên!</li>`;
  }

  /* ===================== ATTENDANCE ===================== */
  function renderAttendance() {
    const cls = getActiveClass();
    $("#classNameInput").value = cls.name;
    $("#studentTextarea").value = cls.students.map((s) => s.name).join("\n");

    const day = $("#attDate").value || today();
    const att = cls.attendance?.[day] || {};

    let p = 0, l = 0, ex = 0, ab = 0;
    cls.students.forEach((s) => {
      const st = att[s.id] || "present";
      if (st === "present") p++;
      else if (st === "late") l++;
      else if (st === "excused") ex++;
      else ab++;
    });

    $("#attSummary").innerHTML = `
      <span class="pill-stat">Có mặt: ${p}</span>
      <span class="pill-stat">Muộn: ${l}</span>
      <span class="pill-stat">Vắng phép: ${ex}</span>
      <span class="pill-stat">Vắng KP: ${ab}</span>
    `;

    $("#attendanceList").innerHTML = cls.students.length
      ? cls.students
          .map((s, i) => {
            const st = att[s.id] || "present";
            return `<div class="student-row">
              <div><span class="student-idx">${i + 1}</span><span class="student-name">${esc(s.name)}</span></div>
              <div class="status-pills" data-sid="${esc(s.id)}">
                <label><input type="radio" name="att-${esc(s.id)}" value="present" ${st === "present" ? "checked" : ""}/><span>Có mặt</span></label>
                <label><input type="radio" name="att-${esc(s.id)}" value="late" ${st === "late" ? "checked" : ""}/><span>Muộn</span></label>
                <label><input type="radio" name="att-${esc(s.id)}" value="excused" ${st === "excused" ? "checked" : ""}/><span>Phép</span></label>
                <label><input type="radio" name="att-${esc(s.id)}" value="absent" ${st === "absent" ? "checked" : ""}/><span>Vắng</span></label>
              </div>
            </div>`;
          })
          .join("")
      : `<p class="hint-line">Chưa có học sinh. Nhập danh sách bên phải rồi bấm Lưu.</p>`;
  }

  /* ===================== GRADES TT27 ===================== */
  function computeGradeStats() {
    const rows = $$("#gradeTableBody tr[data-sid]");
    let sum = 0, cnt = 0, t = 0, h = 0, c = 0;
    rows.forEach((tr) => {
      const sc = tr.querySelector(".g-score").value;
      const lv = tr.querySelector(".g-level").value;
      if (sc !== "" && !isNaN(Number(sc))) {
        sum += Number(sc);
        cnt++;
      }
      if (lv === "T") t++;
      else if (lv === "H") h++;
      else if (lv === "C") c++;
    });
    $("#gradeStatsStrip").textContent = cnt
      ? `TB: ${(sum / cnt).toFixed(2)} · T: ${t} · H: ${h} · C: ${c}`
      : `T: ${t} · H: ${h} · C: ${c}`;
  }

  function renderGrades(loadRecord) {
    const cls = getActiveClass();
    const rec = loadRecord || cls.grades?.[cls.grades.length - 1];
    if (rec && loadRecord) {
      $("#gradeSubject").value = rec.subject;
      $("#gradeAssessment").value = rec.assessment;
    }
    const map = rec?.records || {};

    $("#gradeTableBody").innerHTML = cls.students
      .map((s, i) => {
        const r = map[s.id] || {};
        return `<tr data-sid="${esc(s.id)}">
          <td>${i + 1}</td>
          <td><strong>${esc(s.name)}</strong></td>
          <td><input type="number" class="g-score" min="0" max="10" step="0.5" value="${r.score ?? ""}" placeholder="0–10" /></td>
          <td>
            <select class="g-level">
              <option value="" ${!r.level ? "selected" : ""}>—</option>
              <option value="T" ${r.level === "T" ? "selected" : ""}>T (Tốt)</option>
              <option value="H" ${r.level === "H" ? "selected" : ""}>H (Đạt)</option>
              <option value="C" ${r.level === "C" ? "selected" : ""}>C (Chưa)</option>
            </select>
          </td>
          <td><input type="text" class="g-comment" value="${esc(r.comment || "")}" placeholder="Nhận xét học bạ..." /></td>
        </tr>`;
      })
      .join("");

    computeGradeStats();

    $("#gradeHistoryList").innerHTML = cls.grades?.length
      ? cls.grades
          .slice()
          .reverse()
          .map(
            (g) => `<div class="history-item">
              <div><strong>${esc(g.subject)}</strong> · ${esc(g.assessment)} <span class="hint-line">(${new Date(g.at).toLocaleDateString("vi-VN")})</span></div>
              <button type="button" class="btn btn-soft btn-sm" data-open-grade="${esc(g.id)}">Mở lại</button>
            </div>`
          )
          .join("")
      : `<p class="hint-line">Chưa lưu đợt kiểm tra nào.</p>`;
  }

  function collectCurrentGrades() {
    const records = {};
    $$("#gradeTableBody tr[data-sid]").forEach((tr) => {
      const id = tr.dataset.sid;
      const sc = tr.querySelector(".g-score").value;
      records[id] = {
        score: sc === "" ? "" : Number(sc),
        level: tr.querySelector(".g-level").value,
        comment: tr.querySelector(".g-comment").value.trim()
      };
    });
    return records;
  }

  /* ===================== PARENT SELECT ===================== */
  function renderParentSelect() {
    const cls = getActiveClass();
    $("#parentStudent").innerHTML = cls.students
      .map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`)
      .join("");
  }

  function renderAll() {
    renderClassPicker();
    renderDashboard();
    renderAttendance();
    renderGrades();
    renderParentSelect();
  }

  /* ===================== LESSON 2345 ===================== */
  let lastLessonHtml = "";
  function generateLesson() {
    const cfg = {
      book: $("#lpBook").value,
      grade: $("#lpGrade").value,
      subject: $("#lpSubject").value,
      duration: $("#lpDuration").value,
      topic: $("#lpTopic").value.trim() || "Chủ đề bài học",
      focus: $("#lpFocus").value.trim()
    };
    lastLessonHtml = window.LopNheData.buildLessonPlanHTML(cfg);
    $("#lessonPreview").innerHTML = lastLessonHtml;
    return cfg;
  }

  /* ===================== GLOBAL EXPORT / IMPORT ===================== */
  function exportFullClassExcel() {
    const cls = getActiveClass();
    if (!window.XLSX) {
      toast("Đang tải thư viện Excel — thử lại sau giây lát");
      return;
    }
    const wb = window.XLSX.utils.book_new();
    // Sheet 1: Roster & latest grades
    const lastG = cls.grades?.[cls.grades.length - 1];
    const s1 = [["STT", "Họ và tên", "Điểm gần nhất", "Mức TT27", "Nhận xét"]];
    cls.students.forEach((s, i) => {
      const r = lastG?.records?.[s.id] || {};
      s1.push([i + 1, s.name, r.score ?? "", r.level ?? "", r.comment ?? ""]);
    });
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(s1), "SoDiem_TT27");

    // Sheet 2: Attendance
    const days = Object.keys(cls.attendance || {}).sort();
    const labels = { present: "Có mặt", late: "Muộn", excused: "Phép", absent: "Vắng" };
    const s2 = [["STT", "Họ và tên", ...days]];
    cls.students.forEach((s, i) => {
      s2.push([i + 1, s.name, ...days.map((d) => labels[cls.attendance[d]?.[s.id]] || "")]);
    });
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(s2), "DiemDanh");

    window.XLSX.writeFile(wb, `So-Lop-${cls.name}-${today()}.xlsx`);
    toast(`Đã xuất sổ lớp ${cls.name} (.xlsx)`);
  }

  function exportBackupJson() {
    const bundle = {
      app: "lop-nhe-pro",
      exportedAt: new Date().toISOString(),
      state,
      office: window.OfficeSuite.getState()
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LopNhe-Backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Đã tải file sao lưu (.json)");
  }

  async function importStudentListFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    let names = [];
    if ((ext === "xlsx" || ext === "xls") && window.XLSX) {
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
      rows.forEach((r) => {
        const candidate = r.find((cell) => typeof cell === "string" && cell.trim().length > 2 && !/^(stt|họ|tên|ho ten)/i.test(cell.trim()));
        if (candidate) names.push(candidate.trim());
      });
    } else {
      const txt = await file.text();
      names = txt
        .split(/\r?\n/)
        .map((l) => l.split(/[,;\t]/).find((c) => c.trim().length > 2 && !/^(stt|họ|tên|\d+)$/i.test(c.trim())))
        .filter(Boolean)
        .map((s) => s.replace(/^"|"$/g, "").trim());
    }
    if (!names.length) return toast("Không tìm thấy tên học sinh trong file");
    $("#studentTextarea").value = names.join("\n");
    toast(`Đã đọc ${names.length} học sinh — bấm "Lưu danh sách lớp" để áp dụng`);
  }

  async function handleGlobalUpload(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") {
      try {
        const parsed = JSON.parse(await file.text());
        if (parsed.app === "lop-nhe-pro" && parsed.state) {
          state = parsed.state;
          save();
          if (parsed.office) window.OfficeSuite.setState(parsed.office);
          renderAll();
          toast("Đã khôi phục toàn bộ dữ liệu Lớp Nhẹ Pro!");
          return;
        }
        if (Array.isArray(parsed)) {
          showView("office");
          window.OfficeSuite.loadSlides(parsed, file.name.replace(/\.json$/i, ""));
          toast("Đã mở bộ Slide từ file .json");
          return;
        }
      } catch {}
      toast("File .json không đúng định dạng Lớp Nhẹ");
      return;
    }
    if (["docx", "html", "htm", "md", "txt"].includes(ext)) {
      showView("office");
      await window.OfficeSuite.importWordFile(file);
      return;
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      showView("office");
      await window.OfficeSuite.importSheetFile(file);
      return;
    }
    toast("Định dạng file chưa hỗ trợ");
  }

  /* ===================== WIRE EVENTS ===================== */
  function initEvents() {
    // Sidebar nav
    $$(".nav-item").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
    $("#openSidebar").addEventListener("click", () => $("#sidebar").classList.add("open"));
    $("#closeSidebar").addEventListener("click", () => $("#sidebar").classList.remove("open"));

    // Dashboard jumps
    $$("[data-jump]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.jump)));
    $$("[data-jump-office]").forEach((b) =>
      b.addEventListener("click", () => {
        showView("office");
        window.OfficeSuite.switchTab(b.dataset.jumpOffice);
      })
    );

    // Theme
    if (state.theme === "dark") document.body.classList.add("dark");
    $("#btnThemeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      state.theme = document.body.classList.contains("dark") ? "dark" : "light";
      save();
    });

    // Class switcher
    $("#activeClassSelect").addEventListener("change", (e) => {
      state.activeClassId = e.target.value;
      save();
      renderAll();
    });

    $("#btnAddClassQuick").addEventListener("click", () => {
      const name = prompt("Nhập tên lớp mới (VD: 4B, 5A):");
      if (!name || !name.trim()) return;
      const id = `c${Date.now()}`;
      state.classes[id] = { id, name: name.trim(), students: [], attendance: {}, grades: [] };
      state.activeClassId = id;
      save();
      renderAll();
      showView("attendance");
      toast(`Đã tạo lớp ${name.trim()}`);
    });

    $("#btnLoadSample").addEventListener("click", () => {
      state.classes.c1 = createSampleClass();
      state.activeClassId = "c1";
      state.todos = JSON.parse(JSON.stringify(window.LopNheData.SAMPLE_TODOS));
      save();
      renderAll();
      toast("Đã nạp dữ liệu mẫu Lớp 3A");
    });

    // Global Upload / Download
    $("#btnGlobalUpload").addEventListener("click", () => $("#globalFileInput").click());
    $("#globalFileInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) handleGlobalUpload(e.target.files[0]);
      e.target.value = "";
    });

    const dlMenu = $("#downloadMenu");
    $("#btnGlobalDownload").addEventListener("click", (e) => {
      e.stopPropagation();
      dlMenu.hidden = !dlMenu.hidden;
    });
    document.addEventListener("click", () => (dlMenu.hidden = true));
    dlMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dl]");
      if (!btn) return;
      dlMenu.hidden = true;
      const act = btn.dataset.dl;
      if (act === "excel-all") exportFullClassExcel();
      else if (act === "backup-json") exportBackupJson();
      else if (act === "office-word") window.OfficeSuite.exportWordDoc();
      else if (act === "office-sheet") window.OfficeSuite.exportSheetXlsx();
      else if (act === "office-slides") window.OfficeSuite.exportSlidesPptx();
    });

    // Todos
    $("#todoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#todoInput").value.trim();
      if (!text) return;
      state.todos.unshift({ id: `t${Date.now()}`, text, done: false });
      $("#todoInput").value = "";
      save();
      renderDashboard();
    });
    $("#todoList").addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]");
      if (del) {
        state.todos = state.todos.filter((t) => t.id !== del.dataset.del);
        save();
        renderDashboard();
        return;
      }
      const li = e.target.closest(".todo-item");
      if (li && e.target.type === "checkbox") {
        const item = state.todos.find((t) => t.id === li.dataset.tid);
        if (item) item.done = e.target.checked;
        save();
        renderDashboard();
      }
    });
    $("#btnClearDone").addEventListener("click", () => {
      state.todos = state.todos.filter((t) => !t.done);
      save();
      renderDashboard();
    });

    // Attendance
    $("#attDate").value = today();
    $("#attDate").addEventListener("change", renderAttendance);
    $("#btnAllPresent").addEventListener("click", () => {
      $$("#attendanceList input[value='present']").forEach((r) => (r.checked = true));
      toast("Đã đánh dấu tất cả Có mặt — bấm Lưu điểm danh");
    });
    $("#btnSaveAtt").addEventListener("click", () => {
      const cls = getActiveClass();
      const day = $("#attDate").value || today();
      const map = {};
      $$("#attendanceList .status-pills").forEach((g) => {
        const ch = g.querySelector("input:checked");
        map[g.dataset.sid] = ch ? ch.value : "present";
      });
      cls.attendance = cls.attendance || {};
      cls.attendance[day] = map;
      save();
      renderAttendance();
      renderDashboard();
      toast(`Đã lưu điểm danh lớp ${cls.name} (${day})`);
    });
    $("#btnExportAttCsv").addEventListener("click", () => {
      const cls = getActiveClass();
      const day = $("#attDate").value || today();
      const att = cls.attendance?.[day] || {};
      const labels = { present: "Có mặt", late: "Muộn", excused: "Vắng phép", absent: "Vắng KP" };
      const rows = [["STT", "Họ và tên", `Điểm danh ${day}`]];
      cls.students.forEach((s, i) => rows.push([i + 1, s.name, labels[att[s.id] || "present"]]));
      const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
      a.download = `DiemDanh-${cls.name}-${day}.csv`;
      a.click();
      toast("Đã xuất điểm danh (.csv)");
    });

    $("#btnImportStudents").addEventListener("click", () => $("#studentFileInput").click());
    $("#studentFileInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) importStudentListFile(e.target.files[0]);
      e.target.value = "";
    });
    $("#btnSaveClass").addEventListener("click", () => {
      const cls = getActiveClass();
      const lines = $("#studentTextarea").value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!lines.length) return toast("Nhập ít nhất 1 học sinh");
      cls.name = $("#classNameInput").value.trim() || cls.name;
      cls.students = lines.map((name, i) => ({ id: cls.students[i]?.id || `s${i + 1}`, name }));
      save();
      renderAll();
      toast(`Đã lưu lớp ${cls.name} (${lines.length} HS)`);
    });
    $("#btnSendClassToSheet").addEventListener("click", () => {
      const cls = getActiveClass();
      const aoa = [["STT", "Họ và tên", "Lớp", "Ghi chú"]];
      cls.students.forEach((s, i) => aoa.push([i + 1, s.name, cls.name, ""]));
      showView("office");
      window.OfficeSuite.loadSheetData(aoa, `Danh-sach-${cls.name}`);
      toast("Đã mở danh sách lớp trong Excel Office");
    });

    // Grades TT27
    $("#gradeTableBody").addEventListener("input", (e) => {
      const tr = e.target.closest("tr[data-sid]");
      if (!tr) return;
      if (e.target.classList.contains("g-score")) {
        const lv = window.LopNheData.getTT27Level(e.target.value);
        if (lv) tr.querySelector(".g-level").value = lv;
      }
      computeGradeStats();
    });

    $("#btnAutoComment").addEventListener("click", () => {
      const subj = $("#gradeSubject").value;
      $$("#gradeTableBody tr[data-sid]").forEach((tr, idx) => {
        const sc = tr.querySelector(".g-score").value;
        const lvSel = tr.querySelector(".g-level");
        const lv = lvSel.value || window.LopNheData.getTT27Level(sc) || "H";
        lvSel.value = lv;
        tr.querySelector(".g-comment").value = window.LopNheData.pickTT27Comment(subj, lv, idx);
      });
      computeGradeStats();
      toast("Đã tự điền nhận xét chuẩn Thông tư 27 cho cả lớp");
    });

    $("#btnSaveGrades").addEventListener("click", () => {
      const cls = getActiveClass();
      const entry = {
        id: `g${Date.now()}`,
        subject: $("#gradeSubject").value,
        assessment: $("#gradeAssessment").value.trim() || "Đánh giá định kì",
        records: collectCurrentGrades(),
        at: new Date().toISOString()
      };
      cls.grades = cls.grades || [];
      cls.grades.push(entry);
      save();
      renderGrades();
      renderDashboard();
      toast(`Đã lưu sổ điểm ${entry.subject}`);
    });

    $("#btnSendGradesToSheet").addEventListener("click", () => {
      const cls = getActiveClass();
      const cur = collectCurrentGrades();
      const subj = $("#gradeSubject").value;
      const aoa = [["STT", "Họ và tên", `Điểm ${subj}`, "Mức TT27", "Nhận xét học bạ"]];
      cls.students.forEach((s, i) => {
        const r = cur[s.id] || {};
        aoa.push([i + 1, s.name, r.score ?? "", r.level ?? "", r.comment ?? ""]);
      });
      aoa.push(["", "Điểm TB lớp", `=AVERAGE(C2:C${cls.students.length + 1})`, "", ""]);
      showView("office");
      window.OfficeSuite.loadSheetData(aoa, `So-diem-${subj}-${cls.name}`);
      toast("Đã đưa sổ điểm sang Bảng tính Excel");
    });

    $("#btnExportGradesXlsx").addEventListener("click", exportFullClassExcel);

    $("#gradeHistoryList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-open-grade]");
      if (!b) return;
      const rec = getActiveClass().grades.find((g) => g.id === b.dataset.openGrade);
      if (rec) {
        renderGrades(rec);
        toast(`Đã mở lại: ${rec.subject} · ${rec.assessment}`);
      }
    });

    // Lesson Plan 2345
    $("#btnGenLesson").addEventListener("click", () => {
      generateLesson();
      toast("Đã tạo Kế hoạch bài dạy chuẩn 2345");
    });
    $$("[data-lp-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = window.LopNheData.LESSON_PRESETS[b.dataset.lpPreset];
        if (!p) return;
        $("#lpBook").value = p.book;
        $("#lpGrade").value = p.grade;
        $("#lpSubject").value = p.subject;
        $("#lpDuration").value = p.duration;
        $("#lpTopic").value = p.topic;
        $("#lpFocus").value = p.focus;
        generateLesson();
      })
    );
    $("#btnCopyLesson").addEventListener("click", () => {
      navigator.clipboard?.writeText($("#lessonPreview").innerText || "");
      toast("Đã sao chép giáo án");
    });
    $("#btnDownloadLessonDoc").addEventListener("click", () => {
      if (!lastLessonHtml) generateLesson();
      window.OfficeSuite.exportWordDoc(lastLessonHtml, `KHBD-${$("#lpSubject").value}-Lop${$("#lpGrade").value}.doc`);
    });
    $("#btnLessonToWord").addEventListener("click", () => {
      if (!lastLessonHtml) generateLesson();
      showView("office");
      window.OfficeSuite.openInWord(lastLessonHtml, `KHBD-${$("#lpSubject").value}-Lop${$("#lpGrade").value}`);
      toast("Đã mở giáo án trong Office Word để chỉnh sửa");
    });
    $("#btnLessonToSlides").addEventListener("click", () => {
      const cfg = generateLesson();
      const slides = window.LopNheData.buildSlidesFromLesson(cfg);
      showView("office");
      window.OfficeSuite.loadSlides(slides, `Slide-${cfg.subject}-Lop${cfg.grade}`);
      toast("Đã tự động tạo bộ 5 Slide bài giảng!");
    });

    // Parent notes
    const runParentGen = () => {
      const cls = getActiveClass();
      $("#noteOut").value = window.LopNheData.buildParentMessage({
        studentName: $("#parentStudent").value || "con",
        className: cls.name,
        role: $("#teacherRole").value,
        type: $("#noteType").value,
        extra: $("#noteExtra").value.trim()
      });
    };
    $("#btnGenNote").addEventListener("click", () => {
      runParentGen();
      toast("Đã tạo tin nhắn phụ huynh");
    });
    $("#btnCopyNote").addEventListener("click", () => {
      if (!$("#noteOut").value) runParentGen();
      navigator.clipboard?.writeText($("#noteOut").value);
      toast("Đã sao chép — dán ngay vào Zalo!");
    });
    $("#btnDownloadNotes").addEventListener("click", () => {
      if (!$("#noteOut").value) runParentGen();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff", $("#noteOut").value], { type: "text/plain;charset=utf-8" }));
      a.download = `Tin-nhan-PH-${$("#parentStudent").value || "lop"}.txt`;
      a.click();
      toast("Đã tải file tin nhắn (.txt)");
    });
  }

  /* ===================== BOOT ===================== */
  load();
  window.OfficeSuite.init({
    notify: toast,
    getClassContext: () => getActiveClass()
  });
  initEvents();
  renderAll();
  generateLesson();
})();
