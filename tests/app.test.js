const test = require("node:test");
const assert = require("node:assert/strict");

const GvcnData = require("../data.js");
const OfficeIO = require("../office-io.js");
const OfficeSuite = require("../office.js");

function makeSheet(cellMap) {
  const cells = {};
  for (const [k, v] of Object.entries(cellMap)) {
    cells[k] = { v };
  }
  return { name: "Test", rows: 20, cols: 10, cells, selected: { r: 0, c: 0 } };
}

/* ==========================================================================
 * 1. SECURITY & CODE INJECTION (FORMULA ENGINE)
 * ========================================================================== */
test("Formula Security: blocks JS injection payloads without executing code", () => {
  globalThis.__xss_triggered = false;
  const payloads = [
    "=alert(1)",
    '=Function("globalThis.__xss_triggered = true; return 1")()',
    "=window.location",
    '=constructor.constructor("return process")()',
    "=1; globalThis.__xss_triggered = true",
    '=eval("1+1")',
    "=process.exit(1)",
    '=IF(1=1, "OK", alert(1))',
    '=IF(1=2, Function("return 1")(), "SAFE")',
    "=1 + [1]"
  ];

  const sheet = makeSheet({});
  for (const expr of payloads) {
    const res = OfficeSuite.evaluateFormula(expr, sheet);
    assert.equal(res, "#ERROR!", `Expected #ERROR! for payload: ${expr}, got ${res}`);
  }
  assert.equal(globalThis.__xss_triggered, false);
  delete globalThis.__xss_triggered;
});

test("Formula Security: detects circular references and returns #LOOP!", () => {
  const sheet = makeSheet({
    "0,0": "=B1+1",
    "0,1": "=A1+1"
  });
  assert.equal(OfficeSuite.evalCell(sheet, 0, 0), "#LOOP!");
  assert.equal(OfficeSuite.evalCell(sheet, 0, 1), "#LOOP!");
});

/* ==========================================================================
 * 2. FORMULA LOGIC & NESTED FUNCTIONS
 * ========================================================================== */
test("Formula Logic: arithmetic operators, precedence, unary, parentheses & div-by-zero", () => {
  const sheet = makeSheet({});
  assert.equal(OfficeSuite.evaluateFormula("=2+3*4", sheet), 14);
  assert.equal(OfficeSuite.evaluateFormula("=(2+3)*4", sheet), 20);
  assert.equal(OfficeSuite.evaluateFormula("=2^3", sheet), 8);
  assert.equal(OfficeSuite.evaluateFormula("=10%3", sheet), 1);
  assert.equal(OfficeSuite.evaluateFormula("=-5+12", sheet), 7);
  assert.equal(OfficeSuite.evaluateFormula("=10/4", sheet), 2.5);
  assert.equal(OfficeSuite.evaluateFormula("=10/3", sheet), 3.33);
  assert.equal(OfficeSuite.evaluateFormula("=10/0", sheet), "#VALUE!");
  assert.equal(OfficeSuite.evaluateFormula("=10%0", sheet), "#VALUE!");
});

test("Formula Logic: SUM, AVERAGE, AVG, MIN, MAX, COUNT with ranges and mixed cells", () => {
  const sheet = makeSheet({
    "0,0": 8,       // A1
    "1,0": 9.5,     // A2
    "2,0": 6.5,     // A3
    "3,0": "Vắng",  // A4 (non-numeric text ignored in range aggregates)
    "4,0": 10,      // A5
    "0,1": 4        // B1
  });

  assert.equal(OfficeSuite.evaluateFormula("=SUM(A1:A5)", sheet), 34);
  assert.equal(OfficeSuite.evaluateFormula("=AVERAGE(A1:A5)", sheet), 8.5);
  assert.equal(OfficeSuite.evaluateFormula("=AVG(A1:A5)", sheet), 8.5);
  assert.equal(OfficeSuite.evaluateFormula("=MIN(A1:A5)", sheet), 6.5);
  assert.equal(OfficeSuite.evaluateFormula("=MAX(A1:A5)", sheet), 10);
  assert.equal(OfficeSuite.evaluateFormula("=COUNT(A1:A5)", sheet), 4);
  assert.equal(OfficeSuite.evaluateFormula("=SUM(A1:A3, B1, 6)", sheet), 34);
  assert.equal(OfficeSuite.evaluateFormula("=$A$1 + $B$1", sheet), 12);
});

test("Formula Logic: IF with =, <>, >=, <=, string comparison, and nested functions", () => {
  const sheet = makeSheet({
    "0,0": 5,         // A1
    "1,0": 6,         // A2
    "2,0": 4,         // A3
    "3,0": 5,         // A4
    "4,0": 2,         // A5 (SUM A1:A5 = 22)
    "0,1": "T",       // B1
    "1,1": 8.5,       // B2
    "2,1": 6.0,       // B3
    "3,1": 3.5        // B4
  });

  assert.equal(OfficeSuite.evaluateFormula('=IF(A1=5, "Đúng", "Sai")', sheet), "Đúng");
  assert.equal(OfficeSuite.evaluateFormula('=IF(A1<>5, "Khác", "Bằng")', sheet), "Bằng");
  assert.equal(OfficeSuite.evaluateFormula('=IF(B1="T", "Hoàn thành tốt", "Khác")', sheet), "Hoàn thành tốt");
  assert.equal(OfficeSuite.evaluateFormula('=IF(B1<>"C", "Đạt yêu cầu", "Cần rèn thêm")', sheet), "Đạt yêu cầu");
  assert.equal(OfficeSuite.evaluateFormula('=IF(SUM(A1:A5)>=20, "Đạt", "Chưa đạt")', sheet), "Đạt");
  assert.equal(OfficeSuite.evaluateFormula('=IF(SUM(A1:A3)>=20, "Đạt", "Chưa đạt")', sheet), "Chưa đạt");

  // Nested IF (TT27 classification)
  assert.equal(OfficeSuite.evaluateFormula('=IF(B2>=8, "T", IF(B2>=5, "H", "C"))', sheet), "T");
  assert.equal(OfficeSuite.evaluateFormula('=IF(B3>=8, "T", IF(B3>=5, "H", "C"))', sheet), "H");
  assert.equal(OfficeSuite.evaluateFormula('=IF(B4>=8, "T", IF(B4>=5, "H", "C"))', sheet), "C");
});

/* ==========================================================================
 * 3. HTML SANITIZER & SAFE IMAGE URL VALIDATOR
 * ========================================================================== */
test("Sanitizer: strips dangerous tags, inline event handlers, and javascript:/vbscript: URLs", () => {
  const dirty = [
    '<p onclick="alert(1)">Xin chào <b>thầy cô</b></p>',
    "<script>alert('xss')</script>",
    "<scr<script>ipt>alert(2)</script>",
    '<svg onload="alert(3)"><script>bad()</script></svg>',
    '<iframe src="https://evil.example"></iframe>',
    '<object data="evil.swf"></object>',
    '<embed src="evil.swf">',
    '<form action="https://evil.example"><input /></form>',
    '<img src="https://example.com/ok.png" onerror="alert(4)" />',
    '<img src="javascript:alert(5)" />',
    '<img src="data:image/svg+xml;base64,PHN2Zy8+" />',
    '<a href="javascript:alert(6)" onmouseover="alert(7)">Bad link</a>',
    '<a href="&#106;avascript:alert(8)">Encoded bad link</a>',
    '<a href="vbscript:msgbox(1)">VB link</a>',
    '<a href="https://lop-nhe.vercel.app" target="_blank">Good link</a>'
  ].join("");

  const clean = OfficeIO.sanitizeHtml(dirty);

  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /<svg/i);
  assert.doesNotMatch(clean, /<iframe/i);
  assert.doesNotMatch(clean, /<object/i);
  assert.doesNotMatch(clean, /<embed/i);
  assert.doesNotMatch(clean, /<form/i);
  assert.doesNotMatch(clean, /\bon[a-z]+\s*=/i);
  assert.doesNotMatch(clean, /javascript:/i);
  assert.doesNotMatch(clean, /vbscript:/i);
  assert.doesNotMatch(clean, /image\/svg\+xml/i);

  assert.match(clean, /<p>Xin chào <b>thầy cô<\/b><\/p>/i);
  assert.match(clean, /<img[^>]+src="https:\/\/example\.com\/ok\.png"/i);
  assert.match(clean, /<a[^>]+href="https:\/\/lop-nhe\.vercel\.app"/i);
  assert.match(clean, /rel="noopener noreferrer"/i);
});

test("Sanitizer: preserves safe formatting tags and validates image URLs strictly", () => {
  const safeHtml =
    '<h2 style="text-align:center;color:#0f3d36">KẾ HOẠCH</h2>' +
    '<p><i>Ghi chú</i> và <b>điểm nổi bật</b></p>' +
    '<table><tbody><tr><td colspan="2">Họ tên</td></tr></tbody></table>';
  const out = OfficeIO.sanitizeHtml(safeHtml);
  assert.match(out, /<h2 style="text-align:center;color:#0f3d36">KẾ HOẠCH<\/h2>/i);
  assert.match(out, /<i>Ghi chú<\/i>/i);
  assert.match(out, /<b>điểm nổi bật<\/b>/i);
  assert.match(out, /<table><tbody><tr><td colspan="2">Họ tên<\/td><\/tr><\/tbody><\/table>/i);

  // Dangerous CSS stripped
  const badCss = OfficeIO.sanitizeHtml('<p style="background:url(javascript:alert(1));color:red">Hi</p>');
  assert.doesNotMatch(badCss, /javascript:/i);
  assert.doesNotMatch(badCss, /url\(/i);

  // Image URL validator
  assert.equal(OfficeIO.isSafeImageUrl("https://example.com/photo.jpg"), true);
  assert.equal(OfficeIO.isSafeImageUrl("http://example.com/photo.png"), true);
  assert.equal(OfficeIO.isSafeImageUrl("data:image/png;base64,iVBORw0KGgo="), true);
  assert.equal(OfficeIO.isSafeImageUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg=="), true);
  assert.equal(OfficeIO.isSafeImageUrl("data:image/webp;base64,UklGRh4="), true);
  assert.equal(OfficeIO.isSafeImageUrl("data:image/svg+xml;base64,PHN2Zy8+"), false);
  assert.equal(OfficeIO.isSafeImageUrl("data:text/html;base64,PHNjcmlwdD4="), false);
  assert.equal(OfficeIO.isSafeImageUrl("javascript:alert(1)"), false);
  assert.equal(OfficeIO.isSafeImageUrl(""), false);
});

/* ==========================================================================
 * 4. TT27 GRADING VALIDATION
 * ========================================================================== */
test("TT27 Grading: classifies valid 0..10 scores and rejects invalid inputs", () => {
  assert.equal(GvcnData.getTT27Level(10), "T");
  assert.equal(GvcnData.getTT27Level(9), "T");
  assert.equal(GvcnData.getTT27Level(8), "T");
  assert.equal(GvcnData.getTT27Level("8.5"), "T");
  assert.equal(GvcnData.getTT27Level(7.9), "H");
  assert.equal(GvcnData.getTT27Level(5), "H");
  assert.equal(GvcnData.getTT27Level("5"), "H");
  assert.equal(GvcnData.getTT27Level(4.9), "C");
  assert.equal(GvcnData.getTT27Level(4), "C");
  assert.equal(GvcnData.getTT27Level(0), "C");
  assert.equal(GvcnData.getTT27Level("0"), "C");

  // Invalid scores must return ""
  const invalids = [-1, -0.1, 10.1, 11, 999, "", "   ", "abc", "8a", null, undefined, NaN, Infinity, -Infinity, true, false, {}];
  for (const val of invalids) {
    assert.equal(GvcnData.getTT27Level(val), "", `Expected "" for invalid score: ${String(val)}`);
  }
});

/* ==========================================================================
 * 5. SHEET NAME DEDUPLICATION & LOCALSTORAGE QUOTA PROTECTION
 * ========================================================================== */
test("Sheet Deduplication: resolves duplicates, illegal chars, case-insensitivity & 31-char Excel limit", () => {
  assert.deepEqual(
    OfficeSuite.makeUniqueSheetNames(["Bảng điểm", "Bảng điểm", "Bảng điểm"]),
    ["Bảng điểm", "Bảng điểm_1", "Bảng điểm_2"]
  );

  assert.deepEqual(
    OfficeSuite.makeUniqueSheetNames(["Toan", "toan", "TOAN_1", "toan"]),
    ["Toan", "toan_1", "TOAN_1_1", "toan_2"]
  );

  // Illegal Excel chars stripped and empty name falls back to SheetN
  assert.deepEqual(
    OfficeSuite.makeUniqueSheetNames(["Điểm:Toán/HK1?*[]\\", "///???", ""]),
    ["ĐiểmToánHK1", "Sheet2", "Sheet3"]
  );

  // Max 31 chars enforced even with suffixes
  const longName = "Danh_sach_hoc_sinh_lop_3A_nam_hoc_2026_2027";
  const res = OfficeSuite.makeUniqueSheetNames([longName, longName, longName]);
  assert.equal(res.length, 3);
  assert.equal(new Set(res.map((s) => s.toLowerCase())).size, 3);
  for (const name of res) {
    assert.ok(name.length <= 31, `Sheet name exceeded 31 chars: ${name} (${name.length})`);
  }
  assert.ok(res[1].endsWith("_1"));
  assert.ok(res[2].endsWith("_2"));
});

test("Storage Quota Protection: preserves full Word HTML & Slide image on QuotaExceededError", () => {
  const bigHtml = "<p>" + "A".repeat(250000) + "</p>";
  const validImg = "data:image/png;base64," + "A".repeat(70000);

  const origLS = globalThis.localStorage;
  let savedAttempted = 0;
  globalThis.localStorage = {
    setItem() {
      savedAttempted++;
      const err = new Error("Storage quota exceeded");
      err.name = "QuotaExceededError";
      throw err;
    },
    getItem() {
      return null;
    }
  };

  try {
    OfficeSuite.setState({
      wordDocs: [{ id: "w1", title: "Doc lớn", html: bigHtml }],
      slides: [{ title: "Slide ảnh lớn", body: "Nội dung", img: validImg }]
    });
    const ok = OfficeSuite.save();
    assert.equal(ok, false);
    assert.ok(savedAttempted >= 1);

    // Must NOT silently truncate HTML or strip slide image in memory
    const st = OfficeSuite.getState();
    assert.equal(st.wordDocs[0].html.length, bigHtml.length);
    assert.equal(st.slides[0].img, validImg);
  } finally {
    if (origLS === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = origLS;
  }
});

test("HTML Escaping & setState Sanitization: escapes &, <, >, quotes and scrubs unsafe restored state", () => {
  assert.equal(
    OfficeSuite.escHtml('A & B <script>"hi" \'ok\''),
    "A &amp; B &lt;script&gt;&quot;hi&quot; &#39;ok&#39;"
  );

  OfficeSuite.setState({
    wordDocs: [{ id: "w_sec", title: "Test", html: '<p onclick="evil()">An toàn</p><script>bad()</script>' }],
    slides: [
      { title: "S1", body: "B1", img: "javascript:alert(1)" },
      { title: "S2", body: "B2", img: "data:image/svg+xml;base64,PHN2Zy8+" },
      { title: "S3", body: "B3", img: "data:image/png;base64,iVBORw0KGgo=" }
    ]
  });

  const st = OfficeSuite.getState();
  assert.doesNotMatch(st.wordDocs[0].html, /<script|onclick/i);
  assert.match(st.wordDocs[0].html, /<p>An toàn<\/p>/i);
  assert.equal(st.slides[0].img, undefined);
  assert.equal(st.slides[1].img, undefined);
  assert.equal(st.slides[2].img, "data:image/png;base64,iVBORw0KGgo=");
});

test("Static Guard: no blocking native prompt()/confirm()/alert() or eval()/Function() in app code", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const appDir = path.resolve(__dirname, "..");
  const appJsFiles = fs.readdirSync(appDir).filter((f) => f.endsWith(".js"));
  assert.ok(appJsFiles.includes("dialog.js"), "dialog.js must exist");
  for (const file of appJsFiles) {
    const rawCode = fs.readFileSync(path.join(appDir, file), "utf8");
    const code = rawCode.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    assert.doesNotMatch(code, /(?<!function\s)(?<![.\w])(?:window\.)?(prompt|confirm|alert)\s*\(/, `Found blocking dialog in ${file}`);
    assert.doesNotMatch(code, /\beval\s*\(|\bFunction\s*\(/, `Found eval/Function in ${file}`);
  }
});
