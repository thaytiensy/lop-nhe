/* AppDialog — Hộp thoại nội bộ (Prompt / Confirm / Form) thay thế prompt()/confirm() trình duyệt
 * Tối ưu cho điện thoại & in-app browser (Zalo, Facebook), hỗ trợ Esc, Enter và kiểm tra nhập liệu nội bộ.
 */
const AppDialog = (() => {
  let activeResolver = null;
  let lastFocused = null;
  let keyHandlerBound = false;

  const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

  function closeModal(result) {
    const backdrop = $("appDialogModal");
    if (backdrop) backdrop.hidden = true;
    if (typeof document !== "undefined") {
      const anyOtherOpen = document.querySelector(".modal-backdrop:not([hidden])");
      if (!anyOtherOpen) document.body.classList.remove("modal-open");
    }
    const resolve = activeResolver;
    activeResolver = null;
    if (lastFocused && typeof lastFocused.focus === "function") {
      try { lastFocused.focus(); } catch {}
    }
    lastFocused = null;
    if (resolve) resolve(result);
  }

  function ensureBindings() {
    if (keyHandlerBound || typeof document === "undefined") return;
    keyHandlerBound = true;

    const backdrop = $("appDialogModal");
    const closeBtn = $("appDialogClose");
    const cancelBtn = $("appDialogCancel");

    if (closeBtn) closeBtn.addEventListener("click", () => closeModal(null));
    if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal(null));
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal(null);
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeResolver) {
        e.preventDefault();
        closeModal(null);
      }
    });
  }

  function openDialog({
    title = "Xác nhận",
    message = "",
    fields = [],
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    danger = false,
    mode = "confirm"
  }) {
    if (typeof document === "undefined") {
      return Promise.resolve(mode === "confirm" ? false : null);
    }
    ensureBindings();

    if (activeResolver) {
      closeModal(null);
    }

    const backdrop = $("appDialogModal");
    const titleEl = $("appDialogTitle");
    const msgEl = $("appDialogMessage");
    const fieldsEl = $("appDialogFields");
    const errEl = $("appDialogError");
    const cancelBtn = $("appDialogCancel");
    const confirmBtn = $("appDialogConfirm");
    const formEl = $("appDialogForm");

    if (!backdrop || !formEl) {
      return Promise.resolve(mode === "confirm" ? false : null);
    }

    lastFocused = document.activeElement;
    titleEl.textContent = title;
    if (message) {
      msgEl.textContent = message;
      msgEl.hidden = false;
    } else {
      msgEl.textContent = "";
      msgEl.hidden = true;
    }

    errEl.textContent = "";
    errEl.hidden = true;
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;
    confirmBtn.className = danger ? "btn btn-danger" : "btn btn-primary";

    fieldsEl.textContent = "";
    const inputs = [];
    fields.forEach((f, idx) => {
      const label = document.createElement("label");
      label.className = "field";

      const span = document.createElement("span");
      span.textContent = f.label || "";
      label.appendChild(span);

      const input = document.createElement("input");
      input.type = f.type || "text";
      input.name = f.name || `field_${idx}`;
      input.value = f.defaultValue ?? "";
      input.placeholder = f.placeholder || "";
      if (f.maxLength) input.maxLength = f.maxLength;
      input.autocomplete = "off";
      input.addEventListener("input", () => {
        if (!errEl.hidden) {
          errEl.textContent = "";
          errEl.hidden = true;
        }
      });

      label.appendChild(input);
      fieldsEl.appendChild(label);
      inputs.push({ spec: f, el: input });
    });

    return new Promise((resolve) => {
      activeResolver = (val) => {
        if (mode === "confirm") resolve(Boolean(val));
        else resolve(val);
      };

      formEl.onsubmit = (e) => {
        e.preventDefault();
        if (mode === "confirm") {
          closeModal(true);
          return;
        }
        const values = {};
        for (const item of inputs) {
          const v = item.el.value.trim();
          if (item.spec.required && !v) {
            errEl.textContent = item.spec.errorMessage || `Vui lòng nhập ${(item.spec.label || "thông tin").replace(/\s*\*$/, "").toLowerCase()}.`;
            errEl.hidden = false;
            item.el.focus();
            return;
          }
          values[item.spec.name] = v;
        }
        if (mode === "prompt") {
          closeModal(values[inputs[0].spec.name]);
        } else {
          closeModal(values);
        }
      };

      backdrop.hidden = false;
      document.body.classList.add("modal-open");

      setTimeout(() => {
        if (inputs.length > 0) {
          inputs[0].el.focus();
          inputs[0].el.select();
        } else {
          confirmBtn.focus();
        }
      }, 20);
    });
  }

  function confirm(opts = {}) {
    return openDialog({
      title: opts.title || "Xác nhận thao tác",
      message: opts.message || "",
      fields: [],
      confirmText: opts.confirmText || "Xác nhận",
      cancelText: opts.cancelText || "Hủy",
      danger: Boolean(opts.danger),
      mode: "confirm"
    });
  }

  function prompt(opts = {}) {
    return openDialog({
      title: opts.title || "Nhập thông tin",
      message: opts.message || "",
      fields: [
        {
          name: "value",
          label: opts.label || "Nội dung",
          placeholder: opts.placeholder || "",
          defaultValue: opts.defaultValue ?? "",
          required: opts.required !== false,
          maxLength: opts.maxLength
        }
      ],
      confirmText: opts.confirmText || "Lưu",
      cancelText: opts.cancelText || "Hủy",
      danger: false,
      mode: "prompt"
    });
  }

  function form(opts = {}) {
    return openDialog({
      title: opts.title || "Nhập thông tin",
      message: opts.message || "",
      fields: opts.fields || [],
      confirmText: opts.confirmText || "Lưu",
      cancelText: opts.cancelText || "Hủy",
      danger: Boolean(opts.danger),
      mode: "form"
    });
  }

  return { confirm, prompt, form };
})();
if (typeof window !== "undefined") window.AppDialog = AppDialog;
if (typeof module !== "undefined" && module.exports) module.exports = AppDialog;
