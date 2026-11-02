/* Product detail page */
document.addEventListener("DOMContentLoaded", () => {
  const detail = document.getElementById("productDetail");
  const crumbs = document.getElementById("productCrumbs");
  const relatedSection = document.getElementById("relatedSection");
  const relatedGrid = document.getElementById("relatedGrid");
  const id = new URLSearchParams(location.search).get("id");
  const product = id ? getProduct(id) : null;

  if (!product) {
    document.title = "Product not found — Bazaar.pk";
    crumbs.innerHTML = `
      <a href="index.html">Home</a><span class="sep">/</span>
      <a href="shop.html">Shop</a><span class="sep">/</span>
      <span aria-current="page">Not found</span>`;
    detail.innerHTML = `
      <div class="empty-state" style="margin:30px 0 60px">
        <div class="empty-emoji">🛍️</div>
        <h1>We couldn't find that product</h1>
        <p>The link may be old, or the product may have sold out.</p>
        <a class="btn btn-primary" href="shop.html">Browse all products</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — ${product.brand} | Bazaar.pk`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", `${product.blurb} Buy online at Bazaar.pk with cash on delivery in Pakistan.`);

  crumbs.innerHTML = `
    <a href="index.html">Home</a><span class="sep">/</span>
    <a href="shop.html">Shop</a><span class="sep">/</span>
    <a href="shop.html?category=${product.category}">${categoryName(product.category)}</a><span class="sep">/</span>
    <span aria-current="page">${escapeHtml(product.name)}</span>`;

  const pct = discountPercent(product);
  const saveAmount = product.oldPrice ? product.oldPrice - product.price : 0;
  const wished = isWished(product.id);
  const thumbs = [
    { g1: product.tint[0], g2: product.tint[1], label: "Front" },
    { g1: product.tint[1], g2: product.tint[0], label: "Detail" },
    { g1: "#ffffff", g2: product.tint[0], label: "Packaging" },
    { g1: product.tint[1], g2: "#f8faf9", label: "In use" }
  ];

  const optionGroup = (label, options, type, selected) => `
    <div class="option-group">
      <div class="option-group-head">
        <strong>${label}</strong>
        <span>Selected: <b data-selected-${type}>${escapeHtml(selected)}</b></span>
      </div>
      <div class="option-row">
        ${options.map((option, index) => `
          <button type="button" class="option-chip ${index === 0 ? "is-active" : ""}" data-option="${type}" data-value="${escapeHtml(option)}" aria-pressed="${index === 0}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </div>`;

  detail.innerHTML = `
    <div class="product-layout">
      <div class="gallery">
        <div class="gallery-main" id="galleryMain" style="--g1:${thumbs[0].g1};--g2:${thumbs[0].g2}">
          <div class="gallery-badges">
            <span class="gallery-badge assured">✓ Bazaar.pk Assured</span>
            ${product.badge ? `<span class="gallery-badge">${escapeHtml(product.badge)}</span>` : ""}
            ${pct ? `<span class="gallery-badge">-${pct}% today</span>` : ""}
          </div>
          <button class="gallery-wish ${wished ? "is-wished" : ""}" type="button" data-wish="${product.id}"
            aria-label="${wished ? "Remove" : "Save"} ${escapeHtml(product.name)} ${wished ? "from" : "to"} wishlist" aria-pressed="${wished}">
            ${icon("heart")}
          </button>
          <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
        </div>
        <div class="thumb-row" role="group" aria-label="Product images">
          ${thumbs.map((thumb, index) => `
            <button class="thumbnail ${index === 0 ? "is-active" : ""}" type="button" data-g1="${thumb.g1}" data-g2="${thumb.g2}" aria-label="${thumb.label} view" aria-pressed="${index === 0}">
              <span aria-hidden="true">${product.emoji}</span><small>${thumb.label}</small>
            </button>`).join("")}
        </div>
      </div>

      <div class="product-info">
        <span class="product-brand">${escapeHtml(product.brand)} · ${escapeHtml(categoryName(product.category))}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="rating-line">
          <span class="rating-pill">★ ${product.rating}</span>
          <span class="stars" aria-hidden="true">${"★".repeat(Math.round(product.rating))}${"☆".repeat(5 - Math.round(product.rating))}</span>
          <a href="#tab-reviews" data-tab-link="reviews">${product.reviews} reviews</a>
          <span class="meta-dot" aria-hidden="true">·</span>
          <span>${product.sold.toLocaleString("en-US")}+ sold</span>
          <span class="assured-chip">${icon("shield")} Bazaar.pk Assured</span>
        </div>

        <div class="price-block">
          <span class="price-now">${money(product.price)}</span>
          ${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span><span class="save-tag">Save ${money(saveAmount)} (${pct}%)</span>` : ""}
          <span class="price-note">Inclusive of GST · Free delivery on orders over ${money(FREE_SHIPPING_THRESHOLD)}</span>
        </div>

        <p class="product-short">${escapeHtml(product.blurb)}</p>

        ${product.sizes ? optionGroup("Size", product.sizes, "size", product.sizes[0]) : ""}
        ${product.colorOptions ? optionGroup("Colour", product.colorOptions, "color", product.colorOptions[0]) : ""}

        <div class="qty-wrap">
          <div class="qty-stepper" aria-label="Quantity selector">
            <button type="button" data-qty="-1" aria-label="Decrease quantity" disabled>−</button>
            <span class="qty-value" data-qty-value>1</span>
            <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
          </div>
          <span class="stock-note">${icon("check")} In stock · usually ships in 24 hours</span>
        </div>

        <div class="buy-row">
          <button class="btn btn-primary btn-lg" type="button" data-detail-add>
            ${icon("cart")} <span>Add to cart</span>
          </button>
          <button class="btn btn-amber btn-lg" type="button" data-buy-now>Buy now</button>
        </div>
        <p class="ship-note">${icon("truck")} Ships from ${escapeHtml(product.city)} · Dispatched within 24 hours</p>

        <div class="delivery-check">
          <div class="delivery-check-head">${icon("pin")} Check delivery to your city</div>
          <form class="delivery-form" id="deliveryForm" novalidate>
            <label class="sr-only" for="deliveryCity">Your city</label>
            <input type="text" id="deliveryCity" name="city" placeholder="Enter your city (e.g. Lahore)" autocomplete="address-level2">
            <button class="btn btn-outline btn-sm" type="submit">Check</button>
          </form>
          <div class="delivery-result" id="deliveryResult" aria-live="polite"></div>
        </div>

        <div class="assurance-list">
          <span>${icon("check")} Cash on delivery available</span>
          <span>${icon("refresh")} 7-day easy returns</span>
          <span>${icon("shield")} 100% authentic product</span>
          <span>${icon("headset")} Support in Urdu &amp; English</span>
        </div>
      </div>
    </div>

    <section class="product-tabs">
      <div class="tab-buttons" role="tablist" aria-label="Product information">
        <button class="tab-btn is-active" type="button" role="tab" id="tabbtn-description" data-tab="description" aria-selected="true" aria-controls="tab-description">Description</button>
        <button class="tab-btn" type="button" role="tab" id="tabbtn-specs" data-tab="specs" aria-selected="false" aria-controls="tab-specs">Details &amp; care</button>
        <button class="tab-btn" type="button" role="tab" id="tabbtn-reviews" data-tab="reviews" aria-selected="false" aria-controls="tab-reviews">Reviews (${product.reviews})</button>
        <button class="tab-btn" type="button" role="tab" id="tabbtn-shipping" data-tab="shipping" aria-selected="false" aria-controls="tab-shipping">Delivery &amp; returns</button>
      </div>

      <div class="tab-panel" id="tab-description" role="tabpanel" aria-labelledby="tabbtn-description">
        <h2>About this product</h2>
        <p>${escapeHtml(product.blurb)}</p>
        <ul class="feature-list">
          ${product.features.map(feature => `<li>${icon("check")} ${escapeHtml(feature)}</li>`).join("")}
        </ul>
      </div>

      <div class="tab-panel" id="tab-specs" role="tabpanel" aria-labelledby="tabbtn-specs" hidden>
        <h2>Details &amp; care</h2>
        <table class="spec-table">
          <tbody>
            <tr><th scope="row">Brand</th><td>${escapeHtml(product.brand)}</td></tr>
            <tr><th scope="row">Category</th><td>${escapeHtml(categoryName(product.category))}</td></tr>
            <tr><th scope="row">Dispatched from</th><td>${escapeHtml(product.city)}</td></tr>
            <tr><th scope="row">SKU</th><td>BZR-${product.id.toUpperCase()}</td></tr>
            <tr><th scope="row">Warranty</th><td>${product.category === "electronics" || product.category === "home" ? "Official manufacturer warranty (where applicable)" : "7-day return or exchange"}</td></tr>
            <tr><th scope="row">Payment</th><td>Cash on delivery, card, Easypaisa &amp; JazzCash</td></tr>
          </tbody>
        </table>
      </div>

      <div class="tab-panel" id="tab-reviews" role="tabpanel" aria-labelledby="tabbtn-reviews" hidden>
        <h2>Shopper reviews</h2>
        <p class="muted" style="font-size:12.5px">${product.rating} out of 5 · based on ${product.reviews} verified reviews</p>
        <div class="review-item">
          <div class="review-head">
            <span class="review-avatar">AK</span>
            <div><strong>Ayesha K.</strong><span class="stars">★★★★★</span></div>
            <span class="review-date">2 days ago · Lahore</span>
          </div>
          <p>Ordered this for home and it arrived within two days. Packaging was solid and the quality is exactly as described. COD process took less than a minute.</p>
        </div>
        <div class="review-item">
          <div class="review-head">
            <span class="review-avatar">HT</span>
            <div><strong>Hamza T.</strong><span class="stars">★★★★☆</span></div>
            <span class="review-date">1 week ago · Karachi</span>
          </div>
          <p>Good value for the price. The rider called ahead and everything was sealed. Would order from Bazaar.pk again — delivery tracking was accurate.</p>
        </div>
        <div class="review-item">
          <div class="review-head">
            <span class="review-avatar">SM</span>
            <div><strong>Sana M.</strong><span class="stars">★★★★★</span></div>
            <span class="review-date">2 weeks ago · Islamabad</span>
          </div>
          <p>Genuine product and the finish matched the photos. Bought it as a gift and ended up ordering one for myself too.</p>
        </div>
        <div class="reviews-note">${icon("shield")} Every review is from a delivered order. We never edit or remove honest feedback.</div>
      </div>

      <div class="tab-panel" id="tab-shipping" role="tabpanel" aria-labelledby="tabbtn-shipping" hidden>
        <h2>Delivery &amp; returns</h2>
        <p>Orders placed before 4pm are dispatched the same day from ${escapeHtml(product.city)}. Standard delivery takes 2–4 working days across Pakistan, and express delivery is available in Karachi, Lahore, Islamabad and Rawalpindi.</p>
        <ul class="feature-list">
          <li>${icon("check")} Cash on delivery in 500+ cities</li>
          <li>${icon("check")} Free standard delivery over ${money(FREE_SHIPPING_THRESHOLD)}</li>
          <li>${icon("check")} 7-day returns on unused items</li>
          <li>${icon("check")} Live tracking by SMS and WhatsApp</li>
        </ul>
        <div class="reviews-note">${icon("refresh")} Changed your mind? Start a return from your order confirmation or call 021-111-327-825.</div>
      </div>
    </section>`;

  refreshWishButtons();

  /* ---------- gallery + options + quantity ---------- */
  let selectedSize = product.sizes ? product.sizes[0] : "";
  let selectedColor = product.colorOptions ? product.colorOptions[0] : "";
  let quantity = 1;

  const qtyValue = detail.querySelector("[data-qty-value]");
  const minusBtn = detail.querySelector('[data-qty="-1"]');
  const plusBtn = detail.querySelector('[data-qty="1"]');
  const galleryMain = document.getElementById("galleryMain");

  function paintQuantity() {
    qtyValue.textContent = String(quantity);
    minusBtn.disabled = quantity <= 1;
    plusBtn.disabled = quantity >= 10;
  }

  detail.addEventListener("click", event => {
    const thumb = event.target.closest(".thumbnail");
    if (thumb) {
      detail.querySelectorAll(".thumbnail").forEach(btn => {
        btn.classList.toggle("is-active", btn === thumb);
        btn.setAttribute("aria-pressed", String(btn === thumb));
      });
      galleryMain.style.setProperty("--g1", thumb.dataset.g1);
      galleryMain.style.setProperty("--g2", thumb.dataset.g2);
    }

    const option = event.target.closest("[data-option]");
    if (option) {
      const type = option.dataset.option;
      const group = option.closest(".option-group");
      group.querySelectorAll(".option-chip").forEach(chip => {
        chip.classList.toggle("is-active", chip === option);
        chip.setAttribute("aria-pressed", String(chip === option));
      });
      if (type === "size") selectedSize = option.dataset.value;
      if (type === "color") selectedColor = option.dataset.value;
      const label = group.querySelector(`[data-selected-${type}]`);
      if (label) label.textContent = option.dataset.value;
    }

    const qtyBtn = event.target.closest("[data-qty]");
    if (qtyBtn) {
      quantity = Math.min(10, Math.max(1, quantity + Number(qtyBtn.dataset.qty)));
      paintQuantity();
    }

    const addBtn = event.target.closest("[data-detail-add]");
    if (addBtn) {
      addToCart(product.id, quantity, { size: selectedSize, color: selectedColor });
      const label = addBtn.querySelector("span");
      if (label) {
        const original = label.textContent;
        label.textContent = "Added ✓";
        addBtn.classList.add("is-added");
        setTimeout(() => { label.textContent = original; addBtn.classList.remove("is-added"); }, 1300);
      }
    }

    const buyBtn = event.target.closest("[data-buy-now]");
    if (buyBtn) {
      addToCart(product.id, quantity, { size: selectedSize, color: selectedColor });
      location.href = "checkout.html";
    }

    const tabLink = event.target.closest("[data-tab-link]");
    if (tabLink) {
      event.preventDefault();
      showTab(tabLink.dataset.tabLink);
      document.querySelector(".product-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ---------- tabs ---------- */
  const tabButtons = detail.querySelectorAll("[data-tab]");
  const tabPanels = detail.querySelectorAll(".tab-panel");

  function showTab(name) {
    tabButtons.forEach(button => {
      const active = button.dataset.tab === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    tabPanels.forEach(panel => { panel.hidden = panel.id !== `tab-${name}`; });
  }

  tabButtons.forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
    button.addEventListener("keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const list = [...tabButtons];
      const index = list.indexOf(button);
      const next = list[(index + (event.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
      next.focus();
      showTab(next.dataset.tab);
    });
  });

  /* ---------- delivery check ---------- */
  const deliveryForm = document.getElementById("deliveryForm");
  const deliveryResult = document.getElementById("deliveryResult");
  deliveryForm.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("deliveryCity");
    const city = input.value.trim().replace(/\s+/g, " ");
    if (city.length < 2) {
      toast("Please enter a valid city name.", "muted");
      input.focus();
      return;
    }
    const days = 2 + (city.length % 3);
    const date = new Date(Date.now() + days * 86400000);
    const formatted = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "short" }).format(date);
    deliveryResult.innerHTML = `${icon("truck")} <span>Order today and get it by <strong>${escapeHtml(formatted)}</strong> in ${escapeHtml(city)}. COD available.</span>`;
  });

  /* ---------- related products ---------- */
  const related = PRODUCTS
    .filter(item => item.id !== product.id && item.category === product.category)
    .slice(0, 4);
  if (related.length < 4) {
    const fill = PRODUCTS
      .filter(item => item.id !== product.id && !related.includes(item))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4 - related.length);
    related.push(...fill);
  }
  if (related.length) {
    relatedSection.hidden = false;
    renderProducts(relatedGrid, related);
  }
});
