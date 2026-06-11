/* Catalogue POS — FPVD */

const IMAGE_EXTENSIONS = ["jpg", "png", "webp"];
const PLACEHOLDER = "images/placeholder.svg";

const state = {
  catalogue: null,
  brand: "all", // id de marque ou "all"
  query: "",
};

const $ = (sel) => document.querySelector(sel);

init();

async function init() {
  const res = await fetch("data/catalogue.json");
  state.catalogue = await res.json();

  const d = new Date(state.catalogue.updatedAt);
  $("#updated-at").textContent =
    "Mise à jour : " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  renderFilters();
  render();

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  $("#btn-pdf").addEventListener("click", printCatalogue);
}

/* ---------- Filtres marques ---------- */

function renderFilters() {
  const wrap = $("#brand-filters");
  const chips = [{ id: "all", name: "Toutes les marques" }, ...state.catalogue.brands];
  wrap.innerHTML = "";
  for (const b of chips) {
    const btn = document.createElement("button");
    btn.className = "chip" + (state.brand === b.id ? " active" : "");
    btn.textContent = b.name;
    btn.addEventListener("click", () => {
      state.brand = b.id;
      renderFilters();
      render();
    });
    wrap.appendChild(btn);
  }
}

/* ---------- Grille ---------- */

function visibleItems() {
  const brandName =
    state.brand === "all"
      ? null
      : state.catalogue.brands.find((b) => b.id === state.brand)?.name;

  return state.catalogue.items.filter((item) => {
    if (brandName && item.brand !== brandName) return false;
    if (state.query) {
      const haystack = [item.brand, item.name, item.subElement, item.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(state.query)) return false;
    }
    return true;
  });
}

function render() {
  const items = visibleItems();
  const grid = $("#grid");
  grid.innerHTML = "";

  $("#result-count").textContent =
    items.length + (items.length > 1 ? " articles" : " article");
  $("#empty").hidden = items.length > 0;

  for (const item of items) {
    grid.appendChild(card(item));
  }
}

function card(item) {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <div class="card-img">${imgTag(item)}</div>
    <div class="card-body">
      <span class="card-brand">${esc(item.brand)}</span>
      <span class="card-name">${esc(item.name || "—")}</span>
      ${item.subElement ? `<span class="card-sub">${esc(item.subElement)}</span>` : ""}
      ${item.code ? `<span class="card-code">Réf. ${esc(item.code)}</span>` : ""}
      <div class="card-footer">
        <span class="card-price">${esc(item.price || "Prix sur demande")}</span>
        ${item.uvc ? `<span class="card-uvc">${esc(item.uvc)}</span>` : ""}
      </div>
    </div>`;
  return el;
}

/* Essaie images/<code>.jpg puis .png, .webp, puis le placeholder. */
function imgTag(item) {
  if (!item.image) {
    return `<img src="${PLACEHOLDER}" alt="" loading="lazy">`;
  }
  const fallbacks = IMAGE_EXTENSIONS.slice(1)
    .map((ext) => `images/${item.image}.${ext}`)
    .concat(PLACEHOLDER);
  return `<img src="images/${item.image}.${IMAGE_EXTENSIONS[0]}"
    data-fallbacks='${JSON.stringify(fallbacks)}'
    onerror="nextFallback(this)" alt="${esc(item.name || "")}" loading="lazy">`;
}

function nextFallback(img) {
  const fallbacks = JSON.parse(img.dataset.fallbacks || "[]");
  if (fallbacks.length === 0) {
    img.onerror = null;
    return;
  }
  img.src = fallbacks.shift();
  img.dataset.fallbacks = JSON.stringify(fallbacks);
}
window.nextFallback = nextFallback;

/* ---------- Catalogue PDF ---------- */

function printCatalogue() {
  const items = visibleItems();
  if (items.length === 0) return;

  const isAll = state.brand === "all" && !state.query;
  const title = isAll
    ? "Catalogue général"
    : state.brand !== "all"
      ? state.catalogue.brands.find((b) => b.id === state.brand).name
      : "Sélection";

  // Regroupe par marque (dans l'ordre du référentiel)
  const groups = state.catalogue.brands
    .map((b) => ({ brand: b.name, items: items.filter((i) => i.brand === b.name) }))
    .filter((g) => g.items.length > 0);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  let html = `
    <div class="print-cover">
      <h1>${esc(title)}</h1>
      <div class="rule"></div>
      <p class="cover-sub">Objets promotionnels &amp; publicitaires</p>
      <p class="cover-date">${dateStr} — ${items.length} article${items.length > 1 ? "s" : ""}</p>
    </div>`;

  for (const g of groups) {
    html += `
      <section class="print-section">
        <h2 class="print-brand-title">${esc(g.brand)}</h2>
        <div class="print-grid">
          ${g.items.map(printCard).join("")}
        </div>
      </section>`;
  }

  html += `<p class="print-footer-note">Document interne — ne pas diffuser. Prix de vente conseillés, ${dateStr}.</p>`;

  const view = $("#print-view");
  view.innerHTML = html;

  // Laisse le temps aux images (ou placeholders) de se charger avant l'impression
  const imgs = [...view.querySelectorAll("img")];
  Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", resolve);
          img.addEventListener("error", resolve);
          setTimeout(resolve, 3000);
        })
    )
  ).then(() => window.print());
}

function printCard(item) {
  return `
    <div class="print-card">
      <div class="card-img">${imgTag(item)}</div>
      <div class="p-body">
        <div class="p-name">${esc(item.name || "—")}</div>
        ${item.subElement ? `<div class="p-sub">${esc(item.subElement)}</div>` : ""}
        <div class="p-line">
          <span class="p-price">${esc(item.price || "Prix sur demande")}</span>
          ${item.uvc ? `<span class="p-uvc">${esc(item.uvc)}</span>` : ""}
        </div>
        ${item.code ? `<div class="p-code">Réf. ${esc(item.code)}</div>` : ""}
      </div>
    </div>`;
}

/* ---------- Utilitaires ---------- */

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
