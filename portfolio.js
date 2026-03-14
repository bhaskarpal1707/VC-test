(function () {
  /* ============================================================
     CONFIG — paste your Google Sheet ID and Sheet tab names here
     Make sure the sheet is shared as "Anyone with the link can view"
  ============================================================ */
  const SHEET_ID = "1b6sFVLVnZHtmuKxlQZ5MryEjtkGgaA4a6GqX8ZDb3ME"; // ← replace
  const BRANDS_TAB = "Brands"; // exact tab/sheet name for brands table
  const WORKS_TAB = "Works"; // exact tab/sheet name for works table

  const BRANDS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(BRANDS_TAB)}`;
  const WORKS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(WORKS_TAB)}`;

  /* ── CSV parser ── */
  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = splitCSVRow(lines[0]).map((h) =>
      h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"),
    );
    return lines
      .slice(1)
      .map((line) => {
        const vals = splitCSVRow(line);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (vals[i] || "").replace(/^"|"$/g, "").trim();
        });
        return obj;
      })
      .filter((r) => Object.values(r).some((v) => v));
  }

  function splitCSVRow(row) {
    const result = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  /* ── Category emoji fallback map ── */
  const catEmoji = {
    "brand film": "🎬",
    "social media": "📱",
    commercial: "🛍",
    "music video": "🎵",
    agency: "✦",
    "short film": "🎞",
    default: "🎬",
  };

  function getEmoji(cat) {
    return catEmoji[(cat || "").toLowerCase()] || catEmoji.default;
  }

  /* ── Render Brands Carousel ── */
  function renderBrands(brands) {
    const track = document.getElementById("brandsTrack");
    if (!track) return;
    // build two sets for infinite scroll
    let html = "";
    [1, 2].forEach(() => {
      brands.forEach((b) => {
        const initial = (b.brand_name || "?")[0].toUpperCase();
        const imgHTML = b.brand_image_url
          ? `<img src="${b.brand_image_url}" alt="${b.brand_name}" class="brand-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="brand-mark" style="display:none">${initial}</div>`
          : `<div class="brand-mark">${initial}</div>`;
        html += `<div class="brand-item">
          <div class="brand-logo">${imgHTML}</div>
        </div>`;
      });
    });
    track.innerHTML = html;
  }

  /* ── Render Brand Filter Options ── */
  function renderBrandFilters(brands) {
    const body = document.getElementById("filterPanelBody");
    if (!body) return;
    brands.forEach((b) => {
      const slug = b.brand_name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const imgHTML = b.brand_image_url
        ? `<img src="${b.brand_image_url}" alt="${b.brand_name}" style="width:20px;height:20px;object-fit:contain;border-radius:2px;display:block" onerror="this.style.display='none'">`
        : `<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--gold)">${b.brand_name[0]}</div>`;
      const opt = document.createElement("div");
      opt.className = "filter-option";
      opt.setAttribute("data-filter", slug);
      opt.setAttribute("data-label", b.brand_name);
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-selected", "false");
      opt.innerHTML = `
        <div class="filter-option-icon">${imgHTML}</div>
        <div class="filter-option-info">
          <div class="filter-option-name">${b.brand_name}</div>
          <div class="filter-option-desc">Selected works</div>
        </div>
        <div class="filter-option-check"></div>`;
      body.appendChild(opt);
    });
    rebindFilterOptions();
  }

  /* ── Render Portfolio Grid ── */
  function renderPortfolio(works, brands, activeFilter) {
    const grid = document.getElementById("portfolioGrid");
    if (!grid) return;

    const brandMap = {};
    brands.forEach((b) => {
      const slug = b.brand_name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      brandMap[slug] = b;
    });

    const filtered =
      activeFilter === "all"
        ? works
        : works.filter((w) => {
            const slug = (w.brand_name || "")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            return slug === activeFilter;
          });

    document.getElementById("filterResultNum").textContent = filtered.length;
    document.getElementById("filterResultLabel").textContent =
      filtered.length === 1 ? "Work" : "Works";

    if (!filtered.length) {
      grid.innerHTML = `<div class="portfolio-loading"><span>No works found for this brand.</span></div>`;
      return;
    }

    // height classes cycle
    const heights = [
      "ph-tall",
      "ph-short",
      "ph-med",
      "ph-med",
      "ph-tall",
      "ph-short",
    ];

    grid.innerHTML = filtered
      .map((w, i) => {
        const brandSlug = (w.brand_name || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const brand = brandMap[brandSlug] || null;
        const hClass = heights[i % heights.length];
        const emoji = getEmoji(w.category);

        const thumbHTML = w.thumbnail_url
          ? `<img src="${w.thumbnail_url}" alt="${w.title}" class="portfolio-thumb-img" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'portfolio-thumb-fallback\\'>${emoji}</div>'">`
          : `<div class="portfolio-thumb-fallback">${emoji}</div>`;

        const brandTagHTML = brand
          ? `<div class="portfolio-brand-tag">${brand.brand_image_url ? `<img src="${brand.brand_image_url}" alt="${brand.brand_name}" onerror="this.style.display='none'">` : ""}<span>${brand.brand_name}</span></div>`
          : "";

        return `<div class="portfolio-item" data-brand="${brandSlug}" data-index="${i}" style="cursor:none">
        <div class="portfolio-thumb ${hClass}">${thumbHTML}</div>
        ${brandTagHTML}
        <div class="portfolio-overlay">
          <div class="p-cat">${w.category || "Work"}</div>
          <div class="p-title">${w.title || "Untitled"}</div>
          <div class="p-arrow">↗</div>
        </div>
      </div>`;
      })
      .join("");

    // bind click → lightbox
    grid.querySelectorAll(".portfolio-item").forEach((item) => {
      item.addEventListener("click", () => {
        const idx = parseInt(item.getAttribute("data-index"));
        openLightbox(filtered[idx], brandMap);
      });
    });
  }

  /* ── Lightbox ── */
  function openLightbox(work, brandMap) {
    const lb = document.getElementById("pfLightbox");
    const brandSlug = (work.brand_name || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const brand = brandMap[brandSlug] || null;

    document.getElementById("pfLbBrand").innerHTML = brand
      ? `${brand.brand_image_url ? `<img src="${brand.brand_image_url}" alt="${brand.brand_name}" onerror="this.style.display='none'">` : ""} ${brand.brand_name}`
      : work.brand_name || "";
    document.getElementById("pfLbTitle").textContent = work.title || "Untitled";
    document.getElementById("pfLbCat").textContent = work.category || "";
    document.getElementById("pfLbDesc").textContent = work.description || "";

    const link = document.getElementById("pfLbLink");
    link.href = work.video_url || "#";
    link.style.display = work.video_url ? "inline-flex" : "none";

    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const lb = document.getElementById("pfLightbox");
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document
    .getElementById("pfLightboxClose")
    ?.addEventListener("click", closeLightbox);
  document
    .getElementById("pfLightboxBackdrop")
    ?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  /* ── Filter UI ── */
  let activeFilter = "all";
  let allWorks = [],
    allBrands = [];

  const trigger = document.getElementById("filterTrigger");
  const panel = document.getElementById("filterPanel");
  const clearBtn = document.getElementById("filterClear");

  trigger?.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    trigger.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("filterDropdown")?.contains(e.target)) {
      panel?.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
    }
  });

  clearBtn?.addEventListener("click", () => {
    setFilter("all", "All Brands");
    panel?.classList.remove("open");
  });

  function setFilter(slug, label) {
    activeFilter = slug;
    document.getElementById("filterTriggerText").textContent = label;
    document.querySelectorAll(".filter-option").forEach((o) => {
      const sel = o.getAttribute("data-filter") === slug;
      o.classList.toggle("active", sel);
      o.setAttribute("aria-selected", sel);
    });
    renderPortfolio(allWorks, allBrands, activeFilter);
  }

  function rebindFilterOptions() {
    document.querySelectorAll(".filter-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const slug = opt.getAttribute("data-filter");
        const label = opt.getAttribute("data-label");
        setFilter(slug, label);
        panel?.classList.remove("open");
        trigger?.setAttribute("aria-expanded", "false");
      });
    });
  }

  rebindFilterOptions(); // bind the "All Work" option that's already in DOM

  /* ── CSS for brand-logo-img ── */
  const style = document.createElement("style");
  style.textContent = `.brand-logo-img{width:180px;height:180px;object-fit:contain;}`;
  document.head.appendChild(style);

  /* ── Fetch & Init ── */
  async function init() {
    try {
      const [brandsText, worksText] = await Promise.all([
        fetch(BRANDS_CSV_URL).then((r) => r.text()),
        fetch(WORKS_CSV_URL).then((r) => r.text()),
      ]);

      allBrands = parseCSV(brandsText);
      allWorks = parseCSV(worksText);

      renderBrands(allBrands);
      renderBrandFilters(allBrands);
      renderPortfolio(allWorks, allBrands, "all");
    } catch (err) {
      console.error("Sheets fetch error:", err);
      document.getElementById("portfolioGrid").innerHTML =
        `<div class="portfolio-loading"><span>Could not load works. Check Sheet ID & permissions.</span></div>`;
      document.getElementById("brandsTrack").innerHTML =
        `<div class="brands-loading">Could not load brands.</div>`;
    }
  }

  init();
})();
