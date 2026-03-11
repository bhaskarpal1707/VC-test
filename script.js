/* ── PORTFOLIO FILTER DROPDOWN ── */
(function () {
  const dropdown = document.getElementById("filterDropdown");
  const trigger = document.getElementById("filterTrigger");
  const panel = document.getElementById("filterPanel");
  const trigText = document.getElementById("filterTriggerText");
  const clearBtn = document.getElementById("filterClear");
  const resultPill = document.getElementById("filterResultPill");
  const resultNum = document.getElementById("filterResultNum");
  const resultLbl = document.getElementById("filterResultLabel");
  const body = panel ? panel.querySelector(".filter-panel-body") : null;
  const options = body ? body.querySelectorAll(".filter-option") : [];
  const items = document.querySelectorAll(".portfolio-item");

  if (!dropdown || !trigger) return;

  /* ── Open / close ── */
  function openDropdown() {
    dropdown.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }
  function closeDropdown() {
    dropdown.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }
  function toggleDropdown() {
    dropdown.classList.contains("open") ? closeDropdown() : openDropdown();
  }

  trigger.addEventListener("click", toggleDropdown);

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) closeDropdown();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  /* ── Apply filter ── */
  function applyFilter(filter, label) {
    // Update trigger label only — icon stays the same (clapperboard)
    if (trigText) trigText.textContent = label;

    // Mark active option
    options.forEach((opt) => {
      const isActive = opt.dataset.filter === filter;
      opt.classList.toggle("active", isActive);
      opt.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Show / hide grid items
    let visible = 0;
    items.forEach((item) => {
      const match = filter === "all" || item.dataset.cat === filter;
      item.style.transition = "opacity 0.35s, transform 0.35s";
      if (match) {
        item.style.opacity = "0";
        item.style.transform = "scale(0.96)";
        setTimeout(() => {
          item.style.display = "";
          item.style.opacity = "1";
          item.style.transform = "scale(1)";
        }, 60);
        visible++;
      } else {
        item.style.opacity = "0";
        item.style.transform = "scale(0.96)";
        setTimeout(() => {
          item.style.display = "none";
        }, 350);
      }
    });

    // Update result pill
    setTimeout(() => {
      if (resultNum) resultNum.textContent = visible;
      if (resultLbl) resultLbl.textContent = visible === 1 ? "Work" : "Works";
      if (resultPill)
        resultPill.classList.toggle("has-filter", filter !== "all");
    }, 80);

    closeDropdown();
  }

  /* ── Option click ── */
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      applyFilter(opt.dataset.filter, opt.dataset.label);
    });
  });

  /* ── Clear / Reset ── */
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyFilter("all", "All Categories");
    });
  }
})();
