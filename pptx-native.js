/* Native Zero-Dependency PowerPoint (.pptx) Generator — ECMA-376 OpenXML
 * Tạo file .pptx chuẩn 16:9 mở trực tiếp trên Microsoft PowerPoint, Google Slides, WPS & LibreOffice.
 * Không phụ thuộc CDN ngoài, chạy tức thì 100% kể cả offline. */
window.PptxNative = (() => {
  const te = new TextEncoder();

  // CRC-32 table (IEEE 802.3)
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c >>> 0;
  }

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

    for (const entry of entries) {
      const nameBytes = te.encode(entry.name);
      const dataBytes = entry.data instanceof Uint8Array ? entry.data : te.encode(String(entry.data));
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      // Local file header (30 bytes + name)
      const lh = new ArrayBuffer(30 + nameBytes.length);
      const lv = new DataView(lh);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);       // version needed
      lv.setUint16(6, 0x0800, true);   // UTF-8 flag
      lv.setUint16(8, 0, true);        // STORE (no compression)
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      new Uint8Array(lh, 30).set(nameBytes);

      localParts.push(new Uint8Array(lh), dataBytes);

      // Central directory header (46 bytes + name)
      const ch = new ArrayBuffer(46 + nameBytes.length);
      const cv = new DataView(ch);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);       // version made by
      cv.setUint16(6, 20, true);       // version needed
      cv.setUint16(8, 0x0800, true);   // UTF-8 flag
      cv.setUint16(10, 0, true);       // STORE
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      new Uint8Array(ch, 46).set(nameBytes);

      centralParts.push(new Uint8Array(ch));
      offset += 30 + nameBytes.length + size;
    }

    const centralOffset = offset;
    let centralSize = 0;
    for (const p of centralParts) centralSize += p.length;

    // End of Central Directory (22 bytes)
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    ev.setUint16(20, 0, true);

    const totalSize = centralOffset + centralSize + 22;
    const out = new Uint8Array(totalSize);
    let pos = 0;
    for (const p of localParts) { out.set(p, pos); pos += p.length; }
    for (const p of centralParts) { out.set(p, pos); pos += p.length; }
    out.set(new Uint8Array(eocd), pos);
    return out;
  }

  function xmlEsc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function dataUrlToBytes(dataUrl) {
    const m = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i.exec(dataUrl || "");
    if (!m) return null;
    const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { ext, bytes };
  }

  const THEMES = {
    emerald: { bg: "0F3D36", accent: "14B8A6", title: "FFFFFF", text: "E6F6F3", muted: "99D5CC" },
    chalk:   { bg: "143B2C", accent: "F59E0B", title: "FFFFFF", text: "EAF6EF", muted: "A7D3BD" },
    paper:   { bg: "FAFBF9", accent: "0F766E", title: "0F4C45", text: "1F2937", muted: "64748B" },
    navy:    { bg: "0F172A", accent: "38BDF8", title: "FFFFFF", text: "E2E8F0", muted: "94A3B8" },
    warm:    { bg: "FFFBEB", accent: "D97706", title: "92400E", text: "451A03", muted: "B45309" },
    plum:    { bg: "2E1065", accent: "F472B6", title: "FFFFFF", text: "F3E8FF", muted: "C4B5FD" }
  };

  function makeParagraphsXml(text, { sizePt = 18, bold = false, color = "FFFFFF", align = "l" }) {
    const lines = String(text ?? "").split(/\r?\n/);
    const sz = Math.round(sizePt * 100);
    return lines
      .map((line) => {
        const clean = xmlEsc(line);
        return `<a:p><a:pPr algn="${align}" spcAft="60000"/><a:r><a:rPr lang="vi-VN" sz="${sz}" b="${bold ? "1" : "0"}" dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Calibri"/><a:cs typeface="Calibri"/></a:rPr><a:t>${clean}</a:t></a:r><a:endParaRPr lang="vi-VN" sz="${sz}"/></a:p>`;
      })
      .join("");
  }

  function makeTextBoxXml(id, name, { x, y, cx, cy, text, sizePt, bold, color, align = "l", valign = "t", fillHex }) {
    const fillXml = fillHex
      ? `<a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>`
      : `<a:noFill/>`;
    return `<p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="${xmlEsc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        ${fillXml}
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="${valign}" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>
        <a:lstStyle/>
        ${makeParagraphsXml(text, { sizePt, bold, color, align })}
      </p:txBody>
    </p:sp>`;
  }

  function makeRectXml(id, name, { x, y, cx, cy, fillHex }) {
    return `<p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="${xmlEsc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
    </p:sp>`;
  }

  function makeImageXml(id, name, rId, { x, y, cx, cy }) {
    return `<p:pic>
      <p:nvPicPr>
        <p:cNvPr id="${id}" name="${xmlEsc(name)}"/>
        <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
        <p:nvPr/>
      </p:nvPicPr>
      <p:blipFill>
        <a:blip r:embed="${rId}"/>
        <a:stretch><a:fillRect/></a:stretch>
      </p:blipFill>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
      </p:spPr>
    </p:pic>`;
  }

  function buildPptxBytes(slides, { footerText = "Trợ lý GVCN" } = {}) {
    const W = 9144000; // 10 in (16:9 widescreen 9144000 x 5143500 EMU)
    const H = 5143500; // 5.625 in
    const entries = [];
    const mediaExts = new Set();
    let mediaCount = 0;

    const slideOverrides = [];
    const notesOverrides = [];
    const presSlideIds = [];
    const presRels = [
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`
    ];

    slides.forEach((s, idx) => {
      const n = idx + 1;
      const theme = THEMES[s.theme] || THEMES.emerald;
      const isCover = s.layout === "title";
      const isTwoCol = s.layout === "two-col";
      const fontScale = Number(s.fontSize) || 18;
      const slideRels = [
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`
      ];

      let imgXml = "";
      if (s.img) {
        const parsed = dataUrlToBytes(s.img);
        if (parsed) {
          mediaCount++;
          mediaExts.add(parsed.ext);
          const mediaFile = `image${mediaCount}.${parsed.ext}`;
          entries.push({ name: `ppt/media/${mediaFile}`, data: parsed.bytes });
          const imgRelId = `rIdImg${mediaCount}`;
          slideRels.push(
            `<Relationship Id="${imgRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaFile}"/>`
          );
          imgXml = makeImageXml(20, `Picture ${mediaCount}`, imgRelId, {
            x: 5600000, y: 1320000, cx: 3050000, cy: 3150000
          });
        }
      }

      if (s.notes && s.notes.trim()) {
        const noteRelId = "rIdNotes";
        slideRels.push(
          `<Relationship Id="${noteRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${n}.xml"/>`
        );
        notesOverrides.push(
          `<Override PartName="/ppt/notesSlides/notesSlide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`
        );
        entries.push({
          name: `ppt/notesSlides/notesSlide${n}.xml`,
          data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    ${makeTextBoxXml(2, "Notes", { x: 457200, y: 457200, cx: 6000000, cy: 4000000, text: s.notes, sizePt: 14, color: "111111" })}
  </p:spTree></p:cSld>
</p:notes>`
        });
        entries.push({
          name: `ppt/notesSlides/_rels/notesSlide${n}.xml.rels`,
          data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${n}.xml"/>
</Relationships>`
        });
      }

      const shapes = [];
      // Decorative top accent bar
      shapes.push(makeRectXml(2, "AccentBar", { x: 0, y: 0, cx: W, cy: 95000, fillHex: theme.accent }));

      // Title
      shapes.push(
        makeTextBoxXml(3, "Title", {
          x: 520000,
          y: isCover ? 1280000 : 320000,
          cx: 8100000,
          cy: isCover ? 1100000 : 820000,
          text: s.title || `Slide ${n}`,
          sizePt: isCover ? 34 : 26,
          bold: true,
          color: theme.title,
          align: isCover ? "ctr" : "l",
          valign: isCover ? "b" : "ctr"
        })
      );

      // Subtle divider under title on content slides
      if (!isCover) {
        shapes.push(makeRectXml(4, "TitleDivider", { x: 520000, y: 1150000, cx: 1400000, cy: 36000, fillHex: theme.accent }));
      }

      // Body
      const bodyW = isTwoCol ? 3900000 : imgXml ? 4850000 : 8100000;
      shapes.push(
        makeTextBoxXml(5, "Body", {
          x: 520000,
          y: isCover ? 2550000 : 1340000,
          cx: bodyW,
          cy: isCover ? 1700000 : 3200000,
          text: s.body || "",
          sizePt: isCover ? 19 : fontScale,
          bold: false,
          color: theme.text,
          align: isCover ? "ctr" : "l",
          valign: "t"
        })
      );

      // Optional Column 2
      if (isTwoCol && s.col2) {
        shapes.push(
          makeTextBoxXml(6, "BodyCol2", {
            x: 4720000,
            y: 1340000,
            cx: 3900000,
            cy: 3200000,
            text: s.col2,
            sizePt: fontScale,
            bold: false,
            color: theme.text,
            align: "l",
            valign: "t"
          })
        );
      }

      if (imgXml) shapes.push(imgXml);

      // Footer
      shapes.push(
        makeTextBoxXml(10, "FooterLeft", {
          x: 520000, y: 4700000, cx: 5600000, cy: 300000,
          text: footerText, sizePt: 11, color: theme.muted, align: "l"
        })
      );
      shapes.push(
        makeTextBoxXml(11, "FooterNum", {
          x: 7200000, y: 4700000, cx: 1420000, cy: 300000,
          text: `${n} / ${slides.length}`, sizePt: 11, color: theme.muted, align: "r"
        })
      );

      const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${theme.bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapes.join("\n")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

      entries.push({ name: `ppt/slides/slide${n}.xml`, data: slideXml });
      entries.push({
        name: `ppt/slides/_rels/slide${n}.xml.rels`,
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRels.join("\n  ")}
</Relationships>`
      });

      const presRelId = `rId${n + 1}`;
      presRels.push(
        `<Relationship Id="${presRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${n}.xml"/>`
      );
      presSlideIds.push(`<p:sldId id="${255 + n}" r:id="${presRelId}"/>`);
      slideOverrides.push(
        `<Override PartName="/ppt/slides/slide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
      );
    });

    const imgDefaults = [...mediaExts]
      .map((ext) => `<Default Extension="${ext}" ContentType="image/${ext === "jpg" ? "jpeg" : ext}"/>`)
      .join("\n  ");

    entries.unshift(
      {
        name: "[Content_Types].xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imgDefaults}
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides.join("\n  ")}
  ${notesOverrides.join("\n  ")}
</Types>`
      },
      {
        name: "_rels/.rels",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
      },
      {
        name: "ppt/presentation.xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${presSlideIds.join("")}</p:sldIdLst>
  <p:sldSz cx="${W}" cy="${H}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
      },
      {
        name: "ppt/_rels/presentation.xml.rels",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels.join("\n  ")}
</Relationships>`
      },
      {
        name: "ppt/slideMasters/slideMaster1.xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`
      },
      {
        name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
      },
      {
        name: "ppt/slideLayouts/slideLayout1.xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`
      },
      {
        name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
      },
      {
        name: "ppt/theme/theme1.xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TroLyGVCN">
  <a:themeElements>
    <a:clrScheme name="TroLyGVCN">
      <a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="0F766E"/></a:dk2><a:lt2><a:srgbClr val="F3F4F6"/></a:lt2>
      <a:accent1><a:srgbClr val="0F766E"/></a:accent1><a:accent2><a:srgbClr val="D97706"/></a:accent2>
      <a:accent3><a:srgbClr val="2563EB"/></a:accent3><a:accent4><a:srgbClr val="16A34A"/></a:accent4>
      <a:accent5><a:srgbClr val="9333EA"/></a:accent5><a:accent6><a:srgbClr val="E11D48"/></a:accent6>
      <a:hlink><a:srgbClr val="0284C7"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="TroLyGVCN">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="TroLyGVCN">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`
      }
    );

    return buildZip(entries);
  }

  function download(slides, filename = "Bai-giang-Tro-ly-GVCN.pptx", opts = {}) {
    const bytes = buildPptxBytes(slides, opts);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return bytes.length;
  }

  return { buildPptxBytes, download, THEMES };
})();
