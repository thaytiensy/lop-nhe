/* Trợ lý GVCN — Core App Engine (Linh hoạt · Đồng bộ Thông tin Trường/Lớp · Lưu tự động) */
(() => {
  const STORE_KEY = "tro-ly-gvcn-v3";
  const PREV_KEY = "lop-nhe-pro-v2";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const VIEW_TITLES = {
    dashboard: "Tổng quan lớp chủ nhiệm",
    profile: "Thông tin chung Trường · Lớp · GVCN",
    attendance: "Học sinh & Điểm danh",
    grades: "Sổ điểm & Nhận xét TT27",
    lesson: "Soạn Giáo án CV 2345",
    parent: "Nhắn Phụ huynh",
    office: "Bộ Office Văn phòng"
  };

  let state = {
    theme: "light",
    profile: { ...window.GvcnData.DEFAULT_PROFILE },
    subjects: [...window.GvcnData.DEFAULT_SUBJECTS],
    activeClassId: "c1",
    classes: {},
    todos: []
  };

  let commentCycleMap = {};

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
    setTimeout(() => el.remove(), 2700);
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function createSampleClass() {
    const students = window.GvcnData.SAMPLE_STUDENTS.map((s, i) => ({
      id: `s${i + 1}`,
      name: s.name,
      parent: s.parent,
      phone: s.phone,
      note: ""
    }));
    const att = {};
    students.forEach((s, i) => (att[s.id] = { status: i === 6 ? "late" : "present", note: i === 6 ? "Trời mưa kẹt xe" : "" }));
    const sampleScores = [9.5, 9, 8, 8.5, 7, 9.5, 6.5, 8.5, 7.5, 10];
    const records = {};
    students.forEach((s, i) => {
      const score = sampleScores[i];
      const level = window.GvcnData.getTT27Level(score);
      records[s.id] = { score, level, comment: window.GvcnData.pickTT27Comment("Toán", level, i) };
    });
    return {
      id: "c1",
      name: "3A",
      room: "Phòng 201",
      students,
      attendance: { [today()]: att },
      grades: [{ id: "g1", subject: "Toán", assessment: "Kiểm tra giữa kì I", records, at: new Date().toISOString() }]
    };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (raw && raw.classes && Object.keys(raw.classes).length) {
        state = {
          ...state,
          ...raw,
          profile: { ...window.GvcnData.DEFAULT_PROFILE, ...(raw.profile || {}) },
          subjects: raw.subjects?.length ? raw.subjects : [...window.GvcnData.DEFAULT_SUBJECTS]
        };
        return;
      }
      // Migrate from v2 if present
      const prev = JSON.parse(localStorage.getItem(PREV_KEY) || "null");
      if (prev && prev.classes && Object.keys(prev.classes).length) {
        state.theme = prev.theme || "light";
        state.activeClassId = prev.activeClassId || Object.keys(prev.classes)[0];
        state.classes = prev.classes;
        state.todos = prev.todos || JSON.parse(JSON.stringify(window.GvcnData.SAMPLE_TODOS));
        save();
        return;
      }
    } catch {}

    state.classes = { c1: createSampleClass() };
    state.activeClassId = "c1";
    state.todos = JSON.parse(JSON.stringify(window.GvcnData.SAMPLE_TODOS));
    save();
  }

  function getActiveClass() {
    return state.classes[state.activeClassId] || Object.values(state.classes)[0];
  }

  function getAttEntry(attMap, sid) {
    const raw = attMap?.[sid];
    if (!raw) return { status: "present", note: "" };
    if (typeof raw === "string") return { status: raw, note: "" };
    return { status: raw.status || "present", note: raw.note || "" };
  }

  /* ===================== NAVIGATION ===================== */
  function showView(view, officeTab) {
    $$(".nav-item").forEach((b) => {
      const isOfficeMatch = view === "office" && officeTab ? b.dataset.officeJump === officeTab : (!b.dataset.officeJump && b.dataset.view === view);
      b.classList.toggle("active", isOfficeMatch);
      b.setAttribute("aria-selected", isOfficeMatch ? "true" : "false");
    });
    $$(".view").forEach((v) => {
      const on = v.dataset.panel === view;
      v.classList.toggle("active", on);
      v.hidden = !on;
    });
    $("#pageTitle").textContent = VIEW_TITLES[view] || "Trợ lý GVCN";
    if (view === "office" && officeTab) window.OfficeSuite.switchTab(officeTab);
    $("#sidebar").classList.remove("open");
    $("#sidebarBackdrop").hidden = true;
  }

  /* ===================== PROFILE & HEADER SYNC ===================== */
  function renderProfileUI() {
    const p = state.profile;
    const cls = getActiveClass();
    $("#sidebarSchoolSub").textContent = `${p.school} · ${p.schoolYear}`;
    $("#topbarProfileText").textContent = `${p.school} · Lớp ${cls.name} · ${p.teacherRole} ${p.teacherName}`;
    $("#heroDept").textContent = `${p.department} · NĂM HỌC ${p.schoolYear} · ${p.semester.toUpperCase()}`;
    $("#heroSchool").textContent = `${p.school} — Lớp ${cls.name}`;
    $("#heroTeacher").textContent = `GVCN: ${p.teacherRole} ${p.teacherName}${p.teacherPhone ? ` (${p.teacherPhone})` : ""} · Sách: ${p.bookSeries}`;

    // Fill profile form
    $("#profDept").value = p.department || "";
    $("#profSchool").value = p.school || "";
    $("#profYear").value = p.schoolYear || "";
    $("#profSemester").value = p.semester || "Học kì I";
    $("#profBook").value = p.bookSeries || "Kết nối tri thức với cuộc sống";
    $("#profTeacher").value = p.teacherName || "";
    $("#profRole").value = p.teacherRole || "Cô";
    $("#profPhone").value = p.teacherPhone || "";
    $("#profGroup").value = p.group || "";
    $("#profSlogan").value = p.slogan || "";

    // Sync default book in lesson tab
    if ($("#lpBook")) $("#lpBook").value = p.bookSeries;

    // Class manager list
    $("#classManagerList").innerHTML = Object.values(state.classes)
      .map(
        (c) => `<div class="class-item-card ${c.id === state.activeClassId ? "current" : ""}">
          <div>
            <strong>Lớp ${esc(c.name)}</strong> ${c.room ? `<span class="class-item-meta">· ${esc(c.room)}</span>` : ""}
            <div class="class-item-meta">${c.students.length} học sinh · ${c.grades?.length || 0} đợt điểm</div>
          </div>
          <div class="btn-group">
            ${c.id !== state.activeClassId ? `<button type="button" class="btn-xs" data-sel-cls="${esc(c.id)}">Chọn</button>` : `<span class="tag">Đang mở</span>`}
            <button type="button" class="btn-xs" data-ren-cls="${esc(c.id)}">Sửa</button>
            <button type="button" class="btn-xs danger-txt" data-del-cls="${esc(c.id)}">Xóa</button>
          </div>
        </div>`
      )
      .join("");

    window.OfficeSuite?.refreshFooter?.();
  }

  function renderClassPicker() {
    const sel = $("#activeClassSelect");
    sel.innerHTML = Object.values(state.classes)
      .map((c) => `<option value="${esc(c.id)}" ${c.id === state.activeClassId ? "selected" : ""}>Lớp ${esc(c.name)} (${c.students.length} HS)</option>`)
      .join("");
  }

  /* ===================== DASHBOARD ===================== */
  function renderDashboard() {
    const cls = getActiveClass();
    const total = cls.students.length;
    $("#kpiClassTag").textContent = cls.name;
    $("#kpiStudents").textContent = total;
    $("#kpiRosterNote").textContent = cls.room ? `${cls.room} · ${total} em theo học` : `${total} học sinh trong lớp`;

    const att = cls.attendance?.[today()] || {};
    if (Object.keys(att).length && total) {
      let present = 0;
      cls.students.forEach((s) => {
        const st = getAttEntry(att, s.id).status;
        if (st === "present" || st === "late") present++;
      });
      const absent = total - present;
      $("#kpiPresent").textContent = `${present}/${total}`;
      $("#kpiAbsentNote").textContent = absent > 0 ? `Vắng ${absent} em hôm nay` : "Đi học đầy đủ 100%";
    } else {
      $("#kpiPresent").textContent = "—";
      $("#kpiAbsentNote").textContent = "Chưa lưu điểm danh hôm nay";
    }

    const lastG = cls.grades?.[cls.grades.length - 1];
    if (lastG) {
      const scores = Object.values(lastG.records || {}).map((r) => Number(r.score)).filter((n) => !isNaN(n) && n > 0);
      $("#kpiAvg").textContent = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
      $("#kpiGradeNote").textContent = `${lastG.subject} · ${lastG.assessment}`;
    } else {
      $("#kpiAvg").textContent = "—";
      $("#kpiGradeNote").textContent = "Chưa có bài kiểm tra";
    }

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
      : `<li class="card-sub">Chưa có việc nào. Thêm việc cần làm ở ô trên!</li>`;
  }

  /* ===================== ATTENDANCE & ROSTER ===================== */
  function renderAttendance() {
    const cls = getActiveClass();
    const day = $("#attDate").value || today();
    const att = cls.attendance?.[day] || {};
    const q = ($("#studentSearchInput")?.value || "").trim().toLowerCase();

    let p = 0, l = 0, ex = 0, ab = 0;
    cls.students.forEach((s) => {
      const st = getAttEntry(att, s.id).status;
      if (st === "present") p++;
      else if (st === "late") l++;
      else if (st === "excused") ex++;
      else ab++;
    });

    $("#attSummary").innerHTML = `
      <span class="pill-stat">Có mặt: ${p}</span>
      <span class="pill-stat">Muộn: ${l}</span>
      <span class="pill-stat">Phép: ${ex}</span>
      <span class="pill-stat">Vắng KP: ${ab}</span>
    `;

    const filtered = cls.students.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || (s.parent || "").toLowerCase().includes(q) || (s.phone || "").includes(q)
    );

    $("#attendanceList").innerHTML = filtered.length
      ? filtered
          .map((s, idx) => {
            const ent = getAttEntry(att, s.id);
            const showMsgBtn = ent.status === "absent" || ent.status === "excused" || ent.status === "late";
            return `<div class="student-row" data-sid="${esc(s.id)}">
              <div class="student-main">
                <div><span class="student-idx">${idx + 1}</span><span class="student-name">${esc(s.name)}</span></div>
                ${s.parent || s.phone ? `<div class="student-sub">${esc(s.parent || "PH")}${s.phone ? ` · ${esc(s.phone)}` : ""}</div>` : ""}
              </div>
              <div class="att-right">
                <div class="status-pills" data-sid="${esc(s.id)}">
                  <label><input type="radio" name="att-${esc(s.id)}" value="present" ${ent.status === "present" ? "checked" : ""}/><span>Có mặt</span></label>
                  <label><input type="radio" name="att-${esc(s.id)}" value="late" ${ent.status === "late" ? "checked" : ""}/><span>Muộn</span></label>
                  <label><input type="radio" name="att-${esc(s.id)}" value="excused" ${ent.status === "excused" ? "checked" : ""}/><span>Phép</span></label>
                  <label><input type="radio" name="att-${esc(s.id)}" value="absent" ${ent.status === "absent" ? "checked" : ""}/><span>Vắng</span></label>
                </div>
                <input type="text" class="att-note-inp" data-att-note="${esc(s.id)}" value="${esc(ent.note)}" placeholder="Lý do / ghi chú..." />
                ${showMsgBtn ? `<button type="button" class="btn-xs" data-quick-msg="${esc(s.id)}" title="Soạn tin hỏi thăm PH ngay">✉ Nhắn PH</button>` : ""}
              </div>
            </div>`;
          })
          .join("")
      : `<p class="card-sub">Không tìm thấy học sinh phù hợp.</p>`;

    // Roster detail cards
    $("#rosterCards").innerHTML = cls.students
      .map(
        (s) => `<div class="roster-card" data-rsid="${esc(s.id)}">
          <input type="text" class="r-name" value="${esc(s.name)}" placeholder="Họ tên HS" />
          <input type="text" class="r-parent" value="${esc(s.parent || "")}" placeholder="Tên Phụ huynh" />
          <input type="text" class="r-phone" value="${esc(s.phone || "")}" placeholder="SĐT / Zalo" />
          <button type="button" class="btn-xs danger-txt" data-del-stu="${esc(s.id)}" title="Xóa học sinh">✕</button>
        </div>`
      )
      .join("");

    // Bulk textarea
    $("#studentTextarea").value = cls.students
      .map((s) => [s.name, s.parent, s.phone].filter(Boolean).join(", "))
      .join("\n");
  }

  /* ===================== GRADES TT27 ===================== */
  function renderSubjectSelect() {
    const sel = $("#gradeSubject");
    const cur = sel.value || state.subjects[0];
    sel.innerHTML = state.subjects.map((s) => `<option value="${esc(s)}" ${s === cur ? "selected" : ""}>${esc(s)}</option>`).join("");
  }

  function computeGradeStats() {
    const rows = $$("#gradeTableBody tr[data-sid]");
    let sum = 0, cnt = 0, t = 0, h = 0, c = 0;
    rows.forEach((tr) => {
      const sc = tr.querySelector(".g-score").value;
      const lv = tr.querySelector(".g-level").value;
      if (sc !== "" && !isNaN(Number(sc))) { sum += Number(sc); cnt++; }
      if (lv === "T") t++;
      else if (lv === "H") h++;
      else if (lv === "C") c++;
    });
    $("#gradeStatsStrip").textContent = cnt
      ? `TB: ${(sum / cnt).toFixed(2)} · T: ${t} · H: ${h} · C: ${c}`
      : `T: ${t} · H: ${h} · C: ${c}`;
  }

  function applyGradeFilter() {
    const f = $("#gradeFilterLevel").value;
    $$("#gradeTableBody tr[data-sid]").forEach((tr) => {
      const lv = tr.querySelector(".g-level").value;
      tr.hidden = f !== "all" && lv !== f;
    });
  }

  function renderGrades(loadRec) {
    renderSubjectSelect();
    const cls = getActiveClass();
    const rec = loadRec || cls.grades?.[cls.grades.length - 1];
    if (rec && loadRec) {
      if (!state.subjects.includes(rec.subject)) { state.subjects.push(rec.subject); renderSubjectSelect(); }
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
          <td>
            <div class="btn-group">
              <button type="button" class="btn-xs" data-cycle-cmt="${esc(s.id)}" title="Đổi mẫu câu nhận xét khác">↻</button>
              <button type="button" class="btn-xs" data-report-stu="${esc(s.id)}" title="Gửi phiếu báo điểm cho PH">✉</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    computeGradeStats();
    applyGradeFilter();

    $("#gradeHistoryList").innerHTML = cls.grades?.length
      ? cls.grades
          .slice()
          .reverse()
          .map(
            (g) => `<div class="history-item">
              <div><strong>${esc(g.subject)}</strong> · ${esc(g.assessment)} <span class="class-item-meta">(${new Date(g.at).toLocaleDateString("vi-VN")})</span></div>
              <div class="btn-group">
                <button type="button" class="btn-xs" data-open-grade="${esc(g.id)}">Mở lại</button>
                <button type="button" class="btn-xs danger-txt" data-del-grade="${esc(g.id)}">Xóa</button>
              </div>
            </div>`
          )
          .join("")
      : `<p class="card-sub">Chưa lưu đợt kiểm tra nào.</p>`;
  }

  function collectCurrentGrades() {
    const records = {};
    $$("#gradeTableBody tr[data-sid]").forEach((tr) => {
      const sc = tr.querySelector(".g-score").value;
      records[tr.dataset.sid] = {
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
      .map((s) => `<option value="${esc(s.id)}">${esc(s.name)}${s.parent ? ` — ${esc(s.parent)}` : ""}</option>`)
      .join("");
    updateParentPhoneHint();
  }

  function updateParentPhoneHint() {
    const cls = getActiveClass();
    const stu = cls.students.find((s) => s.id === $("#parentStudent").value);
    const box = $("#parentPhoneHint");
    if (stu && (stu.parent || stu.phone)) {
      box.hidden = false;
      box.textContent = `Liên hệ PH bé ${stu.name}: ${stu.parent || "Phụ huynh"}${stu.phone ? ` · SĐT/Zalo: ${stu.phone}` : ""}`;
    } else {
      box.hidden = true;
    }
  }

  function renderAll() {
    renderClassPicker();
    renderProfileUI();
    renderDashboard();
    renderAttendance();
    renderGrades();
    renderParentSelect();
  }

  /* ===================== LESSON 2345 ===================== */
  function generateLesson() {
    const cls = getActiveClass();
    const cfg = {
      book: $("#lpBook").value,
      grade: $("#lpGrade").value,
      subject: $("#lpSubject").value.trim() || "Toán",
      duration: $("#lpDuration").value,
      topic: $("#lpTopic").value.trim() || "Chủ đề bài học",
      focus: $("#lpFocus").value.trim()
    };
    $("#lessonPreview").innerHTML = window.GvcnData.buildLessonPlanHTML(cfg, state.profile, cls.name);
    return cfg;
  }

  /* ===================== GLOBAL EXPORT / IMPORT ===================== */
  function exportFullClassExcel() {
    const cls = getActiveClass();
    const lastG = cls.grades?.[cls.grades.length - 1];
    const s1 = [
      [`${state.profile.school.toUpperCase()} — LỚP ${cls.name} (${state.profile.schoolYear})`, "", "", "", "", ""],
      [`GVCN: ${state.profile.teacherRole} ${state.profile.teacherName}`, "", "", "", "", ""],
      ["STT", "Họ và tên", "Tên PH", "SĐT PH", `Điểm ${lastG?.subject || ""}`, "Mức TT27", "Nhận xét"]
    ];
    cls.students.forEach((s, i) => {
      const r = lastG?.records?.[s.id] || {};
      s1.push([i + 1, s.name, s.parent || "", s.phone || "", r.score ?? "", r.level ?? "", r.comment ?? ""]);
    });

    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(s1), "SoLop_TT27");

      const days = Object.keys(cls.attendance || {}).sort();
      const labels = { present: "Có mặt", late: "Muộn", excused: "Phép", absent: "Vắng" };
      const s2 = [["STT", "Họ và tên", ...days]];
      cls.students.forEach((s, i) => {
        s2.push([i + 1, s.name, ...days.map((d) => labels[getAttEntry(cls.attendance[d], s.id).status] || "")]);
      });
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(s2), "DiemDanh");
      window.XLSX.writeFile(wb, `TroLyGVCN-Lop-${cls.name}-${today()}.xlsx`);
      toast(`Đã xuất sổ lớp ${cls.name} (.xlsx)`);
    } else {
      window.OfficeSuite.loadSheetData(s1, `SoLop_${cls.name}`, `TroLyGVCN-Lop-${cls.name}`);
      window.OfficeSuite.exportSheetXlsx();
    }
  }

  function exportBackupJson() {
    const bundle = { app: "tro-ly-gvcn", exportedAt: new Date().toISOString(), state, office: window.OfficeSuite.getState() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `TroLyGVCN-Backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Đã tải tệp sao lưu toàn bộ (.json)");
  }

  async function importStudentListFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    let parsed = [];
    if ((ext === "xlsx" || ext === "xls") && window.XLSX) {
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      rows.forEach((r) => {
        const strCells = r.map((x) => String(x ?? "").trim()).filter(Boolean);
        const name = strCells.find((c) => c.length > 2 && !/^(stt|họ|tên|ho ten|\d+)$/i.test(c));
        if (name) {
          const phone = strCells.find((c) => /^0\d{8,10}$/.test(c.replace(/\s+/g, ""))) || "";
          parsed.push({ name, parent: "", phone });
        }
      });
    } else {
      const txt = await file.text();
      txt.split(/\r?\n/).forEach((line) => {
        const parts = line.split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, "").trim()).filter(Boolean);
        if (!parts.length || /^(stt|họ và tên|họ tên)/i.test(parts[0])) return;
        const name = /^\d+$/.test(parts[0]) ? parts[1] : parts[0];
        if (name) parsed.push({ name, parent: parts[2] || "", phone: parts[3] || "" });
      });
    }
    if (!parsed.length) return toast("Không tìm thấy danh sách học sinh trong file");
    const cls = getActiveClass();
    cls.students = parsed.map((s, i) => ({ id: `s${Date.now()}_${i}`, ...s, note: "" }));
    save();
    renderAll();
    toast(`Đã nhập ${parsed.length} học sinh vào lớp ${cls.name}`);
  }

  async function handleGlobalUpload(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") {
      try {
        const parsed = JSON.parse(await file.text());
        if ((parsed.app === "tro-ly-gvcn" || parsed.app === "lop-nhe-pro") && parsed.state) {
          state = { ...state, ...parsed.state };
          save();
          if (parsed.office) window.OfficeSuite.setState(parsed.office);
          renderAll();
          toast("Đã khôi phục toàn bộ dữ liệu Trợ lý GVCN!");
          return;
        }
        if (Array.isArray(parsed)) {
          showView("office", "slides");
          window.OfficeSuite.loadSlides(parsed, file.name.replace(/\.json$/i, ""));
          toast("Đã mở bộ Slide từ file .json");
          return;
        }
      } catch {}
      toast("File .json không hợp lệ");
      return;
    }
    if (ext === "pptx") {
      showView("office", "slides");
      await window.OfficeSuite.importSlidesFile(file);
      return;
    }
    if (["docx", "html", "htm", "md", "txt"].includes(ext)) {
      showView("office", "word");
      await window.OfficeSuite.importWordFile(file);
      return;
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      showView("office", "sheet");
      await window.OfficeSuite.importSheetFile(file);
      return;
    }
    toast("Định dạng file chưa hỗ trợ");
  }

  /* ===================== WIRE EVENTS ===================== */
  function initEvents() {
    // Sidebar nav
    $$(".nav-item").forEach((b) =>
      b.addEventListener("click", () => showView(b.dataset.view, b.dataset.officeJump))
    );
    $("#openSidebar").addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#sidebarBackdrop").hidden = false;
    });
    const closeSb = () => { $("#sidebar").classList.remove("open"); $("#sidebarBackdrop").hidden = true; };
    $("#closeSidebar").addEventListener("click", closeSb);
    $("#sidebarBackdrop").addEventListener("click", closeSb);

    // Quick jumps
    $("#topbarProfilePill").addEventListener("click", () => showView("profile"));
    $$("[data-jump]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.jump)));
    $$("[data-jump-office]").forEach((b) => b.addEventListener("click", () => showView("office", b.dataset.jumpOffice)));

    // Theme
    if (state.theme === "dark") document.body.classList.add("dark");
    $("#btnThemeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      state.theme = document.body.classList.contains("dark") ? "dark" : "light";
      save();
    });

    // Class switcher & manager
    $("#activeClassSelect").addEventListener("change", (e) => {
      state.activeClassId = e.target.value;
      save();
      renderAll();
    });

    const addNewClass = () => {
      const name = prompt("Nhập tên lớp mới (VD: 4B, 5A):");
      if (!name || !name.trim()) return;
      const room = prompt("Phòng học (có thể bỏ trống):", "") || "";
      const id = `c${Date.now()}`;
      state.classes[id] = { id, name: name.trim(), room: room.trim(), students: [], attendance: {}, grades: [] };
      state.activeClassId = id;
      save();
      renderAll();
      toast(`Đã tạo lớp ${name.trim()}`);
    };
    $("#btnAddClassQuick").addEventListener("click", addNewClass);
    $("#btnAddClassInProfile").addEventListener("click", addNewClass);
    $("#btnManageClassQuick").addEventListener("click", () => showView("profile"));

    $("#classManagerList").addEventListener("click", (e) => {
      const sel = e.target.closest("[data-sel-cls]");
      if (sel) { state.activeClassId = sel.dataset.selCls; save(); renderAll(); return; }
      const ren = e.target.closest("[data-ren-cls]");
      if (ren) {
        const c = state.classes[ren.dataset.renCls];
        const newName = prompt("Đổi tên lớp:", c.name);
        if (newName && newName.trim()) {
          c.name = newName.trim();
          c.room = prompt("Phòng học:", c.room || "") ?? c.room;
          save();
          renderAll();
          toast(`Đã cập nhật lớp ${c.name}`);
        }
        return;
      }
      const del = e.target.closest("[data-del-cls]");
      if (del) {
        if (Object.keys(state.classes).length <= 1) return toast("Cần giữ ít nhất 1 lớp học");
        const c = state.classes[del.dataset.delCls];
        if (!confirm(`Xóa lớp ${c.name} cùng dữ liệu của lớp này?`)) return;
        delete state.classes[c.id];
        if (state.activeClassId === c.id) state.activeClassId = Object.keys(state.classes)[0];
        save();
        renderAll();
        toast(`Đã xóa lớp ${c.name}`);
      }
    });

    // Profile Save
    $("#btnSaveProfile").addEventListener("click", () => {
      state.profile = {
        department: $("#profDept").value.trim() || window.GvcnData.DEFAULT_PROFILE.department,
        school: $("#profSchool").value.trim() || window.GvcnData.DEFAULT_PROFILE.school,
        schoolYear: $("#profYear").value.trim() || "2026 - 2027",
        semester: $("#profSemester").value,
        bookSeries: $("#profBook").value,
        teacherName: $("#profTeacher").value.trim() || "Giáo viên chủ nhiệm",
        teacherRole: $("#profRole").value,
        teacherPhone: $("#profPhone").value.trim(),
        group: $("#profGroup").value.trim(),
        slogan: $("#profSlogan").value.trim()
      };
      save();
      renderProfileUI();
      generateLesson();
      toast("Đã lưu Thông tin chung Trường · Lớp · GVCN");
    });

    $("#btnProfileToWord").addEventListener("click", () => {
      const cls = getActiveClass();
      showView("office", "word");
      window.OfficeSuite.openInWord(window.GvcnData.WORD_TEMPLATES.khcn(state.profile, cls), `Ke-hoach-chu-nhiem-Lop-${cls.name}`);
      toast("Đã tạo Kế hoạch chủ nhiệm trong Word");
    });

    $("#btnProfileToSlides").addEventListener("click", () => {
      const cls = getActiveClass();
      showView("office", "slides");
      window.OfficeSuite.loadSlides(window.GvcnData.buildMeetingSlides(state.profile, cls), `Hop-Phu-Huynh-Lop-${cls.name}`);
      toast("Đã tạo bộ Slide Họp Phụ huynh — bấm Tải PowerPoint (.pptx) ngay!");
    });

    $("#btnLoadSample").addEventListener("click", () => {
      state.classes.c1 = createSampleClass();
      state.activeClassId = "c1";
      state.todos = JSON.parse(JSON.stringify(window.GvcnData.SAMPLE_TODOS));
      save();
      renderAll();
      toast("Đã nạp dữ liệu mẫu lớp 3A");
    });

    // Global Upload / Download + Drag & Drop
    $("#btnGlobalUpload").addEventListener("click", () => $("#globalFileInput").click());
    $("#globalFileInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) handleGlobalUpload(e.target.files[0]);
      e.target.value = "";
    });

    let dragDepth = 0;
    window.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; $("#dropOverlay").hidden = false; });
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("dragleave", () => { dragDepth--; if (dragDepth <= 0) { dragDepth = 0; $("#dropOverlay").hidden = true; } });
    window.addEventListener("drop", (e) => {
      e.preventDefault();
      dragDepth = 0;
      $("#dropOverlay").hidden = true;
      if (e.dataTransfer?.files?.[0]) handleGlobalUpload(e.dataTransfer.files[0]);
    });

    const dlMenu = $("#downloadMenu");
    $("#btnGlobalDownload").addEventListener("click", (e) => { e.stopPropagation(); dlMenu.hidden = !dlMenu.hidden; });
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
      if (del) { state.todos = state.todos.filter((t) => t.id !== del.dataset.del); save(); renderDashboard(); return; }
      const li = e.target.closest(".todo-item");
      if (li && e.target.type === "checkbox") {
        const item = state.todos.find((t) => t.id === li.dataset.tid);
        if (item) item.done = e.target.checked;
        save();
        renderDashboard();
      }
    });
    $("#btnClearDone").addEventListener("click", () => { state.todos = state.todos.filter((t) => !t.done); save(); renderDashboard(); });

    // Attendance & Roster
    $("#attDate").value = today();
    $("#attDate").addEventListener("change", renderAttendance);
    $("#studentSearchInput").addEventListener("input", renderAttendance);
    $("#btnAllPresent").addEventListener("click", () => {
      $$("#attendanceList input[value='present']").forEach((r) => (r.checked = true));
      toast("Đã chọn tất cả Có mặt — bấm Lưu điểm danh");
    });

    $("#attendanceList").addEventListener("click", (e) => {
      const msgBtn = e.target.closest("[data-quick-msg]");
      if (!msgBtn) return;
      const sid = msgBtn.dataset.quickMsg;
      showView("parent");
      $("#parentStudent").value = sid;
      $("#noteType").value = "vang";
      updateParentPhoneHint();
      runParentGen();
      toast("Đã soạn sẵn tin hỏi thăm phụ huynh");
    });

    $("#btnSaveAtt").addEventListener("click", () => {
      const cls = getActiveClass();
      const day = $("#attDate").value || today();
      const map = { ...(cls.attendance?.[day] || {}) };
      $$("#attendanceList .student-row[data-sid]").forEach((row) => {
        const sid = row.dataset.sid;
        const ch = row.querySelector("input[type='radio']:checked");
        const note = row.querySelector(".att-note-inp")?.value.trim() || "";
        map[sid] = { status: ch ? ch.value : "present", note };
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
      const rows = [["STT", "Họ và tên", `Điểm danh ${day}`, "Ghi chú"]];
      cls.students.forEach((s, i) => {
        const e = getAttEntry(att, s.id);
        rows.push([i + 1, s.name, labels[e.status], e.note]);
      });
      const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
      a.download = `DiemDanh-${cls.name}-${day}.csv`;
      a.click();
      toast("Đã xuất điểm danh (.csv)");
    });

    // Sub-tabs roster
    $$(".sub-tab").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".sub-tab").forEach((x) => x.classList.toggle("active", x === b));
        const mode = b.dataset.rosterMode;
        $("#rosterDetailPane").hidden = mode !== "detail";
        $("#rosterBulkPane").hidden = mode !== "bulk";
      })
    );

    $("#addStudentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#newStuName").value.trim();
      if (!name) return;
      const cls = getActiveClass();
      cls.students.push({
        id: `s${Date.now()}`,
        name,
        parent: $("#newStuParent").value.trim(),
        phone: $("#newStuPhone").value.trim(),
        note: ""
      });
      $("#newStuName").value = "";
      $("#newStuParent").value = "";
      $("#newStuPhone").value = "";
      save();
      renderAll();
      toast(`Đã thêm học sinh ${name}`);
    });

    $("#rosterCards").addEventListener("input", (e) => {
      const card = e.target.closest(".roster-card");
      if (!card) return;
      const stu = getActiveClass().students.find((s) => s.id === card.dataset.rsid);
      if (!stu) return;
      stu.name = card.querySelector(".r-name").value.trim() || stu.name;
      stu.parent = card.querySelector(".r-parent").value.trim();
      stu.phone = card.querySelector(".r-phone").value.trim();
      save();
    });

    $("#rosterCards").addEventListener("click", (e) => {
      const del = e.target.closest("[data-del-stu]");
      if (!del) return;
      const cls = getActiveClass();
      cls.students = cls.students.filter((s) => s.id !== del.dataset.delStu);
      save();
      renderAll();
      toast("Đã xóa học sinh khỏi lớp");
    });

    $("#btnSaveClassBulk").addEventListener("click", () => {
      const cls = getActiveClass();
      const lines = $("#studentTextarea").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return toast("Nhập ít nhất 1 học sinh");
      cls.students = lines.map((line, i) => {
        const parts = line.split(/[,;]/).map((p) => p.trim());
        return {
          id: cls.students[i]?.id || `s${Date.now()}_${i}`,
          name: parts[0],
          parent: parts[1] || cls.students[i]?.parent || "",
          phone: parts[2] || cls.students[i]?.phone || "",
          note: ""
        };
      });
      save();
      renderAll();
      toast(`Đã lưu ${cls.students.length} học sinh lớp ${cls.name}`);
    });

    $("#btnImportStudents").addEventListener("click", () => $("#studentFileInput").click());
    $("#studentFileInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) importStudentListFile(e.target.files[0]);
      e.target.value = "";
    });
    $("#btnSendClassToSheet").addEventListener("click", () => {
      const cls = getActiveClass();
      const aoa = [["STT", "Họ và tên", "Tên Phụ huynh", "SĐT / Zalo PH", "Lớp"]];
      cls.students.forEach((s, i) => aoa.push([i + 1, s.name, s.parent || "", s.phone || "", cls.name]));
      showView("office", "sheet");
      window.OfficeSuite.loadSheetData(aoa, `DS_${cls.name}`, `Danh-ba-Lop-${cls.name}`);
      toast("Đã mở danh bạ lớp trong Excel");
    });

    // Grades TT27
    $("#btnAddSubject").addEventListener("click", () => {
      const subj = prompt("Nhập tên môn học / hoạt động mới:");
      if (!subj || !subj.trim()) return;
      if (!state.subjects.includes(subj.trim())) {
        state.subjects.push(subj.trim());
        save();
        renderSubjectSelect();
      }
      $("#gradeSubject").value = subj.trim();
      toast(`Đã thêm môn "${subj.trim()}"`);
    });

    $("#gradeFilterLevel").addEventListener("change", applyGradeFilter);

    $("#gradeTableBody").addEventListener("input", (e) => {
      const tr = e.target.closest("tr[data-sid]");
      if (!tr) return;
      if (e.target.classList.contains("g-score")) {
        const lv = window.GvcnData.getTT27Level(e.target.value);
        if (lv) tr.querySelector(".g-level").value = lv;
      }
      computeGradeStats();
    });

    $("#gradeTableBody").addEventListener("click", (e) => {
      const cyc = e.target.closest("[data-cycle-cmt]");
      if (cyc) {
        const tr = cyc.closest("tr");
        const sid = cyc.dataset.cycleCmt;
        const lv = tr.querySelector(".g-level").value || "H";
        commentCycleMap[sid] = (commentCycleMap[sid] || 0) + 1;
        tr.querySelector(".g-comment").value = window.GvcnData.pickTT27Comment($("#gradeSubject").value, lv, commentCycleMap[sid]);
        return;
      }
      const rep = e.target.closest("[data-report-stu]");
      if (rep) {
        const sid = rep.dataset.reportStu;
        const cur = collectCurrentGrades()[sid];
        const cls = getActiveClass();
        const stu = cls.students.find((s) => s.id === sid);
        const msg = window.GvcnData.buildParentMessage({
          student: stu,
          profile: state.profile,
          className: cls.name,
          type: "diem",
          gradeRec: cur,
          gradeSubject: $("#gradeSubject").value
        });
        showView("parent");
        $("#parentStudent").value = sid;
        $("#noteType").value = "diem";
        $("#noteOut").value = msg;
        updateParentPhoneHint();
        toast(`Đã tạo phiếu báo điểm cho bé ${stu?.name || ""}`);
      }
    });

    $("#btnAutoComment").addEventListener("click", () => {
      const subj = $("#gradeSubject").value;
      $$("#gradeTableBody tr[data-sid]").forEach((tr, idx) => {
        const sc = tr.querySelector(".g-score").value;
        const lvSel = tr.querySelector(".g-level");
        const lv = lvSel.value || window.GvcnData.getTT27Level(sc) || "H";
        lvSel.value = lv;
        tr.querySelector(".g-comment").value = window.GvcnData.pickTT27Comment(subj, lv, idx);
      });
      computeGradeStats();
      toast("Đã tự điền nhận xét chuẩn Thông tư 27");
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
      const aoa = [
        [`SỔ ĐIỂM ${subj.toUpperCase()} — LỚP ${cls.name} (${state.profile.school})`, "", "", "", ""],
        ["STT", "Họ và tên", "Điểm", "Mức TT27", "Nhận xét học bạ"]
      ];
      cls.students.forEach((s, i) => {
        const r = cur[s.id] || {};
        aoa.push([i + 1, s.name, r.score ?? "", r.level ?? "", r.comment ?? ""]);
      });
      aoa.push(["", "Điểm TB lớp", `=AVERAGE(C3:C${cls.students.length + 2})`, "", ""]);
      showView("office", "sheet");
      window.OfficeSuite.loadSheetData(aoa, `Diem_${subj.slice(0, 10)}`, `So-diem-${subj}-${cls.name}`);
      toast("Đã đưa sổ điểm sang Excel");
    });

    $("#btnExportGradesXlsx").addEventListener("click", exportFullClassExcel);

    $("#gradeHistoryList").addEventListener("click", (e) => {
      const op = e.target.closest("[data-open-grade]");
      if (op) {
        const rec = getActiveClass().grades.find((g) => g.id === op.dataset.openGrade);
        if (rec) { renderGrades(rec); toast(`Đã mở lại: ${rec.subject} · ${rec.assessment}`); }
        return;
      }
      const del = e.target.closest("[data-del-grade]");
      if (del) {
        const cls = getActiveClass();
        cls.grades = cls.grades.filter((g) => g.id !== del.dataset.delGrade);
        save();
        renderGrades();
        renderDashboard();
        toast("Đã xóa đợt kiểm tra");
      }
    });

    // Lesson 2345
    $("#btnGenLesson").addEventListener("click", () => { generateLesson(); toast("Đã tạo Kế hoạch bài dạy 2345"); });
    $$("[data-lp-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = window.GvcnData.LESSON_PRESETS[b.dataset.lpPreset];
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
      window.OfficeSuite.exportWordDoc($("#lessonPreview").innerHTML, `KHBD-${$("#lpSubject").value}-Lop${getActiveClass().name}.doc`);
    });
    $("#btnLessonToWord").addEventListener("click", () => {
      showView("office", "word");
      window.OfficeSuite.openInWord($("#lessonPreview").innerHTML, `KHBD-${$("#lpSubject").value}-Lop${getActiveClass().name}`);
      toast("Đã mở giáo án trong Office Word");
    });
    $("#btnLessonToSlides").addEventListener("click", () => {
      const cfg = {
        book: $("#lpBook").value,
        grade: $("#lpGrade").value,
        subject: $("#lpSubject").value.trim() || "Toán",
        duration: $("#lpDuration").value,
        topic: $("#lpTopic").value.trim() || "Bài học",
        focus: $("#lpFocus").value.trim()
      };
      const cls = getActiveClass();
      showView("office", "slides");
      window.OfficeSuite.loadSlides(window.GvcnData.buildSlidesFromLesson(cfg, state.profile, cls.name), `Slide-${cfg.subject}-Lop-${cls.name}`);
      toast("Đã sinh bộ 5 Slide bài giảng — bấm Tải PowerPoint (.pptx) ngay!");
    });

    // Parent Messaging
    $("#parentStudent").addEventListener("change", updateParentPhoneHint);
    const runParentGen = () => {
      const cls = getActiveClass();
      const stu = cls.students.find((s) => s.id === $("#parentStudent").value) || cls.students[0];
      const lastG = cls.grades?.[cls.grades.length - 1];
      $("#noteOut").value = window.GvcnData.buildParentMessage({
        student: stu,
        profile: state.profile,
        className: cls.name,
        type: $("#noteType").value,
        extra: $("#noteExtra").value.trim(),
        gradeRec: lastG?.records?.[stu?.id],
        gradeSubject: lastG?.subject
      });
    };
    $("#btnGenNote").addEventListener("click", () => { runParentGen(); toast("Đã tạo tin nhắn phụ huynh"); });
    $("#btnGenBatchNotes").addEventListener("click", () => {
      const cls = getActiveClass();
      const type = $("#noteType").value;
      const extra = $("#noteExtra").value.trim();
      const lastG = cls.grades?.[cls.grades.length - 1];
      const all = cls.students.map((stu, i) => {
        const msg = window.GvcnData.buildParentMessage({
          student: stu,
          profile: state.profile,
          className: cls.name,
          type,
          extra,
          gradeRec: lastG?.records?.[stu.id],
          gradeSubject: lastG?.subject
        });
        return `--- [${i + 1}. ${stu.name}${stu.phone ? ` · ${stu.phone}` : ""}] ---\n${msg}`;
      });
      $("#noteOut").value = all.join("\n\n");
      toast(`Đã tạo hàng loạt ${cls.students.length} tin nhắn cho cả lớp`);
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
      a.download = `Tin-nhan-PH-Lop-${getActiveClass().name}.txt`;
      a.click();
      toast("Đã tải file tin nhắn (.txt)");
    });
  }

  /* ===================== BOOT ===================== */
  load();
  window.OfficeSuite.init({
    notify: toast,
    getContext: () => ({ profile: state.profile, cls: getActiveClass() })
  });
  initEvents();
  renderAll();
  generateLesson();
})();
