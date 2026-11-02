/* Shop page: category, price, rating filters + search + sorting */
document.addEventListener("DOMContentLoaded", () => {
  const MAX_PRICE = 150000;
  const MIN_PRICE = 1000;
  const params = new URLSearchParams(location.search);
  const validSorts = ["featured", "price-asc", "price-desc", "rating", "discount", "popular"];
  const validRatings = [0, 3.5, 4, 4.5];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const catParam = (params.get("category") || "")
    .split(",")
    .map(slug => slug.trim())
    .filter(slug => CATEGORIES.some(cat => cat.slug === slug));
  const ratingParam = Number(params.get("rating")) || 0;

  const state = {
    q: (params.get("q") || "").trim(),
    cats: [...new Set(catParam)],
    maxPrice: clamp(Number(params.get("max")) || MAX_PRICE, MIN_PRICE, MAX_PRICE),
    rating: validRatings.includes(ratingParam) ? ratingParam : 0,
    sort: validSorts.includes(params.get("sort")) ? params.get("sort") : "featured"
  };

  const els = {
    grid: document.getElementById("shopGrid"),
    categoryFilters: document.getElementById("categoryFilters"),
    ratingFilters: document.getElementById("ratingFilters"),
    priceRange: document.getElementById("priceRange"),
    priceReadout: document.getElementById("priceReadout"),
    sortSelect: document.getElementById("sortSelect"),
    resultsNote: document.getElementById("resultsNote"),
    title: document.getElementById("shopTitle"),
    subtitle: document.getElementById("shopSubtitle"),
    countChip: document.getElementById("shopCountChip"),
    chips: document.getElementById("activeChips"),
    searchSummary: document.getElementById("searchSummary"),
    clearFilters: document.getElementById("clearFilters"),
    filterToggle: document.getElementById("filterToggle"),
    filterCount: document.getElementById("filterCount"),
    filters: document.getElementById("filters")
  };

  /* ---------- build filter controls ---------- */
  els.categoryFilters.innerHTML = CATEGORIES.map(cat => `
    <label class="check-row">
      <input type="checkbox" name="category" value="${cat.slug}" ${state.cats.includes(cat.slug) ? "checked" : ""}>
      <span>${cat.name}</span>
      <span class="filter-count">${productCount(cat.slug)}</span>
    </label>`).join("");

  els.priceRange.value = String(state.maxPrice);
  els.priceReadout.textContent = state.maxPrice >= MAX_PRICE ? "Rs 150,000" : money(state.maxPrice);
  els.sortSelect.value = state.sort;
  const ratingRadio = els.ratingFilters.querySelector(`input[value="${state.rating}"]`);
  if (ratingRadio) ratingRadio.checked = true;

  /* ---------- filtering + sorting ---------- */
  function matches(product) {
    if (state.cats.length && !state.cats.includes(product.category)) return false;
    if (product.price > state.maxPrice) return false;
    if (state.rating && product.rating < state.rating) return false;
    if (state.q) {
      const haystack = `${product.name} ${product.brand} ${categoryName(product.category)} ${product.city} ${product.blurb}`.toLowerCase();
      const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every(term => haystack.includes(term))) return false;
    }
    return true;
  }

  function sortProducts(list) {
    const sorted = [...list];
    switch (state.sort) {
      case "price-asc": return sorted.sort((a, b) => a.price - b.price);
      case "price-desc": return sorted.sort((a, b) => b.price - a.price);
      case "rating": return sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      case "discount": return sorted.sort((a, b) => discountPercent(b) - discountPercent(a));
      case "popular": return sorted.sort((a, b) => b.sold - a.sold);
      default: return sorted;
    }
  }

  function buildUrl() {
    const url = new URL(location.href);
    url.search = "";
    if (state.q) url.searchParams.set("q", state.q);
    if (state.cats.length) url.searchParams.set("category", state.cats.join(","));
    if (state.maxPrice < MAX_PRICE) url.searchParams.set("max", String(state.maxPrice));
    if (state.rating) url.searchParams.set("rating", String(state.rating));
    if (state.sort !== "featured") url.searchParams.set("sort", state.sort);
    try { history.replaceState(null, "", url); } catch (err) { /* file:// preview */ }
  }

  function renderChips() {
    const chips = [];
    if (state.q) {
      chips.push(`<span class="active-chip">Search: ${escapeHtml(state.q)} <button type="button" data-remove="q" aria-label="Clear search">×</button></span>`);
    }
    state.cats.forEach(slug => {
      chips.push(`<span class="active-chip">${escapeHtml(categoryName(slug))} <button type="button" data-remove="cat" data-value="${slug}" aria-label="Remove ${escapeHtml(categoryName(slug))} filter">×</button></span>`);
    });
    if (state.maxPrice < MAX_PRICE) {
      chips.push(`<span class="active-chip">Under ${money(state.maxPrice)} <button type="button" data-remove="price" aria-label="Remove price filter">×</button></span>`);
    }
    if (state.rating) {
      chips.push(`<span class="active-chip">${state.rating}★ &amp; up <button type="button" data-remove="rating" aria-label="Remove rating filter">×</button></span>`);
    }
    els.chips.hidden = chips.length === 0;
    els.chips.innerHTML = chips.join("");
    els.filterCount.textContent = chips.length ? `(${chips.length})` : "";
    els.filterCount.hidden = chips.length === 0;
  }

  function render() {
    const results = sortProducts(PRODUCTS.filter(matches));
    renderProducts(els.grid, results);

    els.resultsNote.innerHTML = `Showing <strong>${results.length}</strong> of ${PRODUCTS.length} products`;
    els.countChip.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 4h13v12H1zM14 9h4l3 3.5V16h-7z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/></svg> Free delivery over Rs 2,500`;

    if (state.q) {
      els.title.textContent = "Search results";
      els.subtitle.innerHTML = `${results.length} ${results.length === 1 ? "product" : "products"} matching “${escapeHtml(state.q)}”`;
      els.searchSummary.hidden = false;
      els.searchSummary.innerHTML = `Searching for <strong>“${escapeHtml(state.q)}”</strong> <span class="muted">·</span> <a href="#" id="clearSearch">Clear search</a>`;
      document.title = `Search results — Bazaar.pk`;
    } else if (state.cats.length === 1) {
      els.title.textContent = categoryName(state.cats[0]);
      els.subtitle.textContent = `Shop ${results.length} handpicked ${categoryName(state.cats[0]).toLowerCase()} picks, delivered to your door.`;
      els.searchSummary.hidden = true;
      document.title = `${categoryName(state.cats[0])} — Bazaar.pk`;
    } else {
      els.title.textContent = "All products";
      els.subtitle.textContent = "Everything from lawn suits to laptops — delivered across Pakistan with COD.";
      els.searchSummary.hidden = true;
      document.title = "Shop All Products — Bazaar.pk";
    }

    renderChips();
    buildUrl();
  }

  /* ---------- events ---------- */
  els.categoryFilters.addEventListener("change", () => {
    state.cats = [...els.categoryFilters.querySelectorAll("input:checked")].map(input => input.value);
    render();
  });

  els.ratingFilters.addEventListener("change", event => {
    if (event.target.name === "rating") {
      state.rating = Number(event.target.value);
      render();
    }
  });

  els.priceRange.addEventListener("input", () => {
    state.maxPrice = Number(els.priceRange.value);
    els.priceReadout.textContent = state.maxPrice >= MAX_PRICE ? "Rs 150,000" : money(state.maxPrice);
    render();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    render();
  });

  els.clearFilters.addEventListener("click", () => {
    state.cats = [];
    state.rating = 0;
    state.maxPrice = MAX_PRICE;
    state.q = "";
    els.categoryFilters.querySelectorAll("input").forEach(input => { input.checked = false; });
    const anyRating = els.ratingFilters.querySelector('input[value="0"]');
    if (anyRating) anyRating.checked = true;
    els.priceRange.value = String(MAX_PRICE);
    els.priceReadout.textContent = "Rs 150,000";
    const siteSearch = document.getElementById("siteSearch");
    if (siteSearch) siteSearch.value = "";
    render();
  });

  els.chips.addEventListener("click", event => {
    const btn = event.target.closest("[data-remove]");
    if (!btn) return;
    if (btn.dataset.remove === "q") {
      state.q = "";
      const siteSearch = document.getElementById("siteSearch");
      if (siteSearch) siteSearch.value = "";
    }
    if (btn.dataset.remove === "cat") {
      state.cats = state.cats.filter(slug => slug !== btn.dataset.value);
      const input = els.categoryFilters.querySelector(`input[value="${btn.dataset.value}"]`);
      if (input) input.checked = false;
    }
    if (btn.dataset.remove === "price") {
      state.maxPrice = MAX_PRICE;
      els.priceRange.value = String(MAX_PRICE);
      els.priceReadout.textContent = "Rs 150,000";
    }
    if (btn.dataset.remove === "rating") {
      state.rating = 0;
      const anyRating = els.ratingFilters.querySelector('input[value="0"]');
      if (anyRating) anyRating.checked = true;
    }
    render();
  });

  els.searchSummary.addEventListener("click", event => {
    if (event.target.id === "clearSearch") {
      event.preventDefault();
      state.q = "";
      const siteSearch = document.getElementById("siteSearch");
      if (siteSearch) siteSearch.value = "";
      render();
    }
  });

  els.filterToggle.addEventListener("click", () => {
    const open = els.filters.classList.toggle("is-open");
    els.filterToggle.setAttribute("aria-expanded", String(open));
  });

  render();
});
