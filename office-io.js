/* OfficeIO — Bộ đọc tệp Office đa định dạng (Zero-Dependency, chạy trực tiếp trên trình duyệt)
 * Hỗ trợ:
 *  - Word: .docx (Native OpenXML + Mammoth), .doc (HTML / MHTML / WordML / nhị phân 97-2003), .rtf, .html, .md, .txt
 *  - Excel: .xlsx (SheetJS + Native OpenXML), .xls (BIFF8 + HTML Table + XML Spreadsheet 2003), .csv, .tsv
 *  - PowerPoint: .pptx (Native OpenXML hỗ trợ mọi trình tạo: MS PowerPoint, Google Slides, WPS, Canva, LibreOffice), .ppt (97-2003), .json
 *  - ZIP Engine: Hỗ trợ STORE + DEFLATE (DecompressionStream + Pure-JS RFC 1951 fallback), ZIP64, tra cứu không phân biệt hoa thường.
 */
window.OfficeIO = (() => {
  const tdUtf8 = new TextDecoder("utf-8", { fatal: false });
  const tdUtf16Le = new TextDecoder("utf-16le", { fatal: false });
  const tdUtf16Be = new TextDecoder("utf-16be", { fatal: false });

  /* ===================== 1. PURE-JS RFC 1951 DEFLATE INFLATE ===================== */
  function inflateRawJS(src) {
    let pos = 0;
    let bitBuf = 0;
    let bitCnt = 0;
    const out = [];

    function readBits(n) {
      while (bitCnt < n) {
        if (pos >= src.length) return bitBuf & ((1 << n) - 1);
        bitBuf |= src[pos++] << bitCnt;
        bitCnt += 8;
      }
      const v = bitBuf & ((1 << n) - 1);
      bitBuf >>>= n;
      bitCnt -= n;
      return v;
    }

    function alignByte() {
      bitBuf = 0;
      bitCnt = 0;
    }

    function buildTree(lengths) {
      let maxBits = 0;
      for (let i = 0; i < lengths.length; i++) if (lengths[i] > maxBits) maxBits = lengths[i];
      const blCount = new Uint16Array(maxBits + 1);
      for (let i = 0; i < lengths.length; i++) if (lengths[i]) blCount[lengths[i]]++;
      const nextCode = new Uint16Array(maxBits + 1);
      let code = 0;
      for (let bits = 1; bits <= maxBits; bits++) {
        code = (code + blCount[bits - 1]) << 1;
        nextCode[bits] = code;
      }
      const table = new Map();
      for (let n = 0; n < lengths.length; n++) {
        const len = lengths[n];
        if (len) {
          const c = nextCode[len]++;
          table.set((len << 16) | c, n);
        }
      }
      return { table, maxBits };
    }

    function decodeSym(tree) {
      let code = 0;
      for (let len = 1; len <= tree.maxBits; len++) {
        code = (code << 1) | readBits(1);
        const sym = tree.table.get((len << 16) | code);
        if (sym !== undefined) return sym;
      }
      throw new Error("Mã Huffman nén DEFLATE không hợp lệ");
    }

    const fixedLitLengths = new Uint8Array(288);
    fixedLitLengths.fill(8, 0, 144);
    fixedLitLengths.fill(9, 144, 256);
    fixedLitLengths.fill(7, 256, 280);
    fixedLitLengths.fill(8, 280, 288);
    const fixedLitTree = buildTree(fixedLitLengths);

    const fixedDistLengths = new Uint8Array(32);
    fixedDistLengths.fill(5);
    const fixedDistTree = buildTree(fixedDistLengths);

    const lenBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    const lenExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
    const distExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
    const clOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

    let bfinal = 0;
    while (!bfinal) {
      bfinal = readBits(1);
      const btype = readBits(2);
      if (btype === 0) {
        alignByte();
        if (pos + 4 > src.length) break;
        const len = src[pos] | (src[pos + 1] << 8);
        pos += 4;
        for (let i = 0; i < len && pos < src.length; i++) out.push(src[pos++]);
      } else if (btype === 1 || btype === 2) {
        let litTree = fixedLitTree;
        let distTree = fixedDistTree;
        if (btype === 2) {
          const hlit = readBits(5) + 257;
          const hdist = readBits(5) + 1;
          const hclen = readBits(4) + 4;
          const clLens = new Uint8Array(19);
          for (let i = 0; i < hclen; i++) clLens[clOrder[i]] = readBits(3);
          const clTree = buildTree(clLens);
          const total = hlit + hdist;
          const allLens = new Uint8Array(total);
          let idx = 0;
          while (idx < total) {
            const sym = decodeSym(clTree);
            if (sym < 16) {
              allLens[idx++] = sym;
            } else if (sym === 16) {
              const rep = readBits(2) + 3;
              const prev = idx > 0 ? allLens[idx - 1] : 0;
              for (let r = 0; r < rep && idx < total; r++) allLens[idx++] = prev;
            } else if (sym === 17) {
              const rep = readBits(3) + 3;
              idx = Math.min(total, idx + rep);
            } else if (sym === 18) {
              const rep = readBits(7) + 11;
              idx = Math.min(total, idx + rep);
            }
          }
          litTree = buildTree(allLens.subarray(0, hlit));
          distTree = buildTree(allLens.subarray(hlit));
        }

        while (true) {
          const sym = decodeSym(litTree);
          if (sym < 256) {
            out.push(sym);
          } else if (sym === 256) {
            break;
          } else {
            const lIdx = sym - 257;
            const length = lenBase[lIdx] + (lenExtra[lIdx] ? readBits(lenExtra[lIdx]) : 0);
            const dIdx = decodeSym(distTree);
            const dist = distBase[dIdx] + (distExtra[dIdx] ? readBits(distExtra[dIdx]) : 0);
            const start = out.length - dist;
            for (let i = 0; i < length; i++) out.push(out[start + i]);
          }
        }
      } else {
        throw new Error("Kiểu khối nén DEFLATE không hợp lệ");
      }
    }
    return new Uint8Array(out);
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "undefined") {
      try {
        const ds = new DecompressionStream("deflate-raw");
        const stream = new Blob([bytes]).stream().pipeThrough(ds);
        const ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
      } catch {
        // Fallback sang Pure-JS RFC 1951
      }
    }
    return inflateRawJS(bytes);
  }

  /* ===================== 2. ROBUST ZIP READER (ZIP64 + CASE-INSENSITIVE) ===================== */
  function readU64(dv, off) {
    const lo = dv.getUint32(off, true);
    const hi = dv.getUint32(off + 4, true);
    return hi * 4294967296 + lo;
  }

  function cleanZipKey(p) {
    return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
  }

  async function unzip(arrayBuffer) {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const minPos = Math.max(0, bytes.length - 65557);
    let eocdPos = -1;
    for (let i = bytes.length - 22; i >= minPos; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) {
        const commentLen = dv.getUint16(i + 20, true);
        if (i + 22 + commentLen <= bytes.length) {
          eocdPos = i;
          break;
        }
      }
    }

    const entries = new Map();
    const lowerIndex = new Map();
    const setEntry = (rawName, data) => {
      const k = cleanZipKey(rawName);
      if (!k || k.endsWith("/")) return;
      entries.set(k, data);
      lowerIndex.set(k.toLowerCase(), k);
    };

    if (eocdPos >= 0) {
      let totalEntries = dv.getUint16(eocdPos + 10, true);
      let cdOffset = dv.getUint32(eocdPos + 16, true);

      // ZIP64 Locator (PK\x06\x07) ngay trước EOCD
      if ((totalEntries === 0xffff || cdOffset === 0xffffffff) && eocdPos >= 20) {
        const locPos = eocdPos - 20;
        if (dv.getUint32(locPos, true) === 0x07064b50) {
          const z64Off = readU64(dv, locPos + 8);
          if (z64Off + 56 <= bytes.length && dv.getUint32(z64Off, true) === 0x06064b50) {
            totalEntries = readU64(dv, z64Off + 32);
            cdOffset = readU64(dv, z64Off + 48);
          }
        }
      }

      let ptr = cdOffset;
      for (let i = 0; i < totalEntries; i++) {
        if (ptr + 46 > bytes.length || dv.getUint32(ptr, true) !== 0x02014b50) break;
        const flags = dv.getUint16(ptr + 8, true);
        const method = dv.getUint16(ptr + 10, true);
        let compSize = dv.getUint32(ptr + 20, true);
        let uncompSize = dv.getUint32(ptr + 24, true);
        const nameLen = dv.getUint16(ptr + 28, true);
        const extraLen = dv.getUint16(ptr + 30, true);
        const commentLen = dv.getUint16(ptr + 32, true);
        let localOff = dv.getUint32(ptr + 42, true);

        const name = tdUtf8.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
        const extraStart = ptr + 46 + nameLen;
        const extraEnd = extraStart + extraLen;

        // Parse ZIP64 extra field (0x0001) nếu cần
        if (compSize === 0xffffffff || uncompSize === 0xffffffff || localOff === 0xffffffff) {
          let ep = extraStart;
          while (ep + 4 <= extraEnd) {
            const tag = dv.getUint16(ep, true);
            const sz = dv.getUint16(ep + 2, true);
            ep += 4;
            if (tag === 0x0001) {
              let zp = ep;
              if (uncompSize === 0xffffffff && zp + 8 <= ep + sz) { uncompSize = readU64(dv, zp); zp += 8; }
              if (compSize === 0xffffffff && zp + 8 <= ep + sz) { compSize = readU64(dv, zp); zp += 8; }
              if (localOff === 0xffffffff && zp + 8 <= ep + sz) { localOff = readU64(dv, zp); zp += 8; }
              break;
            }
            ep += sz;
          }
        }

        ptr = extraEnd + commentLen;
        if ((flags & 1) !== 0) continue; // Tệp bị mã hóa mật khẩu
        if (name.endsWith("/") || localOff + 30 > bytes.length) continue;
        if (dv.getUint32(localOff, true) !== 0x04034b50) continue;

        const lhNameLen = dv.getUint16(localOff + 26, true);
        const lhExtraLen = dv.getUint16(localOff + 28, true);
        const dataStart = localOff + 30 + lhNameLen + lhExtraLen;
        if (dataStart + compSize > bytes.length) continue;
        const rawSlice = bytes.subarray(dataStart, dataStart + compSize);

        if (method === 0) {
          setEntry(name, rawSlice);
        } else if (method === 8) {
          setEntry(name, await inflateRaw(rawSlice));
        }
      }
    } else {
      // Fallback: quét từ đầu theo Local File Header
      let ptr = 0;
      while (ptr + 30 <= bytes.length && dv.getUint32(ptr, true) === 0x04034b50) {
        const flags = dv.getUint16(ptr + 6, true);
        const method = dv.getUint16(ptr + 8, true);
        const compSize = dv.getUint32(ptr + 18, true);
        const nameLen = dv.getUint16(ptr + 26, true);
        const extraLen = dv.getUint16(ptr + 28, true);
        const name = tdUtf8.decode(bytes.subarray(ptr + 30, ptr + 30 + nameLen));
        const dataStart = ptr + 30 + nameLen + extraLen;
        if ((flags & 8) || compSize === 0) break;
        const rawSlice = bytes.subarray(dataStart, dataStart + compSize);
        if (method === 0) setEntry(name, rawSlice);
        else if (method === 8) setEntry(name, await inflateRaw(rawSlice));
        ptr = dataStart + compSize;
      }
    }

    if (!entries.size) {
      throw new Error("Không giải nén được dữ liệu tệp Office (tệp có thể bị hỏng hoặc có mật khẩu).");
    }

    return {
      map: entries,
      has(path) {
        return lowerIndex.has(cleanZipKey(path).toLowerCase());
      },
      get(path) {
        const realKey = lowerIndex.get(cleanZipKey(path).toLowerCase());
        return realKey ? entries.get(realKey) : undefined;
      },
      getText(path) {
        const b = this.get(path);
        return b ? decodeTextAuto(b) : "";
      },
      keys() {
        return [...entries.keys()];
      }
    };
  }

  /* ===================== 3. OLE2 (COMPOUND FILE BINARY) READER (.doc / .ppt / .xls) ===================== */
  function parseOle2Streams(bytes) {
    if (bytes.length < 512) return null;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (dv.getUint32(0, true) !== 0xe011cfd0 || dv.getUint32(4, true) !== 0xe11ab1a1) return null;

    const sectorShift = dv.getUint16(30, true);
    const miniShift = dv.getUint16(32, true);
    const sectorSize = 1 << sectorShift;
    const miniSectorSize = 1 << miniShift;
    const firstDirSect = dv.getInt32(48, true);
    const miniCutoff = dv.getUint32(56, true);
    const firstMiniFatSect = dv.getInt32(60, true);
    const firstDifatSect = dv.getInt32(68, true);
    const numDifatSects = dv.getUint32(72, true);

    const sectOffset = (s) => (s + 1) * sectorSize;

    // Collect FAT sector numbers from header (109 entries) + DIFAT chain
    const fatSects = [];
    for (let i = 0; i < 109; i++) {
      const s = dv.getInt32(76 + i * 4, true);
      if (s >= 0) fatSects.push(s);
    }
    let difat = firstDifatSect;
    let guard = 0;
    while (difat >= 0 && guard++ < numDifatSects + 5) {
      const off = sectOffset(difat);
      if (off + sectorSize > bytes.length) break;
      const entriesPerSect = (sectorSize >> 2) - 1;
      for (let i = 0; i < entriesPerSect; i++) {
        const s = dv.getInt32(off + i * 4, true);
        if (s >= 0) fatSects.push(s);
      }
      difat = dv.getInt32(off + entriesPerSect * 4, true);
    }

    // Build FAT table
    const fat = [];
    for (const fs of fatSects) {
      const off = sectOffset(fs);
      if (off + sectorSize > bytes.length) continue;
      for (let i = 0; i < sectorSize; i += 4) fat.push(dv.getInt32(off + i, true));
    }

    function readChain(startSect, maxLen) {
      const chunks = [];
      let s = startSect;
      let total = 0;
      const seen = new Set();
      while (s >= 0 && !seen.has(s) && s < fat.length) {
        seen.add(s);
        const off = sectOffset(s);
        if (off + sectorSize > bytes.length) break;
        chunks.push(bytes.subarray(off, off + sectorSize));
        total += sectorSize;
        if (maxLen && total >= maxLen) break;
        s = fat[s];
      }
      const res = new Uint8Array(maxLen ? Math.min(total, maxLen) : total);
      let p = 0;
      for (const c of chunks) {
        const take = Math.min(c.length, res.length - p);
        res.set(c.subarray(0, take), p);
        p += take;
        if (p >= res.length) break;
      }
      return res;
    }

    // Read Directory Stream
    const dirBytes = readChain(firstDirSect);
    const dirDv = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);
    const dirEntries = [];
    for (let off = 0; off + 128 <= dirBytes.length; off += 128) {
      const nameLen = dirDv.getUint16(off + 64, true);
      const type = dirBytes[off + 66];
      if (type === 0 || nameLen < 2 || nameLen > 64) continue;
      const name = tdUtf16Le.decode(dirBytes.subarray(off, off + nameLen - 2));
      const startSect = dirDv.getInt32(off + 116, true);
      const size = dirDv.getUint32(off + 120, true);
      dirEntries.push({ name, type, startSect, size });
    }

    // MiniFAT + MiniStream (từ Root Entry)
    const root = dirEntries.find((e) => e.type === 5);
    let miniFat = [];
    let miniStream = new Uint8Array(0);
    if (root && root.startSect >= 0 && root.size > 0) {
      miniStream = readChain(root.startSect, root.size);
      if (firstMiniFatSect >= 0) {
        const mfBytes = readChain(firstMiniFatSect);
        const mfDv = new DataView(mfBytes.buffer, mfBytes.byteOffset, mfBytes.byteLength);
        for (let i = 0; i + 4 <= mfBytes.length; i += 4) miniFat.push(mfDv.getInt32(i, true));
      }
    }

    function readMiniChain(startSect, size) {
      const res = new Uint8Array(size);
      let s = startSect;
      let p = 0;
      const seen = new Set();
      while (s >= 0 && p < size && !seen.has(s) && s < miniFat.length) {
        seen.add(s);
        const off = s * miniSectorSize;
        if (off >= miniStream.length) break;
        const take = Math.min(miniSectorSize, size - p, miniStream.length - off);
        res.set(miniStream.subarray(off, off + take), p);
        p += take;
        s = miniFat[s];
      }
      return res;
    }

    const streams = new Map();
    for (const e of dirEntries) {
      if (e.type !== 2 || e.size <= 0) continue;
      const data = e.size < miniCutoff && miniStream.length
        ? readMiniChain(e.startSect, e.size)
        : readChain(e.startSect, e.size);
      streams.set(e.name, data);
    }
    return streams;
  }

  /* ===================== 4. HELPERS (TEXT, XML, MAGIC BYTES) ===================== */
  function decodeTextAuto(bytes) {
    if (!bytes || !bytes.length) return "";
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return tdUtf16Le.decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return tdUtf16Be.decode(bytes.subarray(2));
    }
    let s = tdUtf8.decode(bytes);
    if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
    return s;
  }

  function cleanXmlString(xmlStr) {
    if (!xmlStr) return "";
    return xmlStr
      .replace(/^\uFEFF/, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  }

  function parseXmlSafe(xmlStr) {
    const clean = cleanXmlString(xmlStr);
    const doc = new DOMParser().parseFromString(clean, "application/xml");
    // Xóa mọi nhánh mc:Fallback để không bị nhân đôi nội dung
    const all = [...doc.getElementsByTagName("*")];
    for (const el of all) {
      if (el.localName === "Fallback" && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
    return doc;
  }

  function getElsByLocal(node, localName) {
    const out = [];
    if (!node) return out;
    const all = node.getElementsByTagName("*");
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === localName) out.push(all[i]);
    }
    return out;
  }

  function getDirectChildrenByLocal(node, localName) {
    const out = [];
    if (!node) return out;
    for (let ch = node.firstElementChild; ch; ch = ch.nextElementSibling) {
      if (ch.localName === localName) out.push(ch);
    }
    return out;
  }

  function getAttrByLocal(el, localName) {
    if (!el || !el.attributes) return "";
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (a.localName === localName || a.name === localName || a.name.endsWith(`:${localName}`)) {
        return a.value;
      }
    }
    return "";
  }

  function getRelAttr(el, preferredLocal = "id") {
    if (!el || !el.attributes) return "";
    // Ưu tiên thuộc tính thuộc namespace OpenXML relationships (r:id, r:embed...)
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (
        (a.namespaceURI && a.namespaceURI.includes("relationships") && a.localName === preferredLocal) ||
        a.name === `r:${preferredLocal}` ||
        a.name.endsWith(`:${preferredLocal}`)
      ) {
        return a.value;
      }
    }
    return getAttrByLocal(el, preferredLocal);
  }

  function normalizePath(baseFile, target) {
    const cleanTarget = String(target || "").replace(/\\/g, "/");
    if (cleanTarget.startsWith("/")) return cleanTarget.slice(1);
    const parts = cleanZipKey(baseFile).split("/").slice(0, -1);
    for (const seg of cleanTarget.split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    return parts.join("/");
  }

  function parseRels(xmlStr) {
    const map = {};
    if (!xmlStr) return map;
    try {
      const doc = parseXmlSafe(xmlStr);
      for (const rel of getElsByLocal(doc, "Relationship")) {
        const id = rel.getAttribute("Id") || getAttrByLocal(rel, "Id");
        const target = rel.getAttribute("Target") || getAttrByLocal(rel, "Target");
        const type = rel.getAttribute("Type") || getAttrByLocal(rel, "Type") || "";
        if (id && target) map[id] = { target, type };
      }
    } catch {
      const re = /<Relationship\b[^>]*>/gi;
      let m;
      while ((m = re.exec(xmlStr))) {
        const tag = m[0];
        const id = /\bId=["']([^"']+)["']/i.exec(tag)?.[1];
        const target = /\bTarget=["']([^"']+)["']/i.exec(tag)?.[1];
        const type = /\bType=["']([^"']+)["']/i.exec(tag)?.[1] || "";
        if (id && target) map[id] = { target, type };
      }
    }
    return map;
  }

  function bytesToDataUrl(bytes, ext) {
    const mimeMap = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml"
    };
    const mime = mimeMap[(ext || "").toLowerCase()];
    if (!mime || !bytes || !bytes.length) return null;
    let bin = "";
    const chunk = 0x4000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return `data:${mime};base64,${btoa(bin)}`;
  }

  function htmlEsc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isZipMagic(bytes) {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05);
  }

  function isOle2Magic(bytes) {
    return bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  }

  async function detectKind(arrayBuffer, filename = "") {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    const ext = (filename.split(".").pop() || "").toLowerCase();

    if (isZipMagic(bytes)) {
      try {
        const z = await unzip(bytes);
        if (z.has("word/document.xml")) return { kind: "docx", zip: z };
        if (z.has("xl/workbook.xml") || z.keys().some((k) => /^xl\/worksheets\//i.test(k))) return { kind: "xlsx", zip: z };
        if (z.has("ppt/presentation.xml") || z.keys().some((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))) return { kind: "pptx", zip: z };
      } catch {
        // rơi xuống theo ext
      }
      if (["docx", "xlsx", "pptx"].includes(ext)) return { kind: ext };
    }

    if (isOle2Magic(bytes)) {
      const streams = parseOle2Streams(bytes);
      if (streams) {
        if (streams.has("PowerPoint Document")) return { kind: "ppt-bin", streams };
        if (streams.has("Workbook") || streams.has("Book")) return { kind: "xls-bin", streams };
        if (streams.has("WordDocument")) return { kind: "doc-bin", streams };
      }
      if (ext === "ppt" || ext === "pptx") return { kind: "ppt-bin" };
      if (ext === "xls" || ext === "xlsx") return { kind: "xls-bin" };
      return { kind: "doc-bin" };
    }

    const head = decodeTextAuto(bytes.subarray(0, Math.min(bytes.length, 4096))).trimStart();
    if (/^\{\\rtf/i.test(head)) return { kind: "rtf" };
    if (/^MIME-Version:/i.test(head) || /Content-Type:\s*multipart\/related/i.test(head)) return { kind: "mhtml" };
    if (/^<\?xml\b/i.test(head) && /<(?:ss:)?Workbook\b|<Worksheet\b/i.test(head)) return { kind: "xls-xml" };
    if (/^<\?xml\b/i.test(head) && /<w:wordDocument\b/i.test(head)) return { kind: "doc-xml" };
    if (/^(?:<!doctype\s+html|<html\b|<head\b|<meta\b|<body\b|<table\b|<style\b|<div\b|<p\b)/i.test(head)) {
      if (ext === "xls" || ext === "xlsx" || (/<table\b/i.test(head) && !/xmlns:w=|office:word/i.test(head) && ext === "xls")) {
        return { kind: "xls-html" };
      }
      if (/office:excel/i.test(head)) return { kind: "xls-html" };
      return { kind: "html" };
    }
    if (ext === "json") return { kind: "json" };
    if (["csv", "tsv"].includes(ext)) return { kind: "csv" };
    if (["md", "markdown"].includes(ext)) return { kind: "md" };
    return { kind: "txt" };
  }

  /* ===================== 5. WORD PARSER (DOCX / DOC / RTF / HTML / TXT) ===================== */
  function decodeQuotedPrintableUtf8(str) {
    const cleaned = str.replace(/=\r?\n/g, "");
    const out = [];
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(cleaned.slice(i + 1, i + 3))) {
        out.push(parseInt(cleaned.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        const c = cleaned.charCodeAt(i);
        if (c < 128) out.push(c);
        else {
          const encoded = new TextEncoder().encode(cleaned[i]);
          for (const b of encoded) out.push(b);
        }
      }
    }
    return tdUtf8.decode(new Uint8Array(out));
  }

  function extractCleanBodyHtml(rawHtml) {
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");
    doc.querySelectorAll("script, style, meta, link, title, xml").forEach((el) => el.remove());
    const bodyHtml = doc.body ? doc.body.innerHTML.trim() : rawHtml;
    return bodyHtml || "<p>(Tệp trống)</p>";
  }

  function parseMhtmlToHtml(rawText) {
    const boundMatch = /boundary=["']?([^"';\r\n]+)["']?/i.exec(rawText);
    if (boundMatch) {
      const parts = rawText.split(`--${boundMatch[1]}`);
      for (const p of parts) {
        if (/Content-Type:\s*text\/html/i.test(p)) {
          const idx = p.search(/\r?\n\r?\n/);
          if (idx >= 0) {
            let body = p.slice(idx).trim();
            if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(p.slice(0, idx))) {
              body = decodeQuotedPrintableUtf8(body);
            }
            return extractCleanBodyHtml(body);
          }
        }
      }
    }
    const htmlStart = rawText.search(/<html|<body|<!doctype/i);
    if (htmlStart >= 0) return extractCleanBodyHtml(decodeQuotedPrintableUtf8(rawText.slice(htmlStart)));
    return `<p>${htmlEsc(rawText)}</p>`;
  }

  function parseRtfToHtml(rtf) {
    // Bỏ các nhóm tiêu đề RTF (fonttbl, colortbl, stylesheet, info, pict...)
    let s = rtf.replace(/\{\\\*?[a-z]+[^}]*\}/gi, (m) => {
      if (/^\{\\(?:fonttbl|colortbl|stylesheet|info|pict|header|footer|object|\*)/i.test(m)) return "";
      return m;
    });
    s = s
      .replace(/\\par[d]?\b\s?/gi, "\n")
      .replace(/\\line\b\s?/gi, "\n")
      .replace(/\\tab\b\s?/gi, "    ")
      .replace(/\\u(-?\d+)\??/g, (_, n) => {
        let code = parseInt(n, 10);
        if (code < 0) code += 65536;
        return String.fromCharCode(code);
      })
      .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\[a-z]+-?\d*\s?/gi, "")
      .replace(/[{}]/g, "")
      .replace(/\r/g, "");
    const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return "<p>(Không đọc được nội dung văn bản trong tệp RTF)</p>";
    return lines.map((l) => `<p>${htmlEsc(l)}</p>`).join("");
  }

  function parseDocxNativeFromZip(zip) {
    const docXml = zip.getText("word/document.xml");
    if (!docXml) throw new Error("Không tìm thấy nội dung word/document.xml trong tệp .docx.");
    const doc = parseXmlSafe(docXml);
    const rels = parseRels(zip.getText("word/_rels/document.xml.rels"));

    // Đọc danh sách style heading (nếu có)
    const headingStyles = new Map();
    const stylesXml = zip.getText("word/styles.xml");
    if (stylesXml) {
      try {
        const sDoc = parseXmlSafe(stylesXml);
        for (const st of getElsByLocal(sDoc, "style")) {
          const id = getAttrByLocal(st, "styleId");
          const nm = getElsByLocal(st, "name")[0];
          const val = (nm ? getAttrByLocal(nm, "val") : "").toLowerCase();
          if (id && /heading\s*1|title/.test(val)) headingStyles.set(id, "h1");
          else if (id && /heading\s*2|subtitle/.test(val)) headingStyles.set(id, "h2");
          else if (id && /heading\s*[3-6]/.test(val)) headingStyles.set(id, "h3");
        }
      } catch {}
    }

    function renderRun(rEl) {
      const rPr = getDirectChildrenByLocal(rEl, "rPr")[0];
      let bold = false, italic = false, under = false, strike = false, color = "";
      if (rPr) {
        const b = getDirectChildrenByLocal(rPr, "b")[0];
        if (b && getAttrByLocal(b, "val") !== "0" && getAttrByLocal(b, "val") !== "false") bold = true;
        const it = getDirectChildrenByLocal(rPr, "i")[0];
        if (it && getAttrByLocal(it, "val") !== "0" && getAttrByLocal(it, "val") !== "false") italic = true;
        const u = getDirectChildrenByLocal(rPr, "u")[0];
        if (u && getAttrByLocal(u, "val") !== "none") under = true;
        const st = getDirectChildrenByLocal(rPr, "strike")[0];
        if (st && getAttrByLocal(st, "val") !== "0") strike = true;
        const cl = getDirectChildrenByLocal(rPr, "color")[0];
        const cv = cl ? getAttrByLocal(cl, "val") : "";
        if (cv && /^[0-9a-f]{6}$/i.test(cv) && cv.toUpperCase() !== "000000" && cv.toLowerCase() !== "auto") {
          color = `#${cv}`;
        }
      }

      let out = "";
      for (let ch = rEl.firstElementChild; ch; ch = ch.nextElementSibling) {
        const ln = ch.localName;
        if (ln === "t" || ln === "instrText") {
          if (ln === "t") out += htmlEsc(ch.textContent || "");
        } else if (ln === "tab") {
          out += "&emsp;";
        } else if (ln === "br" || ln === "cr") {
          out += "<br/>";
        } else if (ln === "drawing" || ln === "pict") {
          const blips = getElsByLocal(ch, "blip").concat(getElsByLocal(ch, "imagedata"));
          for (const bl of blips) {
            const rId = getRelAttr(bl, "embed") || getRelAttr(bl, "id");
            if (rId && rels[rId]) {
              const mPath = normalizePath("word/document.xml", rels[rId].target);
              const mBytes = zip.get(mPath);
              if (mBytes) {
                const ext = mPath.split(".").pop() || "png";
                const url = bytesToDataUrl(mBytes, ext);
                if (url) out += `<img src="${url}" style="max-width:100%;height:auto;" alt="ảnh"/>`;
              }
            }
          }
        }
      }
      if (!out) return "";
      if (bold) out = `<b>${out}</b>`;
      if (italic) out = `<i>${out}</i>`;
      if (under) out = `<u>${out}</u>`;
      if (strike) out = `<s>${out}</s>`;
      if (color) out = `<span style="color:${color}">${out}</span>`;
      return out;
    }

    function renderParagraph(pEl) {
      const pPr = getDirectChildrenByLocal(pEl, "pPr")[0];
      let tag = "p";
      let align = "";
      let isList = false;

      if (pPr) {
        const pStyle = getDirectChildrenByLocal(pPr, "pStyle")[0];
        const sid = pStyle ? getAttrByLocal(pStyle, "val") : "";
        if (headingStyles.has(sid)) tag = headingStyles.get(sid);
        else if (/^heading1|^1$/i.test(sid)) tag = "h1";
        else if (/^heading2|^2$/i.test(sid)) tag = "h2";
        else if (/^heading3/i.test(sid)) tag = "h3";

        const jc = getDirectChildrenByLocal(pPr, "jc")[0];
        const jv = (jc ? getAttrByLocal(jc, "val") : "").toLowerCase();
        if (jv === "center") align = "center";
        else if (jv === "right") align = "right";
        else if (jv === "both" || jv === "distribute") align = "justify";

        if (getDirectChildrenByLocal(pPr, "numPr").length) isList = true;
      }

      let inner = "";
      for (let ch = pEl.firstElementChild; ch; ch = ch.nextElementSibling) {
        if (ch.localName === "r") {
          inner += renderRun(ch);
        } else if (ch.localName === "hyperlink" || ch.localName === "ins" || ch.localName === "smartTag" || ch.localName === "sdt") {
          for (const r of getElsByLocal(ch, "r")) inner += renderRun(r);
        }
      }
      if (!inner.trim()) return tag === "p" ? "<p>&nbsp;</p>" : "";
      if (isList && tag === "p") inner = `• ${inner}`;
      const styleAttr = align ? ` style="text-align:${align};"` : "";
      return `<${tag}${styleAttr}>${inner}</${tag}>`;
    }

    function renderTable(tblEl) {
      const rows = getDirectChildrenByLocal(tblEl, "tr");
      if (!rows.length) return "";
      let html = `<table border="1" style="width:100%;border-collapse:collapse;margin:8px 0;">`;
      rows.forEach((tr, rIdx) => {
        html += "<tr>";
        for (const tc of getDirectChildrenByLocal(tr, "tc")) {
          const tcPr = getDirectChildrenByLocal(tc, "tcPr")[0];
          const gs = tcPr ? getDirectChildrenByLocal(tcPr, "gridSpan")[0] : null;
          const colspan = gs ? Number(getAttrByLocal(gs, "val") || 1) : 1;
          const cellParts = [];
          for (let ch = tc.firstElementChild; ch; ch = ch.nextElementSibling) {
            if (ch.localName === "p") cellParts.push(renderParagraph(ch));
            else if (ch.localName === "tbl") cellParts.push(renderTable(ch));
          }
          const cellTag = rIdx === 0 ? "th" : "td";
          const csAttr = colspan > 1 ? ` colspan="${colspan}"` : "";
          html += `<${cellTag}${csAttr} style="border:1px solid #666;padding:6px 8px;vertical-align:top;">${cellParts.join("") || "&nbsp;"}</${cellTag}>`;
        }
        html += "</tr>";
      });
      html += "</table>";
      return html;
    }

    const body = getElsByLocal(doc, "body")[0] || doc.documentElement;
    const htmlParts = [];
    for (let ch = body.firstElementChild; ch; ch = ch.nextElementSibling) {
      if (ch.localName === "p") htmlParts.push(renderParagraph(ch));
      else if (ch.localName === "tbl") htmlParts.push(renderTable(ch));
      else if (ch.localName === "sdt") {
        const content = getElsByLocal(ch, "sdtContent")[0];
        if (content) {
          for (let sc = content.firstElementChild; sc; sc = sc.nextElementSibling) {
            if (sc.localName === "p") htmlParts.push(renderParagraph(sc));
            else if (sc.localName === "tbl") htmlParts.push(renderTable(sc));
          }
        }
      }
    }
    const result = htmlParts.join("\n").trim();
    return result || "<p>(Tệp Word trống)</p>";
  }

  function extractTextFromBinaryDoc(bytes, streams) {
    // Đọc từ WordDocument stream (hoặc toàn bộ file nếu không tách được)
    const src = streams?.get("WordDocument") || bytes;
    const paragraphs = [];

    // 1. Quét các đoạn UTF-16LE hợp lệ (hỗ trợ đầy đủ tiếng Việt có dấu)
    let cur = "";
    const flush = () => {
      const cleaned = cur.replace(/\s+/g, " ").trim();
      if (
        cleaned.length >= 4 &&
        /[a-zA-ZÀ-ỹ0-9]/.test(cleaned) &&
        !/^(Root Entry|WordDocument|1Table|0Table|Data|CompObj|SummaryInformation|DocumentSummaryInformation|Normal|Times New Roman|Calibri|Arial|Cambria|Heading \d|Microsoft Word|HYPERLINK|EMBED|MERGEFORMAT)$/i.test(cleaned)
      ) {
        paragraphs.push(cleaned);
      }
      cur = "";
    };

    for (let i = 0; i + 1 < src.length; i += 2) {
      const code = src[i] | (src[i + 1] << 8);
      if (code === 0x000d || code === 0x000a || code === 0x0007) {
        flush();
      } else if (
        (code >= 0x0020 && code <= 0x007e) ||
        (code >= 0x00c0 && code <= 0x024f) ||
        (code >= 0x1e00 && code <= 0x1eff) ||
        code === 0x2013 || code === 0x2014 || code === 0x201c || code === 0x201d || code === 0x2022 || code === 0x2026 || code === 0x0009
      ) {
        cur += code === 0x0009 ? " " : String.fromCharCode(code);
      } else {
        flush();
      }
    }
    flush();

    // 2. Nếu không thấy UTF-16LE (tài liệu chỉ dùng ASCII/ANSI), quét ASCII in được
    if (paragraphs.length < 2) {
      let ascii = "";
      const flushA = () => {
        const cleaned = ascii.replace(/\s+/g, " ").trim();
        if (cleaned.length >= 8 && /[a-zA-Z]{3,}/.test(cleaned) && !/^(Microsoft|Normal|Times New Roman|bjbj|Root Entry)/i.test(cleaned)) {
          paragraphs.push(cleaned);
        }
        ascii = "";
      };
      for (let i = 0; i < src.length; i++) {
        const b = src[i];
        if (b === 13 || b === 10) flushA();
        else if (b >= 32 && b <= 126) ascii += String.fromCharCode(b);
        else flushA();
      }
      flushA();
    }

    const dedup = [];
    const seen = new Set();
    for (const p of paragraphs) {
      if (!seen.has(p)) {
        seen.add(p);
        dedup.push(p);
      }
    }
    if (!dedup.length) {
      throw new Error("Tệp .doc định dạng Word 97–2003 nhị phân này không trích xuất được văn bản. Vui lòng mở bằng Word và Lưu dưới dạng .docx rồi tải lên lại.");
    }
    return dedup.map((p) => `<p>${htmlEsc(p)}</p>`).join("\n");
  }

  function waitForGlobal(name, timeoutMs = 1800) {
    if (window[name]) return Promise.resolve(window[name]);
    return new Promise((resolve) => {
      const start = Date.now();
      const iv = setInterval(() => {
        if (window[name] || Date.now() - start >= timeoutMs) {
          clearInterval(iv);
          resolve(window[name] || null);
        }
      }, 80);
    });
  }

  async function parseWord(arrayBuffer, filename = "document.docx") {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    const info = await detectKind(bytes, filename);

    if (info.kind === "docx") {
      // Thử mammoth nếu đã sẵn sàng, nếu lỗi/offline dùng ngay bộ đọc Native DOCX
      const mammothLib = window.mammoth || (await waitForGlobal("mammoth", 900));
      if (mammothLib) {
        try {
          const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          const res = await mammothLib.convertToHtml({ arrayBuffer: ab });
          if (res && res.value && res.value.trim()) {
            return { html: res.value, warning: "" };
          }
        } catch (e) {
          console.warn("Mammoth fallback to native DOCX parser:", e);
        }
      }
      const zip = info.zip || (await unzip(bytes));
      return { html: parseDocxNativeFromZip(zip), warning: "" };
    }

    if (info.kind === "mhtml") {
      return { html: parseMhtmlToHtml(decodeTextAuto(bytes)), warning: "" };
    }

    if (info.kind === "html" || info.kind === "xls-html") {
      return { html: extractCleanBodyHtml(decodeTextAuto(bytes)), warning: "" };
    }

    if (info.kind === "doc-xml") {
      const doc = parseXmlSafe(decodeTextAuto(bytes));
      const parts = getElsByLocal(doc, "p").map((p) => {
        const txt = getElsByLocal(p, "t").map((t) => t.textContent || "").join("");
        return `<p>${htmlEsc(txt) || "&nbsp;"}</p>`;
      });
      return { html: parts.join("\n") || "<p>(Tệp trống)</p>", warning: "" };
    }

    if (info.kind === "rtf") {
      return { html: parseRtfToHtml(decodeTextAuto(bytes)), warning: "" };
    }

    if (info.kind === "doc-bin") {
      const html = extractTextFromBinaryDoc(bytes, info.streams);
      return {
        html,
        warning: "Đã trích xuất văn bản từ tệp .doc cũ (Word 97–2003). Lưu tệp sang .docx để giữ trọn định dạng bảng & ảnh."
      };
    }

    if (info.kind === "md") {
      const lines = decodeTextAuto(bytes).split(/\r?\n/);
      const html = lines
        .map((line) => {
          const esc = htmlEsc(line).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
          if (/^###\s+/.test(line)) return `<h3>${esc.replace(/^###\s+/, "")}</h3>`;
          if (/^##\s+/.test(line)) return `<h2>${esc.replace(/^##\s+/, "")}</h2>`;
          if (/^#\s+/.test(line)) return `<h1>${esc.replace(/^#\s+/, "")}</h1>`;
          return `<p>${esc || "&nbsp;"}</p>`;
        })
        .join("\n");
      return { html, warning: "" };
    }

    const txt = decodeTextAuto(bytes);
    const html = txt.split(/\r?\n/).map((l) => `<p>${htmlEsc(l) || "&nbsp;"}</p>`).join("\n");
    return { html, warning: "" };
  }

  /* ===================== 6. EXCEL PARSER (XLSX / XLS / HTML-TABLE / XML / CSV) ===================== */
  function colLettersToIndex(letters) {
    let idx = 0;
    const up = letters.toUpperCase();
    for (let i = 0; i < up.length; i++) idx = idx * 26 + (up.charCodeAt(i) - 64);
    return idx - 1;
  }

  function parseXlsxNativeFromZip(zip) {
    // 1. Đọc sharedStrings.xml
    const sharedStrings = [];
    const ssXml = zip.getText("xl/sharedStrings.xml");
    if (ssXml) {
      const ssDoc = parseXmlSafe(ssXml);
      for (const si of getElsByLocal(ssDoc, "si")) {
        const text = getElsByLocal(si, "t").map((t) => t.textContent || "").join("");
        sharedStrings.push(text);
      }
    }

    // 2. Xác định danh sách sheet từ workbook.xml + rels
    const sheetDefs = [];
    const wbXml = zip.getText("xl/workbook.xml");
    const wbRels = parseRels(zip.getText("xl/_rels/workbook.xml.rels"));
    if (wbXml) {
      const wbDoc = parseXmlSafe(wbXml);
      for (const sh of getElsByLocal(wbDoc, "sheet")) {
        const name = sh.getAttribute("name") || `Sheet ${sheetDefs.length + 1}`;
        const rId = getRelAttr(sh, "id");
        let path = "";
        if (rId && wbRels[rId]) {
          path = normalizePath("xl/workbook.xml", wbRels[rId].target);
        }
        if (path && zip.has(path)) sheetDefs.push({ name, path });
      }
    }
    if (!sheetDefs.length) {
      zip.keys()
        .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
        .forEach((path, i) => sheetDefs.push({ name: `Sheet ${i + 1}`, path }));
    }
    if (!sheetDefs.length) throw new Error("Không tìm thấy trang tính nào trong tệp .xlsx.");

    const sheets = [];
    for (const def of sheetDefs) {
      const shXml = zip.getText(def.path);
      if (!shXml) continue;
      const shDoc = parseXmlSafe(shXml);
      const grid = [];
      let maxCol = 0;

      for (const rowEl of getElsByLocal(shDoc, "row")) {
        const rowAttr = Number(rowEl.getAttribute("r") || 0);
        const rIdx = rowAttr > 0 ? rowAttr - 1 : grid.length;
        if (!grid[rIdx]) grid[rIdx] = [];

        let autoCol = 0;
        for (const cEl of getDirectChildrenByLocal(rowEl, "c")) {
          const ref = cEl.getAttribute("r") || "";
          const m = /^([A-Z]+)(\d+)$/i.exec(ref);
          const cIdx = m ? colLettersToIndex(m[1]) : autoCol;
          autoCol = cIdx + 1;
          if (cIdx > maxCol) maxCol = cIdx;

          const t = cEl.getAttribute("t") || "";
          const fEl = getDirectChildrenByLocal(cEl, "f")[0];
          const vEl = getDirectChildrenByLocal(cEl, "v")[0];
          const isEl = getDirectChildrenByLocal(cEl, "is")[0];

          let val = "";
          if (t === "s" && vEl) {
            val = sharedStrings[Number(vEl.textContent)] ?? "";
          } else if (t === "inlineStr" && isEl) {
            val = getElsByLocal(isEl, "t").map((x) => x.textContent || "").join("");
          } else if (t === "str" && vEl) {
            val = vEl.textContent || "";
          } else if (t === "b" && vEl) {
            val = vEl.textContent === "1" ? "TRUE" : "FALSE";
          } else if (t === "e" && vEl) {
            val = vEl.textContent || "#ERR";
          } else if (vEl) {
            const raw = vEl.textContent ?? "";
            const num = Number(raw);
            val = raw !== "" && !isNaN(num) ? num : raw;
          }

          // Nếu có công thức cơ bản hỗ trợ được (SUM/AVERAGE/MIN/MAX/COUNT trên cùng sheet) và không có giá trị cache
          if (fEl && fEl.textContent) {
            const fTxt = fEl.textContent.trim();
            const isSimpleFormula = /^(SUM|AVERAGE|MIN|MAX|COUNT)\([A-Z$\d:,+\-*/\s]+\)$/i.test(fTxt) && !fTxt.includes("!");
            if (isSimpleFormula || val === "") {
              if (!fTxt.includes("!") && !/VLOOKUP|HLOOKUP|INDEX|MATCH|SUMIF|COUNTIF|OFFSET/i.test(fTxt)) {
                val = `=${fTxt}`;
              }
            }
          }

          grid[rIdx][cIdx] = val;
        }
      }

      const aoa = [];
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r] || [];
        const norm = [];
        for (let c = 0; c <= maxCol; c++) norm.push(row[c] ?? "");
        aoa.push(norm);
      }
      sheets.push({ name: def.name, aoa: aoa.length ? aoa : [[""]] });
    }
    return sheets;
  }

  function parseHtmlTablesToSheets(htmlText, fallbackName) {
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const tables = [...doc.querySelectorAll("table")];
    if (!tables.length) {
      const lines = (doc.body?.innerText || "").split(/\r?\n/).filter((l) => l.trim());
      return [{ name: fallbackName.slice(0, 24) || "Sheet 1", aoa: lines.map((l) => [l]) }];
    }
    return tables.map((tbl, idx) => {
      const aoa = [];
      for (const tr of tbl.querySelectorAll("tr")) {
        const row = [];
        for (const cell of tr.querySelectorAll("th, td")) {
          const text = (cell.textContent || "").replace(/\s+/g, " ").trim();
          const num = text !== "" && /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text;
          row.push(num);
          const cs = Number(cell.getAttribute("colspan") || 1);
          for (let k = 1; k < cs; k++) row.push("");
        }
        if (row.length) aoa.push(row);
      }
      return {
        name: tables.length === 1 ? (fallbackName.slice(0, 24) || "Sheet 1") : `Bảng ${idx + 1}`,
        aoa: aoa.length ? aoa : [[""]]
      };
    });
  }

  function parseXmlSpreadsheetToSheets(xmlText) {
    const doc = parseXmlSafe(xmlText);
    const worksheets = getElsByLocal(doc, "Worksheet");
    if (!worksheets.length) return [];
    return worksheets.map((ws, idx) => {
      const name = getAttrByLocal(ws, "Name") || `Sheet ${idx + 1}`;
      const aoa = [];
      for (const rowEl of getElsByLocal(ws, "Row")) {
        const row = [];
        let col = 0;
        for (const cellEl of getDirectChildrenByLocal(rowEl, "Cell")) {
          const idxAttr = Number(getAttrByLocal(cellEl, "Index") || 0);
          if (idxAttr > 0) col = idxAttr - 1;
          const dataEl = getDirectChildrenByLocal(cellEl, "Data")[0];
          const raw = dataEl ? dataEl.textContent || "" : "";
          const typ = dataEl ? getAttrByLocal(dataEl, "Type") : "";
          row[col] = typ === "Number" && raw !== "" && !isNaN(Number(raw)) ? Number(raw) : raw;
          col++;
        }
        aoa.push(row.map((v) => v ?? ""));
      }
      return { name, aoa: aoa.length ? aoa : [[""]] };
    });
  }

  function parseCsvRFC4180(text) {
    const clean = text.replace(/^\uFEFF/, "");
    // Tự đoán dấu phân cách (tab / chấm phẩy / phẩy) từ dòng đầu
    const firstLine = clean.split(/\r?\n/)[0] || "";
    const countOutsideQuotes = (line, ch) => {
      let inQ = false, cnt = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQ = !inQ;
        else if (!inQ && line[i] === ch) cnt++;
      }
      return cnt;
    };
    const tabs = countOutsideQuotes(firstLine, "\t");
    const semis = countOutsideQuotes(firstLine, ";");
    const commas = countOutsideQuotes(firstLine, ",");
    const sep = tabs > commas && tabs >= semis ? "\t" : semis > commas ? ";" : ",";

    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if (inQuotes) {
        if (ch === '"') {
          if (clean[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"' && field === "") {
          inQuotes = true;
        } else if (ch === sep) {
          row.push(field.trim());
          field = "";
        } else if (ch === "\r" || ch === "\n") {
          if (ch === "\r" && clean[i + 1] === "\n") i++;
          row.push(field.trim());
          if (row.some((v) => v !== "")) rows.push(row);
          row = [];
          field = "";
        } else {
          field += ch;
        }
      }
    }
    row.push(field.trim());
    if (row.some((v) => v !== "")) rows.push(row);
    return rows.length ? rows : [[""]];
  }

  async function parseExcel(arrayBuffer, filename = "sheet.xlsx") {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    const baseName = filename.replace(/\.[^.]+$/, "");
    const info = await detectKind(bytes, filename);

    if (info.kind === "xlsx") {
      // Ưu tiên SheetJS nếu đã sẵn sàng, nếu offline/lỗi tự fallback sang Native XLSX Parser
      const xlsxLib = window.XLSX || (await waitForGlobal("XLSX", 900));
      if (xlsxLib) {
        try {
          const wb = xlsxLib.read(bytes, { type: "array" });
          const sheets = wb.SheetNames.map((name) => ({
            name,
            aoa: xlsxLib.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" })
          }));
          if (sheets.length) return { sheets, warning: "" };
        } catch (e) {
          console.warn("SheetJS fallback to native XLSX parser:", e);
        }
      }
      const zip = info.zip || (await unzip(bytes));
      return { sheets: parseXlsxNativeFromZip(zip), warning: "" };
    }

    if (info.kind === "xls-bin") {
      const xlsxLib = window.XLSX || (await waitForGlobal("XLSX", 2200));
      if (xlsxLib) {
        try {
          const wb = xlsxLib.read(bytes, { type: "array" });
          const sheets = wb.SheetNames.map((name) => ({
            name,
            aoa: xlsxLib.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" })
          }));
          if (sheets.length) return { sheets, warning: "" };
        } catch (e) {
          console.warn("SheetJS read .xls failed:", e);
        }
      }
      throw new Error("Không đọc được tệp .xls (Excel 97–2003) khi ngoại tuyến hoặc tệp có mật khẩu. Vui lòng lưu tệp thành .xlsx hoặc .csv rồi tải lên.");
    }

    if (info.kind === "xls-html" || info.kind === "html") {
      return { sheets: parseHtmlTablesToSheets(decodeTextAuto(bytes), baseName), warning: "" };
    }

    if (info.kind === "xls-xml") {
      const sheets = parseXmlSpreadsheetToSheets(decodeTextAuto(bytes));
      if (sheets.length) return { sheets, warning: "" };
    }

    // CSV / TSV / TXT
    const aoa = parseCsvRFC4180(decodeTextAuto(bytes));
    return { sheets: [{ name: baseName.slice(0, 24) || "Sheet 1", aoa }], warning: "" };
  }

  /* ===================== 7. POWERPOINT PARSER (.pptx + .ppt 97-2003) ===================== */
  const THEME_PALETTES = {
    emerald: "0F3D36",
    chalk: "143B2C",
    paper: "FAFBF9",
    navy: "0F172A",
    warm: "FFFBEB",
    plum: "2E1065"
  };

  function pickThemeFromHex(hex) {
    if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return "paper";
    const upper = hex.toUpperCase();
    for (const [k, bg] of Object.entries(THEME_PALETTES)) {
      if (bg === upper) return k;
    }
    const r = parseInt(upper.slice(0, 2), 16);
    const g = parseInt(upper.slice(2, 4), 16);
    const b = parseInt(upper.slice(4, 6), 16);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 210) {
      if (r > b + 15 && g > b + 8) return "warm";
      return "paper";
    }
    if (g >= r && g >= b) return g > 62 ? "chalk" : "emerald";
    if (r > g + 20 && b > g + 20) return "plum";
    return "navy";
  }

  function extractThemeColorMap(zip) {
    const map = {};
    const themeKey = zip.keys().find((k) => /^ppt\/theme\/theme\d*\.xml$/i.test(k));
    if (!themeKey) return map;
    try {
      const doc = parseXmlSafe(zip.getText(themeKey));
      const clrScheme = getElsByLocal(doc, "clrScheme")[0];
      if (!clrScheme) return map;
      for (let ch = clrScheme.firstElementChild; ch; ch = ch.nextElementSibling) {
        const srgb = getElsByLocal(ch, "srgbClr")[0];
        const sys = getElsByLocal(ch, "sysClr")[0];
        const val = srgb?.getAttribute("val") || sys?.getAttribute("lastClr") || "";
        if (/^[0-9a-f]{6}$/i.test(val)) map[ch.localName] = val;
      }
      if (map.lt1) map.bg1 = map.lt1;
      if (map.dk1) map.tx1 = map.dk1;
      if (map.lt2) map.bg2 = map.lt2;
      if (map.dk2) map.tx2 = map.dk2;
    } catch {}
    return map;
  }

  function extractBgHexFromDoc(doc, themeColors) {
    const bgEl = getElsByLocal(doc, "bg")[0];
    if (!bgEl) return "";
    const srgb = getElsByLocal(bgEl, "srgbClr")[0];
    if (srgb && /^[0-9a-f]{6}$/i.test(srgb.getAttribute("val") || "")) return srgb.getAttribute("val");
    const scheme = getElsByLocal(bgEl, "schemeClr")[0];
    const sv = scheme?.getAttribute("val") || "";
    if (sv && themeColors[sv]) return themeColors[sv];
    return "";
  }

  function extractNotesText(xmlStr) {
    if (!xmlStr) return "";
    try {
      const doc = parseXmlSafe(xmlStr);
      const out = [];
      for (const sp of getElsByLocal(doc, "sp")) {
        const ph = getElsByLocal(sp, "ph")[0];
        const phType = (ph?.getAttribute("type") || "").toLowerCase();
        if (phType === "sldnum" || phType === "sldimg" || phType === "hdr" || phType === "ftr" || phType === "dt") continue;
        const lines = getElsByLocal(sp, "p")
          .map((p) => getElsByLocal(p, "t").map((t) => t.textContent || "").join("").trim())
          .filter(Boolean);
        if (lines.length) out.push(lines.join("\n"));
      }
      return out.join("\n").replace(/^\d+$/gm, "").trim();
    } catch {
      return "";
    }
  }

  function parseSlideXml(xmlStr, themeColors) {
    const doc = parseXmlSafe(xmlStr);
    const bgHex = extractBgHexFromDoc(doc, themeColors);

    const shapes = [];
    const seenShapes = new Set();

    function collectSpTree(treeEl, offsetX = 0, offsetY = 0) {
      if (!treeEl) return;
      for (let ch = treeEl.firstElementChild; ch; ch = ch.nextElementSibling) {
        const ln = ch.localName;
        if (ln === "grpSp") {
          const grpPr = getDirectChildrenByLocal(ch, "grpSpPr")[0];
          const xfrm = grpPr ? getDirectChildrenByLocal(grpPr, "xfrm")[0] : null;
          const off = xfrm ? getDirectChildrenByLocal(xfrm, "off")[0] : null;
          const gx = offsetX + Number(off?.getAttribute("x") || 0);
          const gy = offsetY + Number(off?.getAttribute("y") || 0);
          collectSpTree(ch, gx, gy);
        } else if (ln === "sp" && !seenShapes.has(ch)) {
          seenShapes.add(ch);
          const cNvPr = getElsByLocal(ch, "cNvPr")[0];
          const name = (cNvPr?.getAttribute("name") || "").toLowerCase();
          const ph = getElsByLocal(ch, "ph")[0];
          const phType = (ph?.getAttribute("type") || "").toLowerCase();
          if (phType === "sldnum" || phType === "ftr" || phType === "dt" || name.startsWith("footer")) continue;

          const txBody = getDirectChildrenByLocal(ch, "txBody")[0] || getElsByLocal(ch, "txBody")[0];
          if (!txBody) continue;
          const lines = getDirectChildrenByLocal(txBody, "p")
            .map((p) => {
              let line = "";
              for (const node of p.getElementsByTagName("*")) {
                if (node.localName === "t") line += node.textContent || "";
                else if (node.localName === "br") line += "\n";
                else if (node.localName === "tab") line += "  ";
              }
              return line.replace(/\s+$/g, "");
            })
            .filter((line, idx, arr) => line !== "" || (idx > 0 && idx < arr.length - 1));
          const text = lines.join("\n").trim();
          if (!text) continue;

          const spPr = getDirectChildrenByLocal(ch, "spPr")[0];
          const xfrm = spPr ? getDirectChildrenByLocal(spPr, "xfrm")[0] : null;
          const off = xfrm ? getDirectChildrenByLocal(xfrm, "off")[0] : null;
          const x = offsetX + Number(off?.getAttribute("x") || 0);
          const y = offsetY + Number(off?.getAttribute("y") || 0);

          let maxSz = 0;
          for (const rPr of getElsByLocal(txBody, "rPr")) {
            const sz = Number(rPr.getAttribute("sz") || 0);
            if (sz > maxSz) maxSz = sz;
          }
          shapes.push({ name, phType, text, x, y, maxSz });
        } else if (ln === "graphicFrame") {
          // Bảng biểu trong slide
          for (const tbl of getElsByLocal(ch, "tbl")) {
            const rows = getElsByLocal(tbl, "tr")
              .map((tr) =>
                getElsByLocal(tr, "tc")
                  .map((tc) => getElsByLocal(tc, "t").map((t) => t.textContent || "").join("").trim())
                  .filter(Boolean)
                  .join(" | ")
              )
              .filter(Boolean);
            if (rows.length) {
              const xfrm = getDirectChildrenByLocal(ch, "xfrm")[0];
              const off = xfrm ? getDirectChildrenByLocal(xfrm, "off")[0] : null;
              shapes.push({
                name: "table",
                phType: "body",
                text: rows.join("\n"),
                x: offsetX + Number(off?.getAttribute("x") || 0),
                y: offsetY + Number(off?.getAttribute("y") || 2000000),
                maxSz: 1600
              });
            }
          }
        }
      }
    }

    const spTree = getElsByLocal(doc, "spTree")[0];
    collectSpTree(spTree, 0, 0);

    // Fallback nếu text nằm ở cấu trúc khác (VD SmartArt/Alternate)
    if (!shapes.length) {
      const allParas = getElsByLocal(doc, "p")
        .map((p) => getElsByLocal(p, "t").map((t) => t.textContent || "").join("").trim())
        .filter(Boolean);
      if (allParas.length) {
        shapes.push({ name: "title", phType: "title", text: allParas[0], x: 0, y: 0, maxSz: 2800 });
        if (allParas.length > 1) {
          shapes.push({ name: "body", phType: "body", text: allParas.slice(1).join("\n"), x: 0, y: 1500000, maxSz: 1800 });
        }
      }
    }

    // Tìm ảnh đầu tiên trong slide (bất kể prefix namespace r:)
    let firstImgRel = "";
    for (const pic of getElsByLocal(doc, "pic")) {
      const blip = getElsByLocal(pic, "blip")[0];
      const embed = blip ? getRelAttr(blip, "embed") : "";
      if (embed) { firstImgRel = embed; break; }
    }

    let titleShape = shapes.find((s) => s.phType === "title" || s.phType === "ctrtitle" || s.name === "title");
    if (!titleShape && shapes.length) {
      titleShape = [...shapes].sort((a, b) => (b.maxSz - a.maxSz) || (a.y - b.y))[0];
    }

    const rest = shapes.filter((s) => s !== titleShape).sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const isCover = !!(titleShape && (titleShape.phType === "ctrtitle" || (rest.length <= 1 && titleShape.y > 1000000)));

    let body = "";
    let col2 = "";
    let layout = isCover ? "title" : "content";

    if (!isCover && rest.length === 2 && Math.abs(rest[0].x - rest[1].x) > 2200000) {
      const byX = [...rest].sort((a, b) => a.x - b.x);
      layout = "two-col";
      body = byX[0].text;
      col2 = byX[1].text;
    } else {
      body = rest.map((s) => s.text).join("\n\n");
    }

    return {
      title: titleShape ? titleShape.text.replace(/\n+/g, " ").trim() : "",
      body,
      col2,
      layout,
      bgHex,
      fontSize: 18,
      firstImgRel
    };
  }

  function parsePptBinarySlides(streams) {
    const data = streams?.get("PowerPoint Document");
    if (!data || data.length < 16) {
      throw new Error("Tệp .ppt định dạng cũ không đọc được cấu trúc slide. Hãy mở bằng PowerPoint và Lưu dưới dạng .pptx rồi tải lên.");
    }
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const slidesTexts = [];
    let curTexts = [];

    function walkRecords(start, end, depth = 0) {
      if (depth > 25) return;
      let pos = start;
      while (pos + 8 <= end) {
        const verInst = dv.getUint16(pos, true);
        const ver = verInst & 0x0f;
        const recType = dv.getUint16(pos + 2, true);
        const recLen = dv.getUint32(pos + 4, true);
        const bodyStart = pos + 8;
        const bodyEnd = Math.min(end, bodyStart + recLen);

        if (recType === 0x03ee) {
          // Slide Container
          const prev = curTexts;
          curTexts = [];
          walkRecords(bodyStart, bodyEnd, depth + 1);
          if (curTexts.length) slidesTexts.push(curTexts);
          curTexts = prev;
        } else if (recType === 0x0fa0 && recLen > 0) {
          // TextCharsAtom (UTF-16LE)
          const txt = tdUtf16Le.decode(data.subarray(bodyStart, bodyEnd)).replace(/\r/g, "\n").trim();
          if (txt) curTexts.push(txt);
        } else if (recType === 0x0fa8 && recLen > 0) {
          // TextBytesAtom (Latin-1 / ANSI)
          let txt = "";
          for (let i = bodyStart; i < bodyEnd; i++) txt += String.fromCharCode(data[i]);
          txt = txt.replace(/\r/g, "\n").trim();
          if (txt) curTexts.push(txt);
        } else if (ver === 0x0f) {
          // Container record
          walkRecords(bodyStart, bodyEnd, depth + 1);
        }
        if (recLen === 0 && bodyEnd === bodyStart) pos += 8;
        else pos = bodyEnd;
      }
    }

    walkRecords(0, data.length, 0);
    if (!slidesTexts.length && curTexts.length) slidesTexts.push(curTexts);
    if (!slidesTexts.length) {
      throw new Error("Không trích xuất được nội dung từ tệp .ppt cũ này. Vui lòng lưu thành .pptx rồi tải lên.");
    }
    return slidesTexts.map((parts, idx) => ({
      title: parts[0].split("\n")[0].slice(0, 120) || `Slide ${idx + 1}`,
      body: parts.slice(1).join("\n\n") || parts[0].split("\n").slice(1).join("\n"),
      col2: "",
      layout: idx === 0 ? "title" : "content",
      theme: "paper",
      fontSize: 18,
      notes: ""
    }));
  }

  async function parseSlides(arrayBuffer, filename = "slides.pptx") {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    const info = await detectKind(bytes, filename);

    if (info.kind === "json") {
      const arr = JSON.parse(decodeTextAuto(bytes));
      if (Array.isArray(arr) && arr.length) return { slides: arr, warning: "" };
      throw new Error("Tệp .json không chứa danh sách slide hợp lệ.");
    }

    if (info.kind === "ppt-bin") {
      const slides = parsePptBinarySlides(info.streams);
      return {
        slides,
        warning: "Đã đọc nội dung từ tệp .ppt cũ (PowerPoint 97–2003). Lưu sang .pptx để giữ nguyên hình ảnh & màu nền."
      };
    }

    const zip = info.zip || (await unzip(bytes));
    const themeColors = extractThemeColorMap(zip);

    // Xác định thứ tự slide bằng DOMParser (không lệ thuộc prefix p: hay r:)
    let slidePaths = [];
    const presXml = zip.getText("ppt/presentation.xml");
    const presRels = parseRels(zip.getText("ppt/_rels/presentation.xml.rels"));
    if (presXml && Object.keys(presRels).length) {
      try {
        const presDoc = parseXmlSafe(presXml);
        for (const sldId of getElsByLocal(presDoc, "sldId")) {
          const rId = getRelAttr(sldId, "id");
          const rel = presRels[rId];
          if (rel) {
            const full = normalizePath("ppt/presentation.xml", rel.target);
            if (zip.has(full)) slidePaths.push(full);
          }
        }
      } catch {}
    }

    if (!slidePaths.length) {
      slidePaths = zip.keys()
        .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    }
    if (!slidePaths.length) {
      throw new Error("Không tìm thấy slide nào trong tệp PowerPoint này.");
    }

    // Lấy màu nền mặc định từ slideMaster nếu slide không tự khai báo nền
    let masterBgHex = "";
    const masterKey = zip.keys().find((k) => /^ppt\/slideMasters\/slideMaster\d*\.xml$/i.test(k));
    if (masterKey) {
      try { masterBgHex = extractBgHexFromDoc(parseXmlSafe(zip.getText(masterKey)), themeColors); } catch {}
    }

    const slides = [];
    for (let i = 0; i < slidePaths.length; i++) {
      const spath = slidePaths[i];
      const xmlStr = zip.getText(spath);
      const parsed = parseSlideXml(xmlStr, themeColors);

      const dir = spath.slice(0, spath.lastIndexOf("/") + 1);
      const file = spath.slice(spath.lastIndexOf("/") + 1);
      const relPath = `${dir}_rels/${file}.rels`;
      const relMap = parseRels(zip.getText(relPath));

      // Lấy màu nền từ slideLayout nếu slide chưa có
      let bgHex = parsed.bgHex;
      if (!bgHex) {
        for (const rel of Object.values(relMap)) {
          if (rel.type.includes("slideLayout")) {
            const layoutPath = normalizePath(spath, rel.target);
            const layoutXml = zip.getText(layoutPath);
            if (layoutXml) {
              try { bgHex = extractBgHexFromDoc(parseXmlSafe(layoutXml), themeColors); } catch {}
            }
            break;
          }
        }
      }
      if (!bgHex) bgHex = masterBgHex;

      // Ảnh đầu tiên trong slide
      let imgData = "";
      if (parsed.firstImgRel && relMap[parsed.firstImgRel]) {
        const mediaPath = normalizePath(spath, relMap[parsed.firstImgRel].target);
        const mBytes = zip.get(mediaPath);
        if (mBytes) {
          const ext = mediaPath.split(".").pop() || "png";
          imgData = bytesToDataUrl(mBytes, ext) || "";
        }
      }

      // Ghi chú giáo viên (Speaker Notes)
      let notes = "";
      for (const rel of Object.values(relMap)) {
        if (rel.type.includes("notesSlide")) {
          const notePath = normalizePath(spath, rel.target);
          const noteXml = zip.getText(notePath);
          if (noteXml) notes = extractNotesText(noteXml);
          break;
        }
      }

      const slideObj = {
        title: parsed.title || `Slide ${i + 1}`,
        body: parsed.body || "",
        col2: parsed.col2 || "",
        layout: parsed.layout || "content",
        theme: pickThemeFromHex(bgHex),
        fontSize: parsed.fontSize || 18,
        notes
      };
      if (imgData) slideObj.img = imgData;
      slides.push(slideObj);
    }

    return { slides, warning: "" };
  }

  return {
    inflateRawJS,
    unzip,
    parseOle2Streams,
    detectKind,
    parseWord,
    parseExcel,
    parseSlides,
    parseCsvRFC4180
  };
})();
