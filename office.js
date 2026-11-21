/* Bộ Office Tích Hợp VIP Pro: Word (A4) · Excel (Công thức thật) · PowerPoint (Trình chiếu + .pptx) */
window.OfficeSuite = (() => {
  const OFFICE_KEY = "lop-nhe-office-v2";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  let state = {
    activeTab: "word",
    title: "Tai-lieu-Lop-Nhe",
    wordHtml: "",
    sheet: {
      rows: 16,
      cols: 8,
      cells: {}, // "R,C": { v: raw, bold, align, bg }
      selected: { r: 0, c: 0 }
    },
    slides: [],
    slideIdx: 0
  };

  let notifyFn = () => {};
  let getClassContextFn = () => ({ className: "3A", students: [], attendance: {}, grades: [] });

  function save() {
    try {
      localStorage.setItem(OFFICE_KEY, JSON.stringify(state));
    } catch {}
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(OFFICE_KEY) || "null");
      if (saved) state = Object.assign(state, saved);
    } catch {}
    if (!state.wordHtml) {
      state.wordHtml = window.LopNheData.WORD_TEMPLATES.khbd();
    }
    if (!Object.keys(state.sheet.cells || {}).length) {
      loadSheetArray(window.LopNheData.SHEET_TEMPLATES.fund, false);
    }
    if (!state.slides?.length) {
      state.slides = window.LopNheData.buildSlidesFromLesson(window.LopNheData.LESSON_PRESETS.toan3);
      state.slideIdx = 0;
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(ext) {
    const base = ($("#officeDocTitle")?.value || state.title || "Lop-Nhe")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-");
    return `${base || "Lop-Nhe"}.${ext}`;
  }

  /* ===================== TAB SWITCHER ===================== */
  function switchTab(tab) {
    state.activeTab = tab;
    $$(".office-tab").forEach((b) => b.classList.toggle("active", b.dataset.office === tab));
    $$(".office-pane").forEach((p) => {
      const on = p.dataset.officePane === tab;
      p.classList.toggle("active", on);
      p.hidden = !on;
    });
    save();
  }

  /* ===================== 1. WORD PROCESSOR ===================== */
  function updateWordStats() {
    const ed = $("#wordEditor");
    if (!ed) return;
    const text = (ed.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    $("#wordStats").textContent = `${words} từ · ${text.length} ký tự`;
  }

  function openInWord(html, title) {
    state.wordHtml = html;
    if (title) {
      state.title = title;
      $("#officeDocTitle").value = title;
    }
    $("#wordEditor").innerHTML = html;
    updateWordStats();
    switchTab("word");
    save();
  }

  function exportWordDoc(customHtml, customName) {
    const html = customHtml ?? $("#wordEditor").innerHTML;
    const doc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="vi"><head><meta charset="utf-8"><style>@page{size:A4;margin:2cm;}body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.5;color:#111;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #555;padding:6px 8px;}</style></head><body>${html}</body></html>`;
    downloadBlob(new Blob(["\ufeff", doc], { type: "application/msword;charset=utf-8" }), customName || safeFilename("doc"));
    notifyFn("Đã tải tài liệu Word (.doc)");
  }

  async function importWordFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const baseName = file.name.replace(/\.[^.]+$/, "");
    if (ext === "docx" && window.mammoth) {
      const buf = await file.arrayBuffer();
      const res = await window.mammoth.convertToHtml({ arrayBuffer: buf });
      openInWord(res.value || "<p>(Tệp trống)</p>", baseName);
      notifyFn(`Đã mở file Word: ${file.name}`);
      return;
    }
    const text = await file.text();
    const html =
      ext === "html" || ext === "htm"
        ? text
        : text
            .split(/\r?\n/)
            .map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;") || "&nbsp;"}</p>`)
            .join("");
    openInWord(html, baseName);
    notifyFn(`Đã mở văn bản: ${file.name}`);
  }

  function initWord() {
    const ed = $("#wordEditor");
    ed.innerHTML = state.wordHtml;
    updateWordStats();

    ed.addEventListener("input", () => {
      state.wordHtml = ed.innerHTML;
      updateWordStats();
      save();
    });

    $$(".ribbon [data-cmd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ed.focus();
        document.execCommand(btn.dataset.cmd, false, null);
        state.wordHtml = ed.innerHTML;
        save();
      });
    });

    $("#wordFont").addEventListener("change", (e) => {
      ed.focus();
      document.execCommand("fontName", false, e.target.value);
    });
    $("#wordSize").addEventListener("change", (e) => {
      ed.focus();
      document.execCommand("fontSize", false, e.target.value);
    });
    $("#wordForeColor").addEventListener("input", (e) => {
      ed.focus();
      document.execCommand("foreColor", false, e.target.value);
    });
    $("#wordBackColor").addEventListener("input", (e) => {
      ed.focus();
      document.execCommand("hiliteColor", false, e.target.value);
    });

    $("#btnWordTable").addEventListener("click", () => {
      ed.focus();
      const tbl = `<table border="1" style="width:100%;border-collapse:collapse;"><tr><th>Cột 1</th><th>Cột 2</th><th>Cột 3</th></tr><tr><td>Nội dung</td><td>Nội dung</td><td>Nội dung</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table><p></p>`;
      document.execCommand("insertHTML", false, tbl);
      state.wordHtml = ed.innerHTML;
      save();
    });

    $("#btnWordImage").addEventListener("click", () => $("#wordImageInput").click());
    $("#wordImageInput").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        ed.focus();
        document.execCommand("insertHTML", false, `<p><img src="${reader.result}" alt="ảnh"/></p>`);
        state.wordHtml = ed.innerHTML;
        save();
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    });

    $("#wordTemplateSelect").addEventListener("change", (e) => {
      const key = e.target.value;
      if (!key) return;
      const fn = window.LopNheData.WORD_TEMPLATES[key];
      if (fn) {
        const cls = getClassContextFn().className || "3A";
        openInWord(fn(cls), `Mau-${key}-${cls}`);
        notifyFn("Đã nạp mẫu văn bản VIP");
      }
      e.target.value = "";
    });

    $("#btnWordUpload").addEventListener("click", () => $("#wordUploadInput").click());
    $("#wordUploadInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) importWordFile(e.target.files[0]);
      e.target.value = "";
    });
    $("#btnWordPrint").addEventListener("click", () => window.print());
    $("#btnWordDownloadDoc").addEventListener("click", () => exportWordDoc());
  }

  /* ===================== 2. SPREADSHEET (EXCEL) ===================== */
  function colName(c) {
    let s = "";
    let n = c;
    while (n >= 0) {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  }

  function parseRef(ref) {
    const m = /^([A-Z]+)(\d+)$/i.exec(ref.trim());
    if (!m) return null;
    const letters = m[1].toUpperCase();
    let col = 0;
    for (let i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
    return { r: parseInt(m[2], 10) - 1, c: col - 1 };
  }

  function getCellRaw(r, c) {
    return state.sheet.cells[`${r},${c}`]?.v ?? "";
  }

  function evalCell(r, c, depth = 0) {
    if (depth > 15) return "#LOOP";
    const raw = getCellRaw(r, c);
    if (raw === "" || raw === null || raw === undefined) return "";
    const str = String(raw);
    if (!str.startsWith("=")) return raw;

    try {
      let expr = str.slice(1).trim();

      const expandRange = (a, b) => {
        const p1 = parseRef(a);
        const p2 = parseRef(b);
        if (!p1 || !p2) return [];
        const vals = [];
        for (let rr = Math.min(p1.r, p2.r); rr <= Math.max(p1.r, p2.r); rr++) {
          for (let cc = Math.min(p1.c, p2.c); cc <= Math.max(p1.c, p2.c); cc++) {
            const v = evalCell(rr, cc, depth + 1);
            const num = Number(v);
            if (v !== "" && !isNaN(num)) vals.push(num);
          }
        }
        return vals;
      };

      // Handle IF(cond, trueVal, falseVal)
      expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (_, cond, tVal, fVal) => {
        const safeCond = cond.replace(/\b([A-Z]+\d+)\b/gi, (ref) => {
          const p = parseRef(ref);
          const v = p ? evalCell(p.r, p.c, depth + 1) : 0;
          return isNaN(Number(v)) ? JSON.stringify(v) : Number(v);
        });
        const ok = Function(`"use strict"; return (${safeCond});`)();
        return ok ? tVal.trim() : fVal.trim();
      });

      // Aggregate functions
      expr = expr.replace(/\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\(([^)]+)\)/gi, (_, fn, argStr) => {
        let nums = [];
        argStr.split(",").forEach((part) => {
          const rangeMatch = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(part.trim());
          if (rangeMatch) {
            nums = nums.concat(expandRange(rangeMatch[1], rangeMatch[2]));
          } else {
            const p = parseRef(part);
            const val = p ? evalCell(p.r, p.c, depth + 1) : part.trim();
            if (val !== "" && !isNaN(Number(val))) nums.push(Number(val));
          }
        });
        const f = fn.toUpperCase();
        if (!nums.length) return 0;
        if (f === "SUM") return nums.reduce((a, b) => a + b, 0);
        if (f === "AVERAGE" || f === "AVG") return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        if (f === "MIN") return Math.min(...nums);
        if (f === "MAX") return Math.max(...nums);
        if (f === "COUNT") return nums.length;
        return 0;
      });

      // Replace standalone cell refs (not inside quotes)
      if (!/^["'].*["']$/.test(expr)) {
        expr = expr.replace(/\b([A-Z]+\d+)\b/gi, (ref) => {
          const p = parseRef(ref);
          if (!p) return 0;
          const v = evalCell(p.r, p.c, depth + 1);
          return v === "" || isNaN(Number(v)) ? 0 : Number(v);
        });
        const out = Function(`"use strict"; return (${expr});`)();
        if (typeof out === "number" && !Number.isInteger(out)) return Number(out.toFixed(2));
        return out;
      }
      return expr.replace(/^["']|["']$/g, "");
    } catch {
      return "#ERR";
    }
  }

  function loadSheetArray(aoa, persist = true, title) {
    const rows = Math.max(14, aoa.length + 4);
    const maxCols = aoa.reduce((m, r) => Math.max(m, r.length), 6);
    const cols = Math.max(8, maxCols + 2);
    const cells = {};
    aoa.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== "" && val !== null && val !== undefined) {
          cells[`${r},${c}`] = { v: val, bold: r === 0, bg: r === 0 ? "#e6f4ec" : "" };
        }
      });
    });
    state.sheet = { rows, cols, cells, selected: { r: 0, c: 0 } };
    if (title) {
      state.title = title;
      if ($("#officeDocTitle")) $("#officeDocTitle").value = title;
    }
    if (persist) {
      save();
      renderSheet();
    }
  }

  function renderSheet() {
    const tbl = $("#sheetTable");
    if (!tbl) return;
    const { rows, cols, selected } = state.sheet;
    let html = `<thead><tr><th style="width:38px"></th>`;
    for (let c = 0; c < cols; c++) html += `<th>${colName(c)}</th>`;
    html += `</tr></thead><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr><td class="row-hdr">${r + 1}</td>`;
      for (let c = 0; c < cols; c++) {
        const cell = state.sheet.cells[`${r},${c}`] || {};
        const val = evalCell(r, c);
        const selCls = selected.r === r && selected.c === c ? "selected" : "";
        const style = [
          cell.bold ? "font-weight:700" : "",
          cell.align ? `text-align:${cell.align}` : typeof val === "number" ? "text-align:right" : "",
          cell.bg ? `background:${cell.bg};color:#111` : ""
        ]
          .filter(Boolean)
          .join(";");
        const display =
          typeof val === "number" && Math.abs(val) >= 1000 ? val.toLocaleString("vi-VN") : String(val ?? "");
        html += `<td class="${selCls}" data-r="${r}" data-c="${c}" style="${style}">${display.replace(/</g, "&lt;")}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody>`;
    tbl.innerHTML = html;

    $("#sheetCellRef").textContent = `${colName(selected.c)}${selected.r + 1}`;
    $("#sheetFormulaInput").value = getCellRaw(selected.r, selected.c);
  }

  function setCellValue(r, c, val) {
    const key = `${r},${c}`;
    const existing = state.sheet.cells[key] || {};
    const num = val !== "" && !String(val).startsWith("=") && !isNaN(Number(val)) ? Number(val) : val;
    if (num === "" && !existing.bold && !existing.bg) delete state.sheet.cells[key];
    else state.sheet.cells[key] = { ...existing, v: num };
    save();
    renderSheet();
  }

  function sheetToAoA() {
    const out = [];
    for (let r = 0; r < state.sheet.rows; r++) {
      const row = [];
      let hasData = false;
      for (let c = 0; c < state.sheet.cols; c++) {
        const v = evalCell(r, c);
        if (v !== "") hasData = true;
        row.push(v);
      }
      if (hasData) out.push(row);
    }
    return out;
  }

  function exportSheetXlsx() {
    const aoa = sheetToAoA();
    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      window.XLSX.utils.book_append_sheet(wb, ws, "BangTinh");
      window.XLSX.writeFile(wb, safeFilename("xlsx"));
      notifyFn("Đã tải bảng tính Excel (.xlsx)");
    } else {
      exportSheetCsv();
    }
  }

  function exportSheetCsv() {
    const aoa = sheetToAoA();
    const csv = aoa
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), safeFilename("csv"));
    notifyFn("Đã tải tệp CSV (.csv)");
  }

  async function importSheetFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const baseName = file.name.replace(/\.[^.]+$/, "");
    if ((ext === "xlsx" || ext === "xls") && window.XLSX) {
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      loadSheetArray(aoa, true, baseName);
      switchTab("sheet");
      notifyFn(`Đã mở Excel: ${file.name}`);
      return;
    }
    const text = await file.text();
    const aoa = text
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((line) => line.split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, "").trim()));
    loadSheetArray(aoa, true, baseName);
    switchTab("sheet");
    notifyFn(`Đã mở bảng tính: ${file.name}`);
  }

  function initSheet() {
    renderSheet();
    const tbl = $("#sheetTable");

    tbl.addEventListener("click", (e) => {
      const td = e.target.closest("td[data-r]");
      if (!td) return;
      state.sheet.selected = { r: Number(td.dataset.r), c: Number(td.dataset.c) };
      renderSheet();
    });

    tbl.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td[data-r]");
      if (!td) return;
      const r = Number(td.dataset.r);
      const c = Number(td.dataset.c);
      const inp = document.createElement("input");
      inp.className = "cell-inline-edit";
      inp.value = getCellRaw(r, c);
      td.innerHTML = "";
      td.appendChild(inp);
      inp.focus();
      inp.select();
      const commit = () => setCellValue(r, c, inp.value);
      inp.addEventListener("blur", commit);
      inp.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          commit();
          state.sheet.selected = { r: Math.min(state.sheet.rows - 1, r + 1), c };
          renderSheet();
        }
      });
    });

    $("#sheetFormulaInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const { r, c } = state.sheet.selected;
        setCellValue(r, c, e.target.value);
      }
    });

    $("#btnSheetBold").addEventListener("click", () => {
      const { r, c } = state.sheet.selected;
      const key = `${r},${c}`;
      const cur = state.sheet.cells[key] || { v: "" };
      state.sheet.cells[key] = { ...cur, bold: !cur.bold };
      save();
      renderSheet();
    });

    $("#btnSheetAlign").addEventListener("click", () => {
      const { r, c } = state.sheet.selected;
      const key = `${r},${c}`;
      const cur = state.sheet.cells[key] || { v: "" };
      const order = ["left", "center", "right"];
      const next = order[(order.indexOf(cur.align || "left") + 1) % 3];
      state.sheet.cells[key] = { ...cur, align: next };
      save();
      renderSheet();
    });

    $("#sheetBgColor").addEventListener("input", (e) => {
      const { r, c } = state.sheet.selected;
      const key = `${r},${c}`;
      const cur = state.sheet.cells[key] || { v: "" };
      state.sheet.cells[key] = { ...cur, bg: e.target.value };
      save();
      renderSheet();
    });

    $("#btnSheetSum").addEventListener("click", () => {
      const { r, c } = state.sheet.selected;
      const col = colName(c);
      setCellValue(r, c, `=SUM(${col}2:${col}${Math.max(2, r)})`);
    });
    $("#btnSheetAvg").addEventListener("click", () => {
      const { r, c } = state.sheet.selected;
      const col = colName(c);
      setCellValue(r, c, `=AVERAGE(${col}2:${col}${Math.max(2, r)})`);
    });
    $("#btnSheetAddRow").addEventListener("click", () => {
      state.sheet.rows += 5;
      save();
      renderSheet();
    });
    $("#btnSheetAddCol").addEventListener("click", () => {
      state.sheet.cols += 2;
      save();
      renderSheet();
    });

    $("#sheetTemplateSelect").addEventListener("change", (e) => {
      const v = e.target.value;
      if (!v) return;
      const ctx = getClassContextFn();
      if (v === "sync-grades") {
        const rows = [["STT", "Họ và tên", "Điểm", "Mức TT27", "Nhận xét"]];
        const last = ctx.grades?.[ctx.grades.length - 1];
        ctx.students.forEach((s, i) => {
          const rec = last?.records?.[s.id] || {};
          rows.push([i + 1, s.name, rec.score ?? "", rec.level ?? "", rec.comment ?? ""]);
        });
        rows.push(["", "Điểm TB lớp", `=AVERAGE(C2:C${ctx.students.length + 1})`, "", ""]);
        loadSheetArray(rows, true, `So-diem-${ctx.className}`);
        notifyFn(`Đã đồng bộ Sổ điểm lớp ${ctx.className}`);
      } else if (v === "sync-att") {
        const day = new Date().toISOString().slice(0, 10);
        const att = ctx.attendance?.[day] || {};
        const labels = { present: "Có mặt", late: "Đi muộn", excused: "Vắng có phép", absent: "Vắng KP" };
        const rows = [["STT", "Họ và tên", `Điểm danh (${day})`, "Ghi chú"]];
        ctx.students.forEach((s, i) => rows.push([i + 1, s.name, labels[att[s.id] || "present"], ""]));
        loadSheetArray(rows, true, `Diem-danh-${ctx.className}`);
        notifyFn(`Đã đồng bộ Điểm danh lớp ${ctx.className}`);
      } else if (v === "blank") {
        loadSheetArray([[""]], true, "Bang-tinh-moi");
      } else if (window.LopNheData.SHEET_TEMPLATES[v]) {
        loadSheetArray(window.LopNheData.SHEET_TEMPLATES[v], true, `Mau-${v}`);
        notifyFn("Đã nạp mẫu bảng tính VIP");
      }
      e.target.value = "";
    });

    $("#btnSheetUpload").addEventListener("click", () => $("#sheetUploadInput").click());
    $("#sheetUploadInput").addEventListener("change", (e) => {
      if (e.target.files?.[0]) importSheetFile(e.target.files[0]);
      e.target.value = "";
    });
    $("#btnSheetDownloadXlsx").addEventListener("click", exportSheetXlsx);
    $("#btnSheetDownloadCsv").addEventListener("click", exportSheetCsv);
  }

  /* ===================== 3. SLIDES (POWERPOINT) ===================== */
  function renderSlides() {
    if (!state.slides.length) {
      state.slides = [{ title: "Slide mới", body: "", col2: "", layout: "content", theme: "chalk", notes: "" }];
    }
    state.slideIdx = Math.max(0, Math.min(state.slideIdx, state.slides.length - 1));
    const cur = state.slides[state.slideIdx];

    // Rail
    $("#slidesRail").innerHTML = state.slides
      .map(
        (s, i) => `<div class="slide-thumb theme-${s.theme || "chalk"} ${i === state.slideIdx ? "active" : ""}" data-sidx="${i}">
          <strong>${(s.title || "Slide " + (i + 1)).replace(/</g, "&lt;")}</strong>
          <span>#${i + 1}</span>
        </div>`
      )
      .join("");

    // Stage
    const canvas = $("#slideCanvas");
    canvas.className = `slide-canvas theme-${cur.theme || "chalk"} layout-${cur.layout || "content"}`;
    $("#slideTitleInput").value = cur.title || "";
    $("#slideBodyInput").value = cur.body || "";
    $("#slideCol2Input").value = cur.col2 || "";
    $("#slideCol2Input").hidden = cur.layout !== "two-col";
    $("#slideNotesInput").value = cur.notes || "";
    $("#slideThemeSelect").value = cur.theme || "chalk";
    $("#slideLayoutSelect").value = cur.layout || "content";
    $("#slideNumBadge").textContent = `${state.slideIdx + 1} / ${state.slides.length}`;

    const slot = $("#slideImgSlot");
    if (cur.img) {
      slot.hidden = false;
      $("#slideImgPreview").src = cur.img;
    } else {
      slot.hidden = true;
    }
  }

  function loadSlides(slides, title) {
    state.slides = slides;
    state.slideIdx = 0;
    if (title) {
      state.title = title;
      $("#officeDocTitle").value = title;
    }
    save();
    renderSlides();
    switchTab("slides");
  }

  function exportSlidesPptx() {
    if (window.PptxGenJS) {
      const pptx = new window.PptxGenJS();
      pptx.layout = "LAYOUT_16x9";
      const themeMap = {
        chalk: { bg: "143B2C", title: "FFFFFF", text: "E8F5EE" },
        paper: { bg: "F6FAF8", title: "146C43", text: "13251D" },
        navy: { bg: "112240", title: "FFFFFF", text: "E2E8F0" },
        warm: { bg: "FEF3C7", title: "B45309", text: "451A03" }
      };
      state.slides.forEach((s, idx) => {
        const sl = pptx.addSlide();
        const t = themeMap[s.theme] || themeMap.chalk;
        sl.background = { color: t.bg };
        const isCover = s.layout === "title";
        sl.addText(s.title || `Slide ${idx + 1}`, {
          x: 0.6,
          y: isCover ? 1.6 : 0.45,
          w: 8.8,
          h: 1.0,
          fontSize: isCover ? 34 : 26,
          bold: true,
          color: t.title,
          align: isCover ? "center" : "left"
        });
        const bodyW = s.layout === "two-col" ? 4.2 : s.img ? 5.2 : 8.8;
        sl.addText(s.body || "", {
          x: 0.6,
          y: isCover ? 2.8 : 1.55,
          w: bodyW,
          h: 3.4,
          fontSize: 17,
          color: t.text,
          valign: "top",
          align: isCover ? "center" : "left"
        });
        if (s.layout === "two-col" && s.col2) {
          sl.addText(s.col2, {
            x: 5.1,
            y: 1.55,
            w: 4.3,
            h: 3.4,
            fontSize: 17,
            color: t.text,
            valign: "top"
          });
        }
        if (s.img) {
          sl.addImage({ data: s.img, x: 6.0, y: 1.55, w: 3.4, h: 3.1 });
        }
        if (s.notes) sl.addNotes(s.notes);
      });
      pptx.writeFile({ fileName: safeFilename("pptx") });
      notifyFn("Đã tải Bài trình chiếu PowerPoint (.pptx)");
    } else {
      downloadBlob(
        new Blob([JSON.stringify(state.slides, null, 2)], { type: "application/json" }),
        safeFilename("slides.json")
      );
      notifyFn("Đã tải file bài trình chiếu (.json)");
    }
  }

  let presIdx = 0;
  function renderPresenter() {
    const s = state.slides[presIdx];
    if (!s) return;
    const stage = $("#presenterStage");
    stage.className = `presenter-stage theme-${s.theme || "chalk"} layout-${s.layout || "content"}`;
    stage.innerHTML = `
      <div>
        <h1>${(s.title || "").replace(/</g, "&lt;")}</h1>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <div class="pres-body" style="flex:1;">${(s.body || "").replace(/</g, "&lt;")}</div>
          ${s.layout === "two-col" && s.col2 ? `<div class="pres-body" style="flex:1;">${s.col2.replace(/</g, "&lt;")}</div>` : ""}
          ${s.img ? `<img src="${s.img}" style="max-width:38%;border-radius:10px;max-height:55vh;object-fit:contain;" />` : ""}
        </div>
      </div>
      <div class="slide-footer-mark"><span>Lớp Nhẹ Pro · Bài giảng điện tử</span><span>${presIdx + 1} / ${state.slides.length}</span></div>
    `;
    $("#presCounter").textContent = `${presIdx + 1} / ${state.slides.length}`;
  }

  function initSlides() {
    renderSlides();

    $("#slidesRail").addEventListener("click", (e) => {
      const th = e.target.closest(".slide-thumb");
      if (!th) return;
      state.slideIdx = Number(th.dataset.sidx);
      renderSlides();
    });

    const syncCur = () => {
      const cur = state.slides[state.slideIdx];
      if (!cur) return;
      cur.title = $("#slideTitleInput").value;
      cur.body = $("#slideBodyInput").value;
      cur.col2 = $("#slideCol2Input").value;
      cur.notes = $("#slideNotesInput").value;
      cur.theme = $("#slideThemeSelect").value;
      cur.layout = $("#slideLayoutSelect").value;
      save();
      renderSlides();
    };

    ["#slideTitleInput", "#slideBodyInput", "#slideCol2Input", "#slideNotesInput"].forEach((sel) => {
      $(sel).addEventListener("input", () => {
        const cur = state.slides[state.slideIdx];
        if (!cur) return;
        cur.title = $("#slideTitleInput").value;
        cur.body = $("#slideBodyInput").value;
        cur.col2 = $("#slideCol2Input").value;
        cur.notes = $("#slideNotesInput").value;
        save();
        const th = $(`.slide-thumb[data-sidx="${state.slideIdx}"] strong`);
        if (th) th.textContent = cur.title || `Slide ${state.slideIdx + 1}`;
      });
    });

    $("#slideThemeSelect").addEventListener("change", syncCur);
    $("#slideLayoutSelect").addEventListener("change", syncCur);

    $("#btnSlideAdd").addEventListener("click", () => {
      const cur = state.slides[state.slideIdx] || {};
      state.slides.splice(state.slideIdx + 1, 0, {
        title: `Slide ${state.slides.length + 1}`,
        body: "• Ý chính 1\n• Ý chính 2",
        col2: "",
        layout: "content",
        theme: cur.theme || "chalk",
        notes: ""
      });
      state.slideIdx++;
      save();
      renderSlides();
    });

    $("#btnSlideDup").addEventListener("click", () => {
      const copy = JSON.parse(JSON.stringify(state.slides[state.slideIdx]));
      state.slides.splice(state.slideIdx + 1, 0, copy);
      state.slideIdx++;
      save();
      renderSlides();
    });

    $("#btnSlideDel").addEventListener("click", () => {
      if (state.slides.length <= 1) return notifyFn("Cần giữ lại ít nhất 1 slide");
      state.slides.splice(state.slideIdx, 1);
      state.slideIdx = Math.max(0, state.slideIdx - 1);
      save();
      renderSlides();
    });

    $("#btnSlideImg").addEventListener("click", () => $("#slideImgInput").click());
    $("#slideImgInput").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        state.slides[state.slideIdx].img = r.result;
        save();
        renderSlides();
      };
      r.readAsDataURL(f);
      e.target.value = "";
    });

    $("#btnRemoveSlideImg").addEventListener("click", () => {
      delete state.slides[state.slideIdx].img;
      save();
      renderSlides();
    });

    $("#btnSlidesUpload").addEventListener("click", () => $("#slidesUploadInput").click());
    $("#slidesUploadInput").addEventListener("change", async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const arr = JSON.parse(await f.text());
        if (Array.isArray(arr) && arr.length) {
          loadSlides(arr, f.name.replace(/\.json$/i, ""));
          notifyFn("Đã mở bộ slide");
        }
      } catch {
        notifyFn("File slide .json không hợp lệ");
      }
      e.target.value = "";
    });

    $("#btnSlidesPresent").addEventListener("click", () => {
      presIdx = state.slideIdx;
      $("#presenterOverlay").hidden = false;
      renderPresenter();
    });
    $("#presPrev").addEventListener("click", () => {
      presIdx = Math.max(0, presIdx - 1);
      renderPresenter();
    });
    $("#presNext").addEventListener("click", () => {
      presIdx = Math.min(state.slides.length - 1, presIdx + 1);
      renderPresenter();
    });
    $("#presExit").addEventListener("click", () => ($("#presenterOverlay").hidden = true));

    document.addEventListener("keydown", (e) => {
      if ($("#presenterOverlay").hidden) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        presIdx = Math.min(state.slides.length - 1, presIdx + 1);
        renderPresenter();
      } else if (e.key === "ArrowLeft") {
        presIdx = Math.max(0, presIdx - 1);
        renderPresenter();
      } else if (e.key === "Escape") {
        $("#presenterOverlay").hidden = true;
      }
    });

    $("#btnSlidesDownloadPptx").addEventListener("click", exportSlidesPptx);
  }

  function init({ notify, getClassContext }) {
    notifyFn = notify;
    getClassContextFn = getClassContext;
    load();
    $("#officeDocTitle").value = state.title || "Tai-lieu-Lop-Nhe";
    $("#officeDocTitle").addEventListener("input", (e) => {
      state.title = e.target.value;
      save();
    });

    $$(".office-tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.office)));
    initWord();
    initSheet();
    initSlides();
    switchTab(state.activeTab || "word");
  }

  return {
    init,
    switchTab,
    openInWord,
    loadSheetData: (aoa, title) => {
      loadSheetArray(aoa, true, title);
      switchTab("sheet");
    },
    loadSlides,
    importWordFile,
    importSheetFile,
    exportWordDoc,
    exportSheetXlsx,
    exportSlidesPptx,
    getState: () => state,
    setState: (s) => {
      if (!s) return;
      state = Object.assign(state, s);
      save();
      $("#wordEditor").innerHTML = state.wordHtml || "";
      updateWordStats();
      renderSheet();
      renderSlides();
    }
  };
})();
