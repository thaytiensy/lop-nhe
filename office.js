/* Bộ Office Văn Phòng Tích Hợp — Trợ lý GVCN (Word đa tài liệu · Excel đa sheet + phím mũi tên · PowerPoint .pptx gốc 100% thành công) */
const OfficeSuite = (() => {
  const OFFICE_KEY = "tro-ly-gvcn-office-v3";
  const QUOTA_ERR_MSG = "Bộ nhớ trình duyệt đã đầy. Vui lòng xuất tệp Sao lưu (JSON) về máy hoặc xóa bớt tệp Office cũ.";
  const $ = (s) => (typeof document !== "undefined" ? document.querySelector(s) : null);
  const $$ = (s) => (typeof document !== "undefined" ? [...document.querySelectorAll(s)] : []);

  let state = {
    activeTab: "word",
    title: "Tai-lieu-Tro-ly-GVCN",
    wordDocs: [],
    activeWordId: "",
    sheets: [],
    activeSheetIdx: 0,
    slides: [],
    slideIdx: 0
  };

  let notifyFn = () => {};
  let lastQuotaWarnAt = 0;
  let getCtxFn = () => ({
    profile: typeof window !== "undefined" && window.GvcnData ? window.GvcnData.DEFAULT_PROFILE : {},
    cls: { name: "3A", students: [], attendance: {}, grades: [] }
  });

  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getOfficeIO() {
    if (typeof window !== "undefined" && window.OfficeIO) return window.OfficeIO;
    if (typeof globalThis !== "undefined" && globalThis.OfficeIO) return globalThis.OfficeIO;
    if (typeof require === "function") {
      try { return require("./office-io.js"); } catch {}
    }
    return null;
  }

  function sanitizeHtml(html) {
    const io = getOfficeIO();
    if (io && typeof io.sanitizeHtml === "function") return io.sanitizeHtml(html);
    return escHtml(html);
  }

  function isSafeImageUrl(url) {
    const io = getOfficeIO();
    if (io && typeof io.isSafeImageUrl === "function") return io.isSafeImageUrl(url);
    if (typeof url !== "string") return false;
    const trimmed = url.trim();
    return /^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\r\n]+$/i.test(trimmed);
  }

  function isQuotaError(err) {
    if (!err) return false;
    return err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22 || err.code === 1014;
  }

  function save() {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(OFFICE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error("OfficeSuite.save() localStorage error:", err);
      const now = Date.now();
      if (now - lastQuotaWarnAt > 2500) {
        lastQuotaWarnAt = now;
        notifyFn(isQuotaError(err) ? QUOTA_ERR_MSG : "Không thể lưu dữ liệu Office vào trình duyệt. Vui lòng xuất tệp Sao lưu (JSON).");
      }
      return false;
    }
  }

  function makeSheetObj(name, aoa) {
    const safeAoa = Array.isArray(aoa) && aoa.length ? aoa : [[""]];
    const maxR = Math.min(safeAoa.length, 500);
    const rows = Math.max(15, Math.min(520, maxR + 5));
    let maxCols = 6;
    for (let r = 0; r < maxR; r++) {
      if (Array.isArray(safeAoa[r]) && safeAoa[r].length > maxCols) maxCols = safeAoa[r].length;
    }
    const cols = Math.max(8, Math.min(40, maxCols + 2));
    const cells = {};
    for (let r = 0; r < maxR; r++) {
      const row = safeAoa[r] || [];
      const colLimit = Math.min(row.length, cols);
      for (let c = 0; c < colLimit; c++) {
        const val = row[c];
        if (val !== "" && val !== null && val !== undefined) {
          cells[`${r},${c}`] = { v: val, bold: r === 0, bg: r === 0 ? "#e6f5f3" : "" };
        }
      }
    }
    return { name: String(name || "Sheet 1"), rows, cols, cells, selected: { r: 0, c: 0 } };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(OFFICE_KEY) || "null");
      if (saved && Array.isArray(saved.wordDocs)) state = Object.assign(state, saved);
    } catch {}
    const { profile, cls } = getCtxFn();
    if (!state.wordDocs?.length) {
      const id = "w1";
      state.wordDocs = [{ id, title: "Kế hoạch bài dạy 2345", html: window.GvcnData.WORD_TEMPLATES.khbd(profile, cls) }];
      state.activeWordId = id;
    }
    if (!state.sheets?.length) {
      state.sheets = [
        makeSheetObj("Quỹ lớp", window.GvcnData.SHEET_TEMPLATES.fund),
        makeSheetObj("Thời khóa biểu", window.GvcnData.SHEET_TEMPLATES.schedule)
      ];
      state.activeSheetIdx = 0;
    }
    if (!state.slides?.length) {
      state.slides = window.GvcnData.buildSlidesFromLesson(window.GvcnData.LESSON_PRESETS.toan3, profile, cls.name);
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
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function safeFilename(ext) {
    const base = ($("#officeDocTitle")?.value || state.title || "Tro-ly-GVCN")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-");
    return `${base || "Tro-ly-GVCN"}.${ext}`;
  }

  function getCurWord() {
    return state.wordDocs.find((d) => d.id === state.activeWordId) || state.wordDocs[0];
  }

  function getCurSheet() {
    return state.sheets[state.activeSheetIdx] || state.sheets[0];
  }

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

  function renderWordDocBar() {
    const sel = $("#wordDocSelect");
    if (!sel) return;
    sel.innerHTML = state.wordDocs
      .map((d) => `<option value="${escHtml(d.id)}" ${d.id === state.activeWordId ? "selected" : ""}>${escHtml(d.title)}</option>`)
      .join("");
    const cur = getCurWord();
    if (cur) {
      $("#wordEditor").innerHTML = sanitizeHtml(cur.html || "");
      updateWordStats();
    }
  }

  function openInWord(html, title) {
    const cleanTitle = title || "Văn bản mới";
    const id = `w${Date.now()}`;
    state.wordDocs.push({ id, title: cleanTitle, html: sanitizeHtml(html || "") });
    state.activeWordId = id;
    state.title = cleanTitle;
    if ($("#officeDocTitle")) $("#officeDocTitle").value = cleanTitle;
    renderWordDocBar();
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
    const baseName = file.name.replace(/\.[^.]+$/, "");
    try {
      const buf = await file.arrayBuffer();
      if (window.OfficeIO?.parseWord) {
        const { html, warning } = await window.OfficeIO.parseWord(buf, file.name);
        openInWord(html || "<p>(Tệp trống)</p>", baseName);
        notifyFn(warning || `Đã mở tài liệu Word: ${file.name}`);
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "docx" && window.mammoth) {
        const res = await window.mammoth.convertToHtml({ arrayBuffer: buf });
        openInWord(sanitizeHtml(res.value) || "<p>(Tệp trống)</p>", baseName);
        notifyFn(`Đã mở file Word: ${file.name}`);
        return;
      }
      const text = await file.text();
      const html = (ext === "html" || ext === "htm")
        ? sanitizeHtml(text)
        : text.split(/\r?\n/).map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;") || "&nbsp;"}</p>`).join("");
      openInWord(html, baseName);
      notifyFn(`Đã mở văn bản: ${file.name}`);
    } catch (err) {
      console.error("importWordFile error:", err);
      notifyFn(err?.message || `Không đọc được tệp Word: ${file.name}`);
    }
  }

  function initWord() {
    renderWordDocBar();
    const ed = $("#wordEditor");

    ed.addEventListener("input", () => {
      const cur = getCurWord();
      if (cur) cur.html = ed.innerHTML;
      updateWordStats();
      save();
    });

    $("#wordDocSelect").addEventListener("change", (e) => {
      state.activeWordId = e.target.value;
      const cur = getCurWord();
      if (cur) $("#officeDocTitle").value = cur.title;
      renderWordDocBar();
      save();
    });

    $("#btnWordNewDoc").addEventListener("click", async () => {
      const name = await window.AppDialog.prompt({
        title: "Tạo tài liệu Word mới",
        label: "Tên tài liệu *",
        defaultValue: `Văn bản ${state.wordDocs.length + 1}`,
        required: true,
        maxLength: 80,
        confirmText: "Tạo mới"
      });
      if (!name || !name.trim()) return;
      openInWord(`<p></p>`, name.trim());
      notifyFn(`Đã tạo tài liệu "${name.trim()}"`);
    });

    $("#btnWordDelDoc").addEventListener("click", () => {
      if (state.wordDocs.length <= 1) return notifyFn("Cần giữ ít nhất 1 tài liệu");
      state.wordDocs = state.wordDocs.filter((d) => d.id !== state.activeWordId);
      state.activeWordId = state.wordDocs[0].id;
      renderWordDocBar();
      save();
      notifyFn("Đã xóa tài liệu");
    });

    $("#btnWordInsertHeader").addEventListener("click", () => {
      const { profile, cls } = getCtxFn();
      const hdr = window.GvcnData.makeOfficialHeader(profile, cls.name);
      ed.innerHTML = hdr + ed.innerHTML;
      const cur = getCurWord();
      if (cur) cur.html = ed.innerHTML;
      updateWordStats();
      save();
      notifyFn("Đã chèn Quốc hiệu & thông tin Trường/Lớp");
    });

    $$(".ribbon [data-cmd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ed.focus();
        document.execCommand(btn.dataset.cmd, false, null);
        const cur = getCurWord();
        if (cur) cur.html = ed.innerHTML;
        save();
      });
    });

    $("#wordBlock").addEventListener("change", (e) => {
      ed.focus();
      document.execCommand("formatBlock", false, `<${e.target.value}>`);
    });
    $("#wordFont").addEventListener("change", (e) => { ed.focus(); document.execCommand("fontName", false, e.target.value); });
    $("#wordSize").addEventListener("change", (e) => { ed.focus(); document.execCommand("fontSize", false, e.target.value); });
    $("#wordForeColor").addEventListener("input", (e) => { ed.focus(); document.execCommand("foreColor", false, e.target.value); });
    $("#wordBackColor").addEventListener("input", (e) => { ed.focus(); document.execCommand("hiliteColor", false, e.target.value); });

    $("#btnWordTable").addEventListener("click", () => {
      ed.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<table border="1" style="width:100%;border-collapse:collapse;"><tr><th>Cột 1</th><th>Cột 2</th><th>Cột 3</th></tr><tr><td>Nội dung</td><td>Nội dung</td><td>Nội dung</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table><p></p>`
      );
      const cur = getCurWord();
      if (cur) cur.html = ed.innerHTML;
      save();
    });

    $("#btnWordImage").addEventListener("click", () => $("#wordImageInput").click());
    $("#wordImageInput").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        ed.focus();
        if (!isSafeImageUrl(r.result)) { notifyFn("Định dạng ảnh không hợp lệ (chỉ hỗ trợ PNG, JPG, GIF, WEBP)"); return; }
        document.execCommand("insertHTML", false, `<p><img src="${escHtml(r.result)}" alt="ảnh"/></p>`);
        const cur = getCurWord();
        if (cur) cur.html = ed.innerHTML;
        save();
      };
      r.readAsDataURL(f);
      e.target.value = "";
    });

    $("#wordTemplateSelect").addEventListener("change", (e) => {
      const key = e.target.value;
      if (!key) return;
      const fn = window.GvcnData.WORD_TEMPLATES[key];
      if (fn) {
        const { profile, cls } = getCtxFn();
        const label = e.target.options[e.target.selectedIndex].text;
        openInWord(fn(profile, cls), `${label} - Lớp ${cls.name}`);
        notifyFn(`Đã nạp mẫu "${label}" (tự điền Trường & Lớp)`);
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
    let s = "", n = c;
    while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
    return s;
  }

  function parseRef(ref) {
    const m = /^\$?([A-Z]+)\$?(\d+)$/i.exec(ref.trim());
    if (!m) return null;
    const letters = m[1].toUpperCase();
    let col = 0;
    for (let i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
    return { r: parseInt(m[2], 10) - 1, c: col - 1 };
  }

  /* ===================== SAFE FORMULA PARSER & EVALUATOR (ZERO EVAL/FUNCTION) ===================== */
  const ALLOWED_FORMULA_FUNCS = new Set(["SUM", "AVERAGE", "AVG", "MIN", "MAX", "COUNT", "IF"]);
  const FORMULA_ERROR_CODES = new Set(["#ERROR!", "#VALUE!", "#LOOP!"]);

  class FormulaEvalError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  }

  function isFormulaErrorVal(v) {
    return typeof v === "string" && FORMULA_ERROR_CODES.has(v);
  }

  function tokenizeFormula(input) {
    const tokens = [];
    let i = 0;
    const len = input.length;
    while (i < len) {
      const ch = input[i];
      if (/\s/.test(ch)) { i++; continue; }

      if (ch === '"') {
        let str = "";
        i++;
        let closed = false;
        while (i < len) {
          if (input[i] === '"') {
            if (input[i + 1] === '"') { str += '"'; i += 2; continue; }
            i++;
            closed = true;
            break;
          }
          str += input[i++];
        }
        if (!closed) throw new FormulaEvalError("#ERROR!");
        tokens.push({ type: "STRING", value: str });
        continue;
      }

      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[i + 1] || ""))) {
        let numStr = "";
        let dots = 0;
        while (i < len && (/[0-9]/.test(input[i]) || input[i] === ".")) {
          if (input[i] === ".") {
            dots++;
            if (dots > 1) throw new FormulaEvalError("#ERROR!");
          }
          numStr += input[i++];
        }
        if (i < len && /[A-Za-z_]/.test(input[i])) {
          throw new FormulaEvalError("#ERROR!");
        }
        const n = Number(numStr);
        if (!Number.isFinite(n)) throw new FormulaEvalError("#VALUE!");
        tokens.push({ type: "NUMBER", value: n });
        continue;
      }

      const two = input.slice(i, i + 2);
      if (two === "<>" || two === "!=" || two === ">=" || two === "<=") {
        tokens.push({ type: "OP", value: two });
        i += 2;
        continue;
      }

      if ("+-*/%^=<>".includes(ch)) {
        tokens.push({ type: "OP", value: ch });
        i++;
        continue;
      }
      if (ch === "(") { tokens.push({ type: "LPAREN", value: ch }); i++; continue; }
      if (ch === ")") { tokens.push({ type: "RPAREN", value: ch }); i++; continue; }
      if (ch === ",") { tokens.push({ type: "COMMA", value: ch }); i++; continue; }
      if (ch === ":") { tokens.push({ type: "COLON", value: ch }); i++; continue; }

      if (ch === "$" || /[A-Za-z_]/.test(ch)) {
        const rest = input.slice(i);
        const cellMatch = /^(\$?[A-Za-z]+\$?\d+)(?![A-Za-z0-9_])/.exec(rest);
        if (cellMatch) {
          tokens.push({ type: "CELL", value: cellMatch[1].toUpperCase() });
          i += cellMatch[1].length;
          continue;
        }
        const idMatch = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(rest);
        if (idMatch) {
          tokens.push({ type: "IDENT", value: idMatch[1].toUpperCase() });
          i += idMatch[1].length;
          continue;
        }
      }

      throw new FormulaEvalError("#ERROR!");
    }
    tokens.push({ type: "EOF", value: "" });
    return tokens;
  }

  function parseFormulaAst(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseComparison() {
      let left = parseAddSub();
      while (peek().type === "OP" && ["=", "<>", "!=", "<", "<=", ">", ">="].includes(peek().value)) {
        const op = next().value;
        const right = parseAddSub();
        left = { type: "BINARY", op, left, right };
      }
      return left;
    }

    function parseAddSub() {
      let left = parseMulDiv();
      while (peek().type === "OP" && (peek().value === "+" || peek().value === "-")) {
        const op = next().value;
        const right = parseMulDiv();
        left = { type: "BINARY", op, left, right };
      }
      return left;
    }

    function parseMulDiv() {
      let left = parsePower();
      while (peek().type === "OP" && (peek().value === "*" || peek().value === "/" || peek().value === "%")) {
        const op = next().value;
        const right = parsePower();
        left = { type: "BINARY", op, left, right };
      }
      return left;
    }

    function parsePower() {
      let left = parseUnary();
      if (peek().type === "OP" && peek().value === "^") {
        next();
        const right = parsePower();
        return { type: "BINARY", op: "^", left, right };
      }
      return left;
    }

    function parseUnary() {
      if (peek().type === "OP" && (peek().value === "+" || peek().value === "-")) {
        const op = next().value;
        return { type: "UNARY", op, arg: parseUnary() };
      }
      return parsePrimary();
    }

    function parsePrimary() {
      const tok = peek();
      if (tok.type === "NUMBER") { next(); return { type: "NUMBER", value: tok.value }; }
      if (tok.type === "STRING") { next(); return { type: "STRING", value: tok.value }; }
      if (tok.type === "LPAREN") {
        next();
        const expr = parseComparison();
        if (peek().type !== "RPAREN") throw new FormulaEvalError("#ERROR!");
        next();
        return expr;
      }
      if (tok.type === "CELL") {
        next();
        if (peek().type === "COLON") {
          next();
          if (peek().type !== "CELL") throw new FormulaEvalError("#ERROR!");
          const endTok = next();
          return { type: "RANGE", start: tok.value, end: endTok.value };
        }
        return { type: "CELL", ref: tok.value };
      }
      if (tok.type === "IDENT") {
        next();
        if (peek().type === "LPAREN") {
          if (!ALLOWED_FORMULA_FUNCS.has(tok.value)) throw new FormulaEvalError("#ERROR!");
          next();
          const args = [];
          if (peek().type !== "RPAREN") {
            args.push(parseComparison());
            while (peek().type === "COMMA") {
              next();
              args.push(parseComparison());
            }
          }
          if (peek().type !== "RPAREN") throw new FormulaEvalError("#ERROR!");
          next();
          if (tok.value === "IF" && (args.length < 2 || args.length > 3)) throw new FormulaEvalError("#ERROR!");
          if (tok.value !== "IF" && args.length < 1) throw new FormulaEvalError("#ERROR!");
          return { type: "CALL", name: tok.value, args };
        }
        if (tok.value === "TRUE") return { type: "BOOL", value: true };
        if (tok.value === "FALSE") return { type: "BOOL", value: false };
        throw new FormulaEvalError("#ERROR!");
      }
      throw new FormulaEvalError("#ERROR!");
    }

    const ast = parseComparison();
    if (peek().type !== "EOF") throw new FormulaEvalError("#ERROR!");
    return ast;
  }

  function toFormulaNumber(val) {
    if (isFormulaErrorVal(val)) throw new FormulaEvalError(val);
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "boolean") return val ? 1 : 0;
    if (typeof val === "number") {
      if (!Number.isFinite(val)) throw new FormulaEvalError("#VALUE!");
      return val;
    }
    const s = String(val).trim();
    if (s === "") return 0;
    const n = Number(s);
    if (!Number.isFinite(n)) throw new FormulaEvalError("#VALUE!");
    return n;
  }

  function tryAsNumber(val) {
    if (typeof val === "number" && Number.isFinite(val)) return { ok: true, num: val };
    if (typeof val === "string" && val.trim() !== "") {
      const n = Number(val.trim());
      if (Number.isFinite(n)) return { ok: true, num: n };
    }
    return { ok: false, num: NaN };
  }

  function compareFormulaVals(op, left, right) {
    if (isFormulaErrorVal(left)) throw new FormulaEvalError(left);
    if (isFormulaErrorVal(right)) throw new FormulaEvalError(right);
    const ln = tryAsNumber(left);
    const rn = tryAsNumber(right);

    if (op === "=" || op === "<>" || op === "!=") {
      let eq;
      if (typeof left === "boolean" && typeof right === "boolean") {
        eq = left === right;
      } else if (ln.ok && rn.ok) {
        eq = Math.abs(ln.num - rn.num) < 1e-12;
      } else {
        eq = String(left ?? "").toLowerCase() === String(right ?? "").toLowerCase();
      }
      return op === "=" ? eq : !eq;
    }

    let cmp;
    if (ln.ok && rn.ok) {
      cmp = ln.num - rn.num;
    } else if (left === "" && rn.ok) {
      cmp = 0 - rn.num;
    } else if (ln.ok && right === "") {
      cmp = ln.num - 0;
    } else if (typeof left === "string" && typeof right === "string") {
      cmp = left.toLowerCase().localeCompare(right.toLowerCase());
    } else {
      throw new FormulaEvalError("#VALUE!");
    }
    if (op === "<") return cmp < 0;
    if (op === "<=") return cmp <= 0;
    if (op === ">") return cmp > 0;
    if (op === ">=") return cmp >= 0;
    throw new FormulaEvalError("#ERROR!");
  }

  function evalFormulaAst(node, sheet, depth, visiting) {
    switch (node.type) {
      case "NUMBER":
      case "STRING":
      case "BOOL":
        return node.value;
      case "RANGE":
        throw new FormulaEvalError("#VALUE!");
      case "CELL": {
        const p = parseRef(node.ref);
        if (!p) throw new FormulaEvalError("#ERROR!");
        const val = evalCell(sheet, p.r, p.c, depth + 1, visiting);
        if (isFormulaErrorVal(val)) throw new FormulaEvalError(val);
        return val;
      }
      case "UNARY": {
        const v = toFormulaNumber(evalFormulaAst(node.arg, sheet, depth, visiting));
        return node.op === "-" ? -v : +v;
      }
      case "BINARY": {
        const left = evalFormulaAst(node.left, sheet, depth, visiting);
        const right = evalFormulaAst(node.right, sheet, depth, visiting);
        if (["=", "<>", "!=", "<", "<=", ">", ">="].includes(node.op)) {
          return compareFormulaVals(node.op, left, right);
        }
        const a = toFormulaNumber(left);
        const b = toFormulaNumber(right);
        if (node.op === "+") return a + b;
        if (node.op === "-") return a - b;
        if (node.op === "*") return a * b;
        if (node.op === "/") {
          if (b === 0) throw new FormulaEvalError("#VALUE!");
          return a / b;
        }
        if (node.op === "%") {
          if (b === 0) throw new FormulaEvalError("#VALUE!");
          return a % b;
        }
        if (node.op === "^") {
          const res = Math.pow(a, b);
          if (!Number.isFinite(res)) throw new FormulaEvalError("#VALUE!");
          return res;
        }
        throw new FormulaEvalError("#ERROR!");
      }
      case "CALL": {
        if (node.name === "IF") {
          const condVal = evalFormulaAst(node.args[0], sheet, depth, visiting);
          if (isFormulaErrorVal(condVal)) throw new FormulaEvalError(condVal);
          let truthy;
          if (typeof condVal === "boolean") truthy = condVal;
          else if (typeof condVal === "number") truthy = condVal !== 0;
          else if (typeof condVal === "string") {
            const trimmed = condVal.trim().toUpperCase();
            if (trimmed === "TRUE") truthy = true;
            else if (trimmed === "FALSE" || trimmed === "") truthy = false;
            else {
              const n = Number(trimmed);
              if (!Number.isFinite(n)) throw new FormulaEvalError("#VALUE!");
              truthy = n !== 0;
            }
          } else {
            truthy = Boolean(condVal);
          }
          if (truthy) return evalFormulaAst(node.args[1], sheet, depth, visiting);
          return node.args.length >= 3 ? evalFormulaAst(node.args[2], sheet, depth, visiting) : false;
        }

        const nums = [];
        for (const arg of node.args) {
          if (arg.type === "RANGE") {
            const p1 = parseRef(arg.start);
            const p2 = parseRef(arg.end);
            if (!p1 || !p2) throw new FormulaEvalError("#ERROR!");
            const rMin = Math.min(p1.r, p2.r), rMax = Math.max(p1.r, p2.r);
            const cMin = Math.min(p1.c, p2.c), cMax = Math.max(p1.c, p2.c);
            for (let rr = rMin; rr <= rMax; rr++) {
              for (let cc = cMin; cc <= cMax; cc++) {
                const v = evalCell(sheet, rr, cc, depth + 1, visiting);
                if (isFormulaErrorVal(v)) throw new FormulaEvalError(v);
                const parsed = tryAsNumber(v);
                if (parsed.ok) nums.push(parsed.num);
              }
            }
          } else {
            const v = evalFormulaAst(arg, sheet, depth, visiting);
            if (isFormulaErrorVal(v)) throw new FormulaEvalError(v);
            const parsed = tryAsNumber(v);
            if (parsed.ok) nums.push(parsed.num);
          }
        }
        if (!nums.length) return 0;
        if (node.name === "SUM") return nums.reduce((a, b) => a + b, 0);
        if (node.name === "AVERAGE" || node.name === "AVG") return nums.reduce((a, b) => a + b, 0) / nums.length;
        if (node.name === "MIN") return Math.min(...nums);
        if (node.name === "MAX") return Math.max(...nums);
        if (node.name === "COUNT") return nums.length;
        throw new FormulaEvalError("#ERROR!");
      }
      default:
        throw new FormulaEvalError("#ERROR!");
    }
  }

  function evaluateFormula(formulaStr, sheet = { cells: {} }, depth = 0, visiting = new Set()) {
    const expr = String(formulaStr ?? "").replace(/^=/, "").trim();
    if (!expr) return "";
    try {
      const tokens = tokenizeFormula(expr);
      const ast = parseFormulaAst(tokens);
      const out = evalFormulaAst(ast, sheet, depth, visiting);
      if (typeof out === "number") {
        if (!Number.isFinite(out)) return "#VALUE!";
        return Number.isInteger(out) ? out : Number(out.toFixed(2));
      }
      return out;
    } catch (err) {
      if (err instanceof FormulaEvalError) return err.code;
      return "#ERROR!";
    }
  }

  function evalCell(sheet, r, c, depth = 0, visiting = null) {
    if (depth > 25) return "#LOOP!";
    const key = r + "," + c;
    const seen = visiting ? new Set(visiting) : new Set();
    if (seen.has(key)) return "#LOOP!";
    seen.add(key);
    const raw = sheet?.cells?.[key]?.v ?? "";
    if (raw === "" || raw === null || raw === undefined) return "";
    const str = String(raw);
    if (!str.startsWith("=")) return raw;
    return evaluateFormula(str, sheet, depth, seen);
  }

  function renderSheetTabs() {
    const box = $("#sheetTabsList");
    if (!box) return;
    box.innerHTML = state.sheets
      .map((sh, i) => `<button type="button" class="sheet-tab-btn ${i === state.activeSheetIdx ? "active" : ""}" data-shidx="${i}">${sh.name.replace(/</g, "&lt;")}</button>`)
      .join("");
  }

  function renderSheet() {
    const sheet = getCurSheet();
    const tbl = $("#sheetTable");
    if (!sheet || !tbl) return;
    const { rows, cols, selected } = sheet;
    let html = `<thead><tr><th style="width:40px"></th>`;
    for (let c = 0; c < cols; c++) html += `<th>${colName(c)}</th>`;
    html += `</tr></thead><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr><td class="row-hdr">${r + 1}</td>`;
      for (let c = 0; c < cols; c++) {
        const cell = sheet.cells[`${r},${c}`] || {};
        const val = evalCell(sheet, r, c);
        const selCls = selected.r === r && selected.c === c ? "selected" : "";
        const style = [
          cell.bold ? "font-weight:700" : "",
          cell.align ? `text-align:${cell.align}` : typeof val === "number" ? "text-align:right" : "",
          cell.bg ? `background:${cell.bg};color:#111` : ""
        ].filter(Boolean).join(";");
        const display = typeof val === "number" && Math.abs(val) >= 1000 ? val.toLocaleString("vi-VN") : String(val ?? "");
        html += `<td class="${selCls}" data-r="${r}" data-c="${c}" style="${style}">${display.replace(/</g, "&lt;")}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody>`;
    tbl.innerHTML = html;
    $("#sheetCellRef").textContent = `${colName(selected.c)}${selected.r + 1}`;
    $("#sheetFormulaInput").value = sheet.cells[`${selected.r},${selected.c}`]?.v ?? "";
    renderSheetTabs();
  }

  function setCellValue(r, c, val) {
    const sheet = getCurSheet();
    const key = `${r},${c}`;
    const existing = sheet.cells[key] || {};
    const num = val !== "" && !String(val).startsWith("=") && !isNaN(Number(val)) ? Number(val) : val;
    if (num === "" && !existing.bold && !existing.bg) delete sheet.cells[key];
    else sheet.cells[key] = { ...existing, v: num };
    save();
    renderSheet();
  }

  function sheetToAoA(sheet) {
    const out = [];
    for (let r = 0; r < sheet.rows; r++) {
      const row = [];
      let hasData = false;
      for (let c = 0; c < sheet.cols; c++) {
        const v = evalCell(sheet, r, c);
        if (v !== "") hasData = true;
        row.push(v);
      }
      if (hasData) out.push(row);
    }
    return out;
  }

  function loadSheetData(aoa, sheetName, docTitle) {
    const obj = makeSheetObj(sheetName || `Sheet ${state.sheets.length + 1}`, aoa);
    state.sheets.push(obj);
    state.activeSheetIdx = state.sheets.length - 1;
    if (docTitle) {
      state.title = docTitle;
      if ($("#officeDocTitle")) $("#officeDocTitle").value = docTitle;
    }
    save();
    renderSheet();
    switchTab("sheet");
  }

  function makeUniqueSheetNames(sheets) {
    const MAX_LEN = 31;
    const usedLower = new Set();
    return (sheets || []).map((sh, i) => {
      const raw = typeof sh === "string" ? sh : sh?.name;
      const fallback = "Sheet" + (i + 1);
      let base = String(raw ?? "")
        .replace(/[\\/?*[\]:]/g, "")
        .replace(/^'+|'+$/g, "")
        .trim();
      if (!base) base = fallback;
      let candidate = base.slice(0, MAX_LEN);
      if (usedLower.has(candidate.toLowerCase())) {
        let idx = 1;
        while (true) {
          const suffix = "_" + idx;
          const trimmed = base.slice(0, Math.max(1, MAX_LEN - suffix.length));
          candidate = trimmed + suffix;
          if (!usedLower.has(candidate.toLowerCase())) break;
          idx++;
        }
      }
      usedLower.add(candidate.toLowerCase());
      return candidate;
    });
  }

  function exportSheetXlsx() {
    if (typeof window !== "undefined" && window.XLSX) {
      const wb = window.XLSX.utils.book_new();
      const uniqueNames = makeUniqueSheetNames(state.sheets);
      state.sheets.forEach((sh, i) => {
        const ws = window.XLSX.utils.aoa_to_sheet(sheetToAoA(sh));
        window.XLSX.utils.book_append_sheet(wb, ws, uniqueNames[i]);
      });
      window.XLSX.writeFile(wb, safeFilename("xlsx"));
      notifyFn("Đã tải bảng tính Excel (.xlsx)");
      return;
    }
    // Fallback Spreadsheet HTML (.xls) mở trực tiếp trong Microsoft Excel kể cả khi offline
    const aoa = sheetToAoA(getCurSheet());
    const rowsHtml = aoa.map((r) => `<tr>${r.map((v) => `<td>${escHtml(v)}</td>`).join("")}</tr>`).join("");
    const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${rowsHtml}</table></body></html>`;
    downloadBlob(new Blob(["\ufeff", xls], { type: "application/vnd.ms-excel;charset=utf-8" }), safeFilename("xls"));
    notifyFn("Đã tải bảng tính Excel (.xls)");
  }

  function exportSheetCsv() {
    const aoa = sheetToAoA(getCurSheet());
    const csv = aoa.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), safeFilename("csv"));
    notifyFn("Đã tải tệp CSV (.csv)");
  }

  async function importSheetFile(file) {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    try {
      const buf = await file.arrayBuffer();
      if (window.OfficeIO?.parseExcel) {
        const { sheets, warning } = await window.OfficeIO.parseExcel(buf, file.name);
        if (!sheets || !sheets.length) throw new Error("Không tìm thấy dữ liệu bảng tính trong tệp.");
        state.sheets = sheets.map((s) => makeSheetObj(s.name, s.aoa));
        state.activeSheetIdx = 0;
        state.title = baseName;
        if ($("#officeDocTitle")) $("#officeDocTitle").value = baseName;
        save();
        renderSheet();
        switchTab("sheet");
        notifyFn(warning || `Đã mở Excel: ${file.name} (${state.sheets.length} sheet)`);
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if ((ext === "xlsx" || ext === "xls") && window.XLSX) {
        const wb = window.XLSX.read(buf, { type: "array" });
        state.sheets = wb.SheetNames.map((n) => makeSheetObj(n, window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "" })));
        state.activeSheetIdx = 0;
        state.title = baseName;
        if ($("#officeDocTitle")) $("#officeDocTitle").value = baseName;
        save();
        renderSheet();
        switchTab("sheet");
        notifyFn(`Đã mở Excel: ${file.name} (${state.sheets.length} sheet)`);
        return;
      }
      const text = await file.text();
      const aoa = text.split(/\r?\n/).filter((l) => l.trim()).map((line) => line.split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, "").trim()));
      loadSheetData(aoa, baseName.slice(0, 22), baseName);
      notifyFn(`Đã mở bảng tính: ${file.name}`);
    } catch (err) {
      console.error("importSheetFile error:", err);
      notifyFn(err?.message || `Không đọc được tệp bảng tính: ${file.name}`);
    }
  }

  function startInlineEdit(td) {
    const sheet = getCurSheet();
    const r = Number(td.dataset.r), c = Number(td.dataset.c);
    const inp = document.createElement("input");
    inp.className = "cell-inline-edit";
    inp.value = sheet.cells[`${r},${c}`]?.v ?? "";
    td.innerHTML = "";
    td.appendChild(inp);
    inp.focus();
    inp.select();
    let done = false;
    const commit = (moveR = 0, moveC = 0) => {
      if (done) return;
      done = true;
      setCellValue(r, c, inp.value);
      sheet.selected = {
        r: Math.max(0, Math.min(sheet.rows - 1, r + moveR)),
        c: Math.max(0, Math.min(sheet.cols - 1, c + moveC))
      };
      renderSheet();
      $("#sheetWrap").focus();
    };
    inp.addEventListener("blur", () => commit(0, 0));
    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); commit(1, 0); }
      else if (ev.key === "Tab") { ev.preventDefault(); commit(0, ev.shiftKey ? -1 : 1); }
      else if (ev.key === "Escape") { done = true; renderSheet(); $("#sheetWrap").focus(); }
    });
  }

  function initSheet() {
    renderSheet();
    const tbl = $("#sheetTable");

    tbl.addEventListener("click", (e) => {
      const td = e.target.closest("td[data-r]");
      if (!td) return;
      const sheet = getCurSheet();
      sheet.selected = { r: Number(td.dataset.r), c: Number(td.dataset.c) };
      renderSheet();
      $("#sheetWrap").focus();
    });

    tbl.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td[data-r]");
      if (td) startInlineEdit(td);
    });

    $("#sheetWrap").addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      const sheet = getCurSheet();
      const { r, c } = sheet.selected;
      if (e.key === "ArrowDown") { e.preventDefault(); sheet.selected.r = Math.min(sheet.rows - 1, r + 1); renderSheet(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sheet.selected.r = Math.max(0, r - 1); renderSheet(); }
      else if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); sheet.selected.c = Math.min(sheet.cols - 1, c + 1); renderSheet(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); sheet.selected.c = Math.max(0, c - 1); renderSheet(); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); setCellValue(r, c, ""); }
      else if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault();
        const td = tbl.querySelector(`td[data-r="${r}"][data-c="${c}"]`);
        if (td) startInlineEdit(td);
      }
    });

    $("#sheetFormulaInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const sheet = getCurSheet();
        setCellValue(sheet.selected.r, sheet.selected.c, e.target.value);
      }
    });

    $("#sheetTabsList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-shidx]");
      if (!btn) return;
      state.activeSheetIdx = Number(btn.dataset.shidx);
      save();
      renderSheet();
    });

    $("#btnAddSheetTab").addEventListener("click", () => {
      state.sheets.push(makeSheetObj(`Sheet ${state.sheets.length + 1}`, [[""]]));
      state.activeSheetIdx = state.sheets.length - 1;
      save();
      renderSheet();
    });

    $("#btnRenameSheetTab").addEventListener("click", async () => {
      const sh = getCurSheet();
      const name = await window.AppDialog.prompt({
        title: "Đổi tên Sheet",
        label: "Tên Sheet mới (tối đa 31 ký tự) *",
        defaultValue: sh.name,
        required: true,
        maxLength: 31,
        confirmText: "Đổi tên"
      });
      if (name && name.trim()) {
        sh.name = name.trim();
        save();
        renderSheetTabs();
        notifyFn(`Đã đổi tên Sheet thành "${sh.name}"`);
      }
    });

    $("#btnSheetBold").addEventListener("click", () => {
      const sh = getCurSheet();
      const k = `${sh.selected.r},${sh.selected.c}`;
      sh.cells[k] = { ...(sh.cells[k] || { v: "" }), bold: !sh.cells[k]?.bold };
      save();
      renderSheet();
    });
    $("#btnSheetAlign").addEventListener("click", () => {
      const sh = getCurSheet();
      const k = `${sh.selected.r},${sh.selected.c}`;
      const order = ["left", "center", "right"];
      sh.cells[k] = { ...(sh.cells[k] || { v: "" }), align: order[(order.indexOf(sh.cells[k]?.align || "left") + 1) % 3] };
      save();
      renderSheet();
    });
    $("#sheetBgColor").addEventListener("input", (e) => {
      const sh = getCurSheet();
      const k = `${sh.selected.r},${sh.selected.c}`;
      sh.cells[k] = { ...(sh.cells[k] || { v: "" }), bg: e.target.value };
      save();
      renderSheet();
    });
    $("#btnSheetSum").addEventListener("click", () => {
      const sh = getCurSheet();
      const col = colName(sh.selected.c);
      setCellValue(sh.selected.r, sh.selected.c, `=SUM(${col}2:${col}${Math.max(2, sh.selected.r)})`);
    });
    $("#btnSheetAvg").addEventListener("click", () => {
      const sh = getCurSheet();
      const col = colName(sh.selected.c);
      setCellValue(sh.selected.r, sh.selected.c, `=AVERAGE(${col}2:${col}${Math.max(2, sh.selected.r)})`);
    });
    $("#btnSheetAddRow").addEventListener("click", () => { getCurSheet().rows += 5; save(); renderSheet(); });
    $("#btnSheetDelRow").addEventListener("click", () => {
      const sh = getCurSheet();
      if (sh.rows > 6) { sh.rows -= 1; save(); renderSheet(); }
    });
    $("#btnSheetAddCol").addEventListener("click", () => { getCurSheet().cols += 2; save(); renderSheet(); });

    $("#sheetTemplateSelect").addEventListener("change", (e) => {
      const v = e.target.value;
      if (!v) return;
      const { profile, cls } = getCtxFn();
      if (v === "sync-roster") {
        const rows = [
          [`DANH BẠ LỚP ${cls.name} — ${profile.school}`, "", "", "", ""],
          ["STT", "Họ và tên HS", "Tên Phụ huynh", "SĐT / Zalo PH", "Ghi chú"]
        ];
        cls.students.forEach((s, i) => rows.push([i + 1, s.name, s.parent || "", s.phone || "", s.note || ""]));
        loadSheetData(rows, `DS_${cls.name}`, `Danh-ba-Lop-${cls.name}`);
        notifyFn(`Đã đồng bộ Danh bạ lớp ${cls.name}`);
      } else if (v === "sync-grades") {
        const last = cls.grades?.[cls.grades.length - 1];
        const rows = [["STT", "Họ và tên", `Điểm ${last?.subject || ""}`, "Mức TT27", "Nhận xét học bạ"]];
        cls.students.forEach((s, i) => {
          const rec = last?.records?.[s.id] || {};
          rows.push([i + 1, s.name, rec.score ?? "", rec.level ?? "", rec.comment ?? ""]);
        });
        rows.push(["", "Điểm TB lớp", `=AVERAGE(C2:C${cls.students.length + 1})`, "", ""]);
        loadSheetData(rows, `Diem_${cls.name}`, `So-diem-${cls.name}`);
        notifyFn(`Đã đồng bộ Sổ điểm lớp ${cls.name}`);
      } else if (v === "sync-att") {
        const day = new Date().toISOString().slice(0, 10);
        const att = cls.attendance?.[day] || {};
        const labels = { present: "Có mặt", late: "Đi muộn", excused: "Vắng phép", absent: "Vắng KP" };
        const rows = [["STT", "Họ và tên", `Điểm danh (${day})`, "Ghi chú / Lý do"]];
        cls.students.forEach((s, i) => {
          const entry = att[s.id];
          const st = typeof entry === "string" ? entry : (entry?.status || "present");
          const note = typeof entry === "object" ? (entry?.note || "") : "";
          rows.push([i + 1, s.name, labels[st] || "Có mặt", note]);
        });
        loadSheetData(rows, `DD_${cls.name}`, `Diem-danh-${cls.name}`);
        notifyFn(`Đã đồng bộ Điểm danh lớp ${cls.name}`);
      } else if (v === "blank") {
        loadSheetData([[""]], `Sheet ${state.sheets.length + 1}`);
      } else if (window.GvcnData.SHEET_TEMPLATES[v]) {
        loadSheetData(window.GvcnData.SHEET_TEMPLATES[v], v === "fund" ? "Quỹ lớp" : "TKB");
        notifyFn("Đã nạp mẫu bảng tính");
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

  /* ===================== 3. POWERPOINT SLIDES ===================== */
  function getSlideFooter() {
    const { profile, cls } = getCtxFn();
    return `${profile.school} · Lớp ${cls.name} · Trợ lý GVCN`;
  }

  function renderSlides() {
    if (!state.slides.length) {
      state.slides = [{ title: "Slide mới", body: "", col2: "", layout: "content", theme: "emerald", fontSize: 18, notes: "" }];
    }
    state.slideIdx = Math.max(0, Math.min(state.slideIdx, state.slides.length - 1));
    const cur = state.slides[state.slideIdx];

    $("#slidesRail").innerHTML = state.slides
      .map(
        (s, i) => `<div class="slide-thumb theme-${s.theme || "emerald"} ${i === state.slideIdx ? "active" : ""}" data-sidx="${i}">
          <strong>${(s.title || "Slide " + (i + 1)).replace(/</g, "&lt;")}</strong>
          <span>#${i + 1}</span>
        </div>`
      )
      .join("");

    const canvas = $("#slideCanvas");
    canvas.className = `slide-canvas theme-${cur.theme || "emerald"} layout-${cur.layout || "content"}`;
    $("#slideTitleInput").value = cur.title || "";
    $("#slideBodyInput").value = cur.body || "";
    $("#slideBodyInput").style.fontSize = `${Number(cur.fontSize) || 18}px`;
    $("#slideCol2Input").value = cur.col2 || "";
    $("#slideCol2Input").style.fontSize = `${Number(cur.fontSize) || 18}px`;
    $("#slideCol2Input").hidden = cur.layout !== "two-col";
    $("#slideNotesInput").value = cur.notes || "";
    $("#slideThemeSelect").value = cur.theme || "emerald";
    $("#slideLayoutSelect").value = cur.layout || "content";
    $("#slideFontSizeSelect").value = String(cur.fontSize || 18);
    $("#slideFooterSchool").textContent = getSlideFooter();
    $("#slideNumBadge").textContent = `${state.slideIdx + 1} / ${state.slides.length}`;

    const slot = $("#slideImgSlot");
    if (cur.img && isSafeImageUrl(cur.img)) {
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
      if ($("#officeDocTitle")) $("#officeDocTitle").value = title;
    }
    save();
    renderSlides();
    switchTab("slides");
  }

  async function importSlidesFile(file) {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    try {
      const buf = await file.arrayBuffer();
      if (window.OfficeIO?.parseSlides) {
        const { slides, warning } = await window.OfficeIO.parseSlides(buf, file.name);
        loadSlides(slides, baseName);
        notifyFn(warning || `Đã mở PowerPoint: ${file.name} (${slides.length} slide — sẵn sàng sửa & trình chiếu)`);
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "pptx") {
        const slides = await window.PptxNative.parsePptx(buf, file.name);
        loadSlides(slides, baseName);
        notifyFn(`Đã mở PowerPoint: ${file.name} (${slides.length} slide — sẵn sàng sửa & trình chiếu)`);
        return;
      }
      if (ext === "json") {
        const arr = JSON.parse(await file.text());
        if (Array.isArray(arr) && arr.length) {
          loadSlides(arr, baseName);
          notifyFn(`Đã mở bộ slide (${arr.length} slide)`);
          return;
        }
      }
      notifyFn("Định dạng slide không hợp lệ (hỗ trợ .pptx, .ppt và .json)");
    } catch (err) {
      console.error("importSlidesFile error:", err);
      notifyFn(err?.message || "Không đọc được file PowerPoint này");
    }
  }

  function exportSlidesPptx() {
    try {
      const filename = safeFilename("pptx");
      const footerText = getSlideFooter();
      window.PptxNative.download(state.slides, filename, { footerText });
      notifyFn(`Đã tải file PowerPoint: ${filename}`);
    } catch (err) {
      console.error(err);
      notifyFn("Lỗi tạo .pptx — vui lòng thử tải bản .html");
    }
  }

  function exportSlidesHtml() {
    const footerText = getSlideFooter();
    const safeThemes = new Set(["emerald", "chalk", "paper", "navy", "warm", "plum"]);
    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${escHtml(safeFilename("html"))}</title><style>body{margin:0;background:#0b1210;font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;color:#fff}.s{width:min(94vw,1120px);aspect-ratio:16/9;border-radius:14px;padding:44px 56px;box-sizing:border-box;display:none;flex-direction:column;justify-content:space-between}.s.on{display:flex}.emerald{background:#0f3d36;color:#e6f6f3}.chalk{background:#143b2c;color:#eaf6ef}.paper{background:#fafbf9;color:#111}.navy{background:#0f172a;color:#f8fafc}.warm{background:#fffbeb;color:#451a03}.plum{background:#2e1065;color:#f5f3ff}h1{margin:0 0 18px;font-size:38px}.row{display:flex;gap:24px;align-items:flex-start}.b{flex:1;font-size:22px;line-height:1.6;white-space:pre-wrap}.img{max-width:38%;border-radius:10px;max-height:55vh;object-fit:contain}.f{display:flex;justify-content:space-between;font-size:13px;opacity:.75}.nav{position:fixed;bottom:18px;display:flex;gap:10px}button{padding:8px 16px;border-radius:999px;border:none;cursor:pointer;font-weight:700}</style></head><body>${state.slides
      .map((s, i) => {
        const theme = safeThemes.has(s.theme) ? s.theme : "emerald";
        const imgTag = s.img && isSafeImageUrl(s.img) ? `<img class="img" src="${escHtml(s.img)}" alt="" />` : "";
        const col2Tag = s.layout === "two-col" && s.col2 ? `<div class="b">${escHtml(s.col2)}</div>` : "";
        return `<section class="s ${theme} ${i === 0 ? "on" : ""}"><div><h1>${escHtml(s.title || "")}</h1><div class="row"><div class="b">${escHtml(s.body || "")}</div>${col2Tag}${imgTag}</div></div><div class="f"><span>${escHtml(footerText)}</span><span>${i + 1} / ${state.slides.length}</span></div></section>`;
      })
      .join("")}<div class="nav"><button onclick="go(-1)">← Trước</button><button onclick="go(1)">Tiếp →</button></div><script>let i=0,ss=[...document.querySelectorAll('.s')];function go(d){ss[i].classList.remove('on');i=Math.max(0,Math.min(ss.length-1,i+d));ss[i].classList.add('on')}document.onkeydown=e=>{if(e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowLeft')go(-1)}</script></body></html>`;
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), safeFilename("html"));
    notifyFn("Đã tải bài trình chiếu web (.html)");
  }

  let presIdx = 0;
  let showNotes = false;
  function renderPresenter() {
    const s = state.slides[presIdx];
    if (!s) return;
    const stage = $("#presenterStage");
    stage.className = `presenter-stage theme-${s.theme || "emerald"} layout-${s.layout || "content"}`;
    const safeImgHtml = s.img && isSafeImageUrl(s.img) ? `<img src="${escHtml(s.img)}" alt="" style="max-width:38%;border-radius:10px;max-height:55vh;object-fit:contain;" />` : "";
    stage.innerHTML = `
      <div class="slide-accent-bar"></div>
      <div>
        <h1>${escHtml(s.title || "")}</h1>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <div class="pres-body" style="flex:1;">${escHtml(s.body || "")}</div>
          ${s.layout === "two-col" && s.col2 ? `<div class="pres-body" style="flex:1;">${escHtml(s.col2)}</div>` : ""}
          ${safeImgHtml}
        </div>
      </div>
      <div class="slide-footer-mark"><span>${escHtml(getSlideFooter())}</span><span>${presIdx + 1} / ${state.slides.length}</span></div>
    `;
    $("#presCounter").textContent = `${presIdx + 1} / ${state.slides.length}`;
    const nBox = $("#presenterNotes");
    nBox.hidden = !showNotes;
    nBox.textContent = s.notes ? `Ghi chú GV: ${s.notes}` : "(Slide này không có ghi chú)";
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
      cur.fontSize = Number($("#slideFontSizeSelect").value) || 18;
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
    $("#slideFontSizeSelect").addEventListener("change", syncCur);

    $("#slideDeckTemplate").addEventListener("change", (e) => {
      const v = e.target.value;
      if (!v) return;
      const { profile, cls } = getCtxFn();
      if (v === "lesson") loadSlides(window.GvcnData.buildSlidesFromLesson(window.GvcnData.LESSON_PRESETS.toan3, profile, cls.name), `Bai-giang-Lop-${cls.name}`);
      else if (v === "meeting") loadSlides(window.GvcnData.buildMeetingSlides(profile, cls), `Hop-Phu-Huynh-Lop-${cls.name}`);
      else if (v === "weekly") loadSlides(window.GvcnData.buildWeeklySlides(profile, cls), `Sinh-hoat-Lop-${cls.name}`);
      notifyFn("Đã nạp bộ Slide mẫu tự điền Trường & Lớp");
      e.target.value = "";
    });

    $("#btnSlideAdd").addEventListener("click", () => {
      const cur = state.slides[state.slideIdx] || {};
      state.slides.splice(state.slideIdx + 1, 0, {
        title: `Slide ${state.slides.length + 1}`,
        body: "• Ý chính 1\n• Ý chính 2",
        col2: "",
        layout: "content",
        theme: cur.theme || "emerald",
        fontSize: 18,
        notes: ""
      });
      state.slideIdx++;
      save();
      renderSlides();
    });
    $("#btnSlideDup").addEventListener("click", () => {
      state.slides.splice(state.slideIdx + 1, 0, JSON.parse(JSON.stringify(state.slides[state.slideIdx])));
      state.slideIdx++;
      save();
      renderSlides();
    });
    $("#btnSlideUp").addEventListener("click", () => {
      if (state.slideIdx <= 0) return;
      const [item] = state.slides.splice(state.slideIdx, 1);
      state.slideIdx--;
      state.slides.splice(state.slideIdx, 0, item);
      save();
      renderSlides();
    });
    $("#btnSlideDown").addEventListener("click", () => {
      if (state.slideIdx >= state.slides.length - 1) return;
      const [item] = state.slides.splice(state.slideIdx, 1);
      state.slideIdx++;
      state.slides.splice(state.slideIdx, 0, item);
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
      r.onload = () => { if (!isSafeImageUrl(r.result)) { notifyFn("Định dạng ảnh không hợp lệ (chỉ hỗ trợ PNG, JPG, GIF, WEBP)"); return; } state.slides[state.slideIdx].img = r.result; save(); renderSlides(); };
      r.readAsDataURL(f);
      e.target.value = "";
    });
    $("#btnRemoveSlideImg").addEventListener("click", () => { delete state.slides[state.slideIdx].img; save(); renderSlides(); });

    $("#btnSlidesUpload").addEventListener("click", () => $("#slidesUploadInput").click());
    $("#slidesUploadInput").addEventListener("change", async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      await importSlidesFile(f);
      e.target.value = "";
    });

    $("#btnSlidesPresent").addEventListener("click", () => { presIdx = state.slideIdx; $("#presenterOverlay").hidden = false; renderPresenter(); });
    $("#presPrev").addEventListener("click", () => { presIdx = Math.max(0, presIdx - 1); renderPresenter(); });
    $("#presNext").addEventListener("click", () => { presIdx = Math.min(state.slides.length - 1, presIdx + 1); renderPresenter(); });
    $("#presToggleNotes").addEventListener("click", () => { showNotes = !showNotes; renderPresenter(); });
    $("#presExit").addEventListener("click", () => ($("#presenterOverlay").hidden = true));
    document.addEventListener("keydown", (e) => {
      if ($("#presenterOverlay").hidden) return;
      if (e.key === "ArrowRight" || e.key === " ") { presIdx = Math.min(state.slides.length - 1, presIdx + 1); renderPresenter(); }
      else if (e.key === "ArrowLeft") { presIdx = Math.max(0, presIdx - 1); renderPresenter(); }
      else if (e.key === "Escape") $("#presenterOverlay").hidden = true;
    });

    $("#btnSlidesDownloadPptx").addEventListener("click", exportSlidesPptx);
    $("#btnSlidesDownloadHtml").addEventListener("click", exportSlidesHtml);
  }

  function init({ notify, getContext }) {
    notifyFn = notify;
    getCtxFn = getContext;
    load();
    $("#officeDocTitle").value = state.title || "Tai-lieu-Tro-ly-GVCN";
    $("#officeDocTitle").addEventListener("input", (e) => { state.title = e.target.value; save(); });
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
    loadSheetData,
    loadSlides,
    importWordFile,
    importSheetFile,
    importSlidesFile,
    exportWordDoc,
    exportSheetXlsx,
    exportSlidesPptx,
    refreshFooter: renderSlides,
    evalCell,
    evaluateFormula,
    makeUniqueSheetNames,
    sanitizeHtml,
    isSafeImageUrl,
    escHtml,
    save,
    getState: () => state,
    setState: (s) => {
      if (!s || typeof s !== "object") return;
      state = Object.assign(state, s);
      if (Array.isArray(state.wordDocs)) {
        state.wordDocs = state.wordDocs.map((d) => ({ ...d, html: sanitizeHtml(d?.html || "") }));
      }
      if (Array.isArray(state.slides)) {
        state.slides = state.slides.map((sl) => {
          const next = { ...sl };
          if (next.img && !isSafeImageUrl(next.img)) delete next.img;
          return next;
        });
      }
      save();
      if (typeof document !== "undefined") {
        renderWordDocBar();
        renderSheet();
        renderSlides();
      }
    }
  };
})();
if (typeof window !== "undefined") window.OfficeSuite = OfficeSuite;
if (typeof module !== "undefined" && module.exports) module.exports = OfficeSuite;
