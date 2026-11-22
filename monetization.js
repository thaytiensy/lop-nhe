/* ==========================================================================
   ONBOARDING 3 BƯỚC, CHIA SẺ MXH & MODAL GÓI PRO / ĐẶT THIẾT KẾ RIÊNG
   ========================================================================== */
(() => {
  const ONBOARDING_KEY = "tro-ly-gvcn-onboarding-hidden-v1";
  const cfg = window.CONFIG_MONETIZATION;
  const helper = window.GvcnMonetizationHelper;
  if (!cfg || !helper) return;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function showToast(msg) {
    const stack = $("#toastStack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  /* ===================== 1. ONBOARDING 3 BƯỚC & CHIA SẺ ===================== */
  function initOnboarding() {
    const banner = $("#onboardingBanner");
    const reopenBtn = $("#btnShowOnboarding");
    const dismissBtn = $("#btnDismissOnboarding");
    const sampleBtn = $("#btnOnboardingSample");
    const shareBtn = $("#btnOnboardingShare");
    const heroSampleBtn = $("#btnHeroSample");

    if (!banner) return;

    const setHidden = (isHidden) => {
      banner.hidden = isHidden;
      if (reopenBtn) reopenBtn.hidden = !isHidden;
      try {
        localStorage.setItem(ONBOARDING_KEY, isHidden ? "1" : "0");
      } catch {}
    };

    let initiallyHidden = false;
    try {
      initiallyHidden = localStorage.getItem(ONBOARDING_KEY) === "1";
    } catch {}
    setHidden(initiallyHidden);

    dismissBtn?.addEventListener("click", () => {
      setHidden(true);
      showToast("Đã thu gọn hướng dẫn — bấm 'Hướng dẫn 3 bước' trên thanh đầu trang để mở lại");
    });

    reopenBtn?.addEventListener("click", () => {
      const dashNav = document.querySelector('.nav-item[data-view="dashboard"]');
      if (dashNav && !dashNav.classList.contains("active")) dashNav.click();
      setHidden(false);
      banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    const triggerSample = () => {
      const btn = $("#btnLoadSample");
      if (btn) btn.click();
      else showToast("Đã nạp dữ liệu mẫu lớp 3A");
    };

    sampleBtn?.addEventListener("click", triggerSample);
    heroSampleBtn?.addEventListener("click", triggerSample);

    shareBtn?.addEventListener("click", async () => {
      const text = cfg.shareText || (cfg.shareTitle + "\n" + cfg.liveUrl);
      if (navigator.share) {
        try {
          await navigator.share({
            title: cfg.shareTitle || cfg.brandName,
            text,
            url: cfg.liveUrl
          });
          showToast("Cảm ơn thầy/cô đã chia sẻ Trợ lý GVCN!");
          return;
        } catch (err) {
          if (err && err.name === "AbortError") return;
        }
      }
      const ok = await copyText(text);
      showToast(
        ok
          ? "Đã sao chép lời giới thiệu & link — dán ngay lên Zalo hoặc Facebook!"
          : "Hãy sao chép đường dẫn: " + cfg.liveUrl
      );
    });
  }

  /* ===================== 2. MODAL GÓI PRO & ĐẶT THIẾT KẾ RIÊNG ===================== */
  function renderPlans() {
    const grid = $("#proPlansGrid");
    if (!grid) return;

    grid.innerHTML = cfg.plans
      .map((plan) => {
        const cls = plan.featured ? "plan-card featured" : "plan-card";
        const btnCls = plan.featured
          ? "btn btn-primary plan-cta"
          : plan.ctaAction === "close"
          ? "btn btn-soft plan-cta"
          : "btn btn-amber plan-cta";
        const oldPriceHtml = plan.originalPrice
          ? `<div class="plan-old-row"><del class="plan-old-price">${esc(plan.originalPrice)}</del>${
              plan.promoTag ? `<span class="plan-promo-tag">${esc(plan.promoTag)}</span>` : ""
            }</div>`
          : "";
        const hintHtml = plan.priceHint
          ? `<div class="plan-price-hint">${esc(plan.priceHint)}</div>`
          : "";
        return `
          <article class="${cls}">
            <div class="plan-top">
              <span class="plan-badge ${plan.featured ? "is-hot" : plan.originalPrice ? "is-promo" : ""}">${esc(plan.badge)}</span>
              <h3>${esc(plan.name)}</h3>
              <p class="plan-sub">${esc(plan.subtitle)}</p>
            </div>
            <div class="plan-price-box">
              ${oldPriceHtml}
              <div class="plan-price">
                <strong>${esc(plan.price)}</strong>
                <span>${esc(plan.period)}</span>
              </div>
              ${hintHtml}
            </div>
            <ul class="plan-features">
              ${plan.features.map((f) => `<li><span class="pf-check">✓</span><span>${esc(f)}</span></li>`).join("")}
            </ul>
            <button
              type="button"
              class="${btnCls}"
              data-plan-action="${esc(plan.ctaAction)}"
              data-plan-service="${esc(plan.serviceValue || "")}"
            >${esc(plan.ctaLabel)}</button>
          </article>
        `;
      })
      .join("");

    const disclaimerEl = $("#proPriceDisclaimer");
    if (disclaimerEl) disclaimerEl.textContent = cfg.pricingDisclaimer || "";
  }

  function renderComparison() {
    const tbody = $("#proCompareBody");
    if (!tbody) return;
    tbody.innerHTML = cfg.comparison
      .map(
        (row) => `
          <tr>
            <td><strong>${esc(row.feature)}</strong></td>
            <td>${esc(row.free)}</td>
            <td class="col-pro">${esc(row.pro)}</td>
            <td>${esc(row.custom)}</td>
          </tr>
        `
      )
      .join("");
  }

  function renderContactStatus() {
    const box = $("#proContactBar");
    if (!box) return;

    const parts = [];
    if (!helper.isPlaceholder(cfg.authorLabel)) {
      parts.push(`<span class="contact-chip">👤 <strong>${esc(cfg.authorLabel)}</strong></span>`);
    }
    if (helper.hasLivePhone()) {
      const phoneHtml = helper.hasLiveZalo()
        ? `<a class="contact-link" href="${esc(cfg.zaloUrl.trim())}" target="_blank" rel="noopener noreferrer">${esc(cfg.zaloPhone)}</a>`
        : `<strong>${esc(cfg.zaloPhone)}</strong>`;
      parts.push(`<span class="contact-chip">📞 Zalo / SĐT: ${phoneHtml}</span>`);
    }
    if (helper.hasLiveEmail()) {
      parts.push(
        `<span class="contact-chip">✉ <a class="contact-link" href="mailto:${esc(cfg.email.trim())}">${esc(cfg.email)}</a></span>`
      );
    }
    if (helper.hasLiveFacebook()) {
      parts.push(
        `<span class="contact-chip">💬 <a class="contact-link" href="${esc(cfg.facebookUrl.trim())}" target="_blank" rel="noopener noreferrer">Facebook</a></span>`
      );
    }
    if (cfg.supportHours) {
      parts.push(`<span class="contact-chip">🕒 ${esc(cfg.supportHours)}</span>`);
    }

    box.className = "contact-status-bar is-live";
    box.innerHTML =
      `<div class="contact-chips">${parts.join("")}</div>` +
      (helper.hasLivePayment()
        ? `<div class="contact-pay-note">⚡ ${esc(cfg.paymentNote)}</div>`
        : "");
  }

  function populateServices() {
    const sel = $("#inqService");
    if (!sel) return;
    sel.innerHTML = cfg.services
      .map((s) => `<option value="${esc(s)}">${esc(s)}</option>`)
      .join("");
  }

  function prefillFromProfile() {
    const nameEl = $("#inqName");
    const schoolEl = $("#inqSchool");
    const phoneEl = $("#inqPhone");

    const profTeacher = ($("#profTeacher")?.value || "").trim();
    const profRole = ($("#profRole")?.value || "").trim();
    const profSchool = ($("#profSchool")?.value || "").trim();
    const profPhone = ($("#profPhone")?.value || "").trim();
    const activeClass = ($("#activeClassSelect")?.selectedOptions?.[0]?.textContent || "").trim();

    if (nameEl && !nameEl.value && profTeacher && profTeacher !== "Nguyễn Thị Lan") {
      nameEl.value = profRole ? `${profRole} ${profTeacher}` : profTeacher;
    }
    if (schoolEl && !schoolEl.value && profSchool && profSchool !== "Trường Tiểu học Bình Minh") {
      schoolEl.value = activeClass ? `${profSchool} — ${activeClass}` : profSchool;
    }
    if (phoneEl && !phoneEl.value && profPhone && profPhone !== "0912 345 678") {
      phoneEl.value = profPhone;
    }
  }

  function buildInquiryMessage() {
    const service = $("#inqService")?.value || cfg.services[0];
    const name = ($("#inqName")?.value || "").trim() || "(Chưa nhập họ tên)";
    const school = ($("#inqSchool")?.value || "").trim() || "(Chưa nhập tên trường/lớp)";
    const phone = ($("#inqPhone")?.value || "").trim() || "(Chưa nhập SĐT/Zalo)";
    const scale = ($("#inqScale")?.value || "").trim() || "1 lớp (GVCN cá nhân)";
    const note = ($("#inqNote")?.value || "").trim();

    const lines = [
      `[YÊU CẦU TƯ VẤN — ${cfg.brandName.toUpperCase()}]`,
      `• Nhu cầu: ${service}`,
      `• Người liên hệ: ${name}`,
      `• Đơn vị / Trường: ${school}`,
      `• SĐT / Zalo: ${phone}`,
      `• Quy mô dự kiến: ${scale}`
    ];
    if (note) lines.push(`• Yêu cầu chi tiết: ${note}`);
    lines.push(`• Nguồn: ${cfg.liveUrl}`);
    return lines.join("\n");
  }

  function updateInquiryPreview() {
    const out = $("#inqPreview");
    if (out) out.value = buildInquiryMessage();
  }

  function openProModal(preselectService) {
    const modal = $("#proModal");
    if (!modal) return;
    prefillFromProfile();
    if (preselectService && $("#inqService")) {
      $("#inqService").value = preselectService;
    }
    updateInquiryPreview();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $("#sidebar")?.classList.remove("open");
    const sbBackdrop = $("#sidebarBackdrop");
    if (sbBackdrop) sbBackdrop.hidden = true;
    $("#btnCloseProModal")?.focus();
  }

  function closeProModal() {
    const modal = $("#proModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function initProModal() {
    const modal = $("#proModal");
    if (!modal) return;

    renderPlans();
    renderComparison();
    renderContactStatus();
    populateServices();
    updateInquiryPreview();

    // Cập nhật nhãn nút Zalo / Email hiển thị rõ số & email thật
    const btnZalo = $("#btnSendZalo");
    if (btnZalo && helper.hasLivePhone()) {
      btnZalo.textContent = `💬 Nhắn Zalo ${cfg.zaloPhone}`;
      if (helper.hasLiveZalo()) btnZalo.dataset.href = cfg.zaloUrl.trim();
    }
    const btnEmail = $("#btnSendEmail");
    if (btnEmail && helper.hasLiveEmail()) {
      btnEmail.title = `Gửi yêu cầu tới ${cfg.email}`;
    }

    // Nút mở modal không gây phiền
    ["#btnTopbarPro", "#btnSidebarPro", "#btnDashboardPro", "#brandProBadge"].forEach((sel) => {
      $(sel)?.addEventListener("click", () => openProModal());
    });

    $("#btnDashboardCustomApp")?.addEventListener("click", () => {
      openProModal("Thiết kế riêng Trường & App (Từ 1.990.000đ/gói)");
      setTimeout(() => {
        $("#proInquirySection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });

    // Đóng modal
    $("#btnCloseProModal")?.addEventListener("click", closeProModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeProModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeProModal();
    });

    // Click nút chọn gói
    $("#proPlansGrid")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-plan-action]");
      if (!btn) return;
      if (btn.dataset.planAction === "close") {
        closeProModal();
        showToast("Thầy/cô đang sử dụng đầy đủ tính năng lõi của Bản Cơ bản miễn phí!");
        return;
      }
      if (btn.dataset.planService && $("#inqService")) {
        $("#inqService").value = btn.dataset.planService;
        updateInquiryPreview();
      }
      $("#proInquirySection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      $("#inqName")?.focus();
      showToast(`Đã chọn: ${btn.dataset.planService || "Tư vấn nâng cấp"}`);
    });

    // Cập nhật live preview khi gõ form
    ["#inqService", "#inqName", "#inqSchool", "#inqPhone", "#inqScale", "#inqNote"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener("input", updateInquiryPreview);
      el.addEventListener("change", updateInquiryPreview);
    });

    // Sao chép nội dung yêu cầu
    $("#btnCopyInquiry")?.addEventListener("click", async () => {
      const msg = buildInquiryMessage();
      const ok = await copyText(msg);
      showToast(
        ok
          ? `Đã sao chép nội dung yêu cầu — dán gửi Zalo ${cfg.zaloPhone} ngay nhé!`
          : "Không thể tự động sao chép, vui lòng bôi đen ô nội dung bên trên."
      );
    });

    // Mở Zalo tư vấn
    btnZalo?.addEventListener("click", async () => {
      const msg = buildInquiryMessage();
      await copyText(msg);
      if (helper.hasLiveZalo()) {
        window.open(cfg.zaloUrl.trim(), "_blank", "noopener,noreferrer");
        showToast(`Đã sao chép yêu cầu & mở Zalo ${cfg.zaloPhone} — chỉ cần dán (Ctrl+V) và gửi!`);
      } else {
        showToast("Đã sao chép nội dung yêu cầu!");
      }
    });

    // Mở Email tư vấn
    btnEmail?.addEventListener("click", async () => {
      const msg = buildInquiryMessage();
      await copyText(msg);
      if (helper.hasLiveEmail()) {
        const subject = encodeURIComponent(`[Trợ lý GVCN] Yêu cầu tư vấn: ${$("#inqService")?.value || ""}`);
        const body = encodeURIComponent(msg);
        window.location.href = `mailto:${cfg.email.trim()}?subject=${subject}&body=${body}`;
        showToast(`Đang mở Email tới ${cfg.email} (nội dung đã được sao chép sẵn)`);
      } else {
        showToast("Đã sao chép nội dung yêu cầu!");
      }
    });
  }

  initOnboarding();
  initProModal();
})();
