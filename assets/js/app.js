/* ============================================================
   Bazaar.pk — shared app logic
   Cart, wishlist, layout, product cards, small utilities.
   ============================================================ */

const CART_KEY = "bazaar.cart.v1";
const WISH_KEY = "bazaar.wishlist.v1";
const COUPON_KEY = "bazaar.coupon.v1";
const ORDER_KEY = "bazaar.lastOrder.v1";

/* ---------------- icons ---------------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  truck: '<path d="M1 4h13v12H1zM14 9h4l3 3.5V16h-7z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2ZM20 14a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/><path d="M18 16v1a3 3 0 0 1-3 3h-3"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3A2.5 2.5 0 0 1 18.5 20 16 16 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  tag: '<path d="M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  facebook: '<path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>'
};

function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

/* ---------------- storage helpers ---------------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* storage unavailable */ }
}

/* ---------------- formatting ---------------- */
function money(amount) {
  return "Rs " + Math.round(Number(amount) || 0).toLocaleString("en-US");
}
function discountPercent(product) {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.oldPrice) * 100);
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}
function categoryName(slug) {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.name : slug;
}
function productCount(slug) {
  return PRODUCTS.filter(p => p.category === slug).length;
}

/* ---------------- cart state ---------------- */
let cart = readJSON(CART_KEY, []).filter(item => getProduct(item.id));

function saveCart() {
  writeJSON(CART_KEY, cart);
  updateBadges();
}
function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
function cartSubtotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
}
function addToCart(id, qty = 1, options = {}, silent = false) {
  const product = getProduct(id);
  if (!product) return;
  const size = options.size || "";
  const color = options.color || "";
  const key = [id, size, color].join("|");
  const existing = cart.find(item => item.key === key);
  if (existing) {
    existing.qty = Math.min(99, existing.qty + qty);
  } else {
    cart.push({ key, id, qty: Math.max(1, qty), size, color });
  }
  saveCart();
  if (!silent) toast(`${product.name} added to cart`);
}
function setQty(key, qty) {
  const item = cart.find(entry => entry.key === key);
  if (!item) return;
  item.qty = Math.max(1, Math.min(99, qty));
  saveCart();
}
function removeFromCart(key) {
  cart = cart.filter(item => item.key !== key);
  saveCart();
}
function clearCart() {
  cart = [];
  saveCart();
}

/* ---------------- wishlist ---------------- */
let wishlist = readJSON(WISH_KEY, []).filter(id => getProduct(id));

function saveWishlist() {
  writeJSON(WISH_KEY, wishlist);
  updateBadges();
  refreshWishButtons();
}
function isWished(id) {
  return wishlist.includes(id);
}
function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return false;
  const added = !wishlist.includes(id);
  wishlist = added ? [...wishlist, id] : wishlist.filter(entry => entry !== id);
  saveWishlist();
  toast(added ? `${product.name} saved to wishlist` : `${product.name} removed from wishlist`, added ? "success" : "muted");
  return added;
}
function refreshWishButtons() {
  document.querySelectorAll("[data-wish]").forEach(btn => {
    const active = isWished(btn.dataset.wish);
    btn.classList.toggle("is-wished", active);
    btn.setAttribute("aria-pressed", String(active));
    btn.setAttribute("aria-label", `${active ? "Remove" : "Save"} ${getProduct(btn.dataset.wish)?.name || "product"} ${active ? "from" : "to"} wishlist`);
  });
}

/* ---------------- coupons & totals ---------------- */
function getCoupon() {
  const coupon = readJSON(COUPON_KEY, null);
  return coupon && COUPONS[coupon.code] ? coupon : null;
}
function applyCoupon(rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  const def = COUPONS[code];
  if (!def) return { ok: false, message: "That code is not valid. Try BAZAAR10." };
  if (def.min && cartSubtotal() < def.min) {
    return { ok: false, message: `Add ${money(def.min - cartSubtotal())} more to use ${code}.` };
  }
  writeJSON(COUPON_KEY, { code, ...def });
  return { ok: true, message: `${code} applied — ${def.label}.` };
}
function clearCoupon() {
  try { localStorage.removeItem(COUPON_KEY); } catch (err) { /* ignore */ }
}
function couponDiscount(subtotal) {
  const coupon = getCoupon();
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.min && subtotal < coupon.min) return 0;
  if (coupon.type === "percent") {
    return Math.min(Math.round(subtotal * coupon.value / 100), coupon.max || Infinity);
  }
  return Math.min(subtotal, coupon.value);
}
function shippingCost(afterDiscount, method = "standard") {
  if (afterDiscount <= 0) return 0;
  if (method === "express") return EXPRESS_SHIPPING;
  return afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING;
}
function getTotals(options = {}) {
  const subtotal = cartSubtotal();
  const discount = couponDiscount(subtotal);
  const method = options.method || "standard";
  const shipping = cart.length ? shippingCost(subtotal - discount, method) : 0;
  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
    coupon: getCoupon()
  };
}

/* ---------------- badges ---------------- */
function updateBadges() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = count > 99 ? "99+" : count;
    el.hidden = count === 0;
  });
  const cartLink = document.querySelector('a.icon-btn[href="cart.html"]');
  if (cartLink) cartLink.setAttribute("aria-label", count ? `Shopping cart, ${count} item${count === 1 ? "" : "s"}` : "Shopping cart");
  const wishCount = wishlist.length;
  document.querySelectorAll("[data-wishlist-count]").forEach(el => {
    el.textContent = wishCount;
    el.hidden = wishCount === 0;
  });
  const wishLink = document.querySelector('a.icon-btn[href="wishlist.html"]');
  if (wishLink) wishLink.setAttribute("aria-label", wishCount ? `Wishlist, ${wishCount} saved item${wishCount === 1 ? "" : "s"}` : "Wishlist");
}

/* ---------------- toasts ---------------- */
function toast(message, tone = "success") {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${tone}`;
  el.innerHTML = `<span class="toast-icon">${tone === "success" ? icon("check") : icon("bag")}</span><span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 280);
  }, 2800);
}

/* ---------------- product card ---------------- */
function productCard(product) {
  const pct = discountPercent(product);
  const badge = product.badge
    ? `<span class="p-badge ${pct >= 20 ? "p-badge-sale" : ""}">${escapeHtml(product.badge)}</span>`
    : pct > 0
      ? `<span class="p-badge p-badge-sale">-${pct}%</span>`
      : "";
  const wished = isWished(product.id);
  return `
    <article class="product-card">
      <div class="product-media" style="--g1:${product.tint[0]};--g2:${product.tint[1]}">
        ${badge}
        <button class="wish-btn ${wished ? "is-wished" : ""}" type="button" data-wish="${product.id}"
          aria-label="${wished ? "Remove" : "Save"} ${escapeHtml(product.name)} ${wished ? "from" : "to"} wishlist"
          aria-pressed="${wished}">${icon("heart")}</button>
        <a class="product-media-link" href="product.html?id=${product.id}">
          <span class="sr-only">View ${escapeHtml(product.name)}</span>
          <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
          <span class="product-city">${icon("pin")} ${escapeHtml(product.city)}</span>
        </a>
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Quick add ${escapeHtml(product.name)} to cart">+</button>
      </div>
      <div class="product-body">
        <span class="product-brand">${escapeHtml(product.brand)}</span>
        <a class="product-title" href="product.html?id=${product.id}">${escapeHtml(product.name)}</a>
        <div class="product-meta">
          <span class="rating-pill">★ ${product.rating}</span>
          <span class="review-count">(${product.reviews})</span>
          <span class="meta-dot">·</span>
          <span>${product.sold.toLocaleString("en-US")}+ sold</span>
        </div>
        <div class="price-row">
          <span class="price">${money(product.price)}</span>
          ${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span>` : ""}
          ${pct > 0 ? `<span class="off-tag">-${pct}%</span>` : ""}
        </div>
        <button class="add-cart" type="button" data-add="${product.id}">
          ${icon("cart")} <span>Add to cart</span>
        </button>
      </div>
    </article>`;
}

function renderProducts(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">🔍</div>
      <h2>No products found</h2>
      <p>Try a different search, category or price range.</p>
      <a class="btn btn-primary" href="shop.html">Browse all products</a>
    </div>`;
    return;
  }
  container.innerHTML = products.map(productCard).join("");
  refreshWishButtons();
}

/* ---------------- layout ---------------- */
function headerTemplate() {
  return `
  <div class="announcement">
    <div class="container announcement-inner">
      <p>${icon("truck")} Free delivery over ${money(FREE_SHIPPING_THRESHOLD)} · Cash on Delivery across Pakistan</p>
      <div class="announcement-links">
        <a href="shop.html?category=groceries">Fresh groceries</a>
        <span aria-hidden="true">·</span>
        <a href="order-success.html">Track order</a>
      </div>
    </div>
  </div>
  <header class="site-header">
    <div class="container header-main">
      <button class="icon-btn menu-btn" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">${icon("menu")}</button>
      <a class="logo" href="index.html" aria-label="Bazaar.pk home">
        <span class="logo-mark">${icon("bag")}</span>
        <span class="logo-text">
          <strong>bazaar<span>.</span>pk</strong>
          <small>Pakistan ka apna bazaar</small>
        </span>
      </a>
      <form class="search" role="search" action="shop.html" method="get">
        <span class="search-icon">${icon("search")}</span>
        <input type="search" name="q" id="siteSearch" placeholder="Search lawn suits, phones, mangoes…" autocomplete="off" aria-label="Search products">
        <button class="search-btn" type="submit" aria-label="Search">${icon("arrow")}</button>
      </form>
      <div class="header-actions">
        <a class="icon-btn desktop-only" href="wishlist.html" aria-label="Wishlist">
          ${icon("heart")}<span class="badge-count" data-wishlist-count hidden>0</span>
        </a>
        <a class="icon-btn" href="cart.html" aria-label="Shopping cart">
          ${icon("cart")}<span class="badge-count" data-cart-count hidden>0</span>
        </a>
        <a class="btn btn-primary header-checkout" href="checkout.html">Checkout</a>
      </div>
    </div>
    <nav class="main-nav" aria-label="Product categories">
      <div class="container nav-inner">
        <a href="shop.html" class="nav-link" data-nav="shop">All products</a>
        ${CATEGORIES.map(cat => `<a href="shop.html?category=${cat.slug}" class="nav-link" data-nav-cat="${cat.slug}">${cat.name}</a>`).join("")}
        <a href="index.html#deals" class="nav-link nav-deal">${icon("zap")} Flash deals</a>
        <div class="nav-right">
          <a href="tel:+922111327825">${icon("phone")} 021-111-327-825</a>
        </div>
      </div>
    </nav>
    <div class="mobile-nav" id="mobileNav">
      <div class="mobile-nav-head">
        <span>Shop by category</span>
        <button class="icon-btn" type="button" id="menuClose" aria-label="Close menu">${icon("close")}</button>
      </div>
      <a href="shop.html">All products <span aria-hidden="true">→</span></a>
      ${CATEGORIES.map(cat => `<a href="shop.html?category=${cat.slug}"><span>${cat.emoji} ${cat.name}</span><span class="mobile-count">${productCount(cat.slug)}</span></a>`).join("")}
      <a href="index.html#deals">🔥 Flash deals</a>
      <a href="wishlist.html">❤️ My wishlist</a>
      <a href="cart.html">🛒 My cart</a>
      <div class="mobile-nav-foot">
        <a href="tel:+922111327825">${icon("phone")} Call 021-111-327-825</a>
        <a href="mailto:salam@bazaar.pk">${icon("mail")} salam@bazaar.pk</a>
      </div>
    </div>
  </header>`;
}

function footerTemplate() {
  return `
  <footer class="site-footer">
    <h2 class="sr-only">Bazaar.pk footer</h2>
    <div class="container footer-top">
      <div class="footer-brand">
        <a class="logo logo-light" href="index.html" aria-label="Bazaar.pk home">
          <span class="logo-mark">${icon("bag")}</span>
          <span class="logo-text"><strong>bazaar<span>.</span>pk</strong><small>Pakistan ka apna bazaar</small></span>
        </a>
        <p>From Multan mangoes to Sialkot cricket bats — everyday shopping, delivered to your door with cash on delivery in 500+ cities.</p>
        <div class="social-row">
          <a href="#" aria-label="Bazaar.pk on Facebook" data-demo="Facebook">${icon("facebook")}</a>
          <a href="#" aria-label="Bazaar.pk on Instagram" data-demo="Instagram">${icon("instagram")}</a>
          <a href="#" aria-label="Bazaar.pk on YouTube" data-demo="YouTube">${icon("youtube")}</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Shop</h3>
        <a href="shop.html">All products</a>
        ${CATEGORIES.map(cat => `<a href="shop.html?category=${cat.slug}">${cat.name}</a>`).join("")}
      </div>
      <div class="footer-col">
        <h3>Help &amp; support</h3>
        <a href="#" data-demo="Delivery information">Delivery information</a>
        <a href="#" data-demo="Returns & exchanges">Returns &amp; exchanges</a>
        <a href="order-success.html">Track my order</a>
        <a href="#" data-demo="Size guide">Size guide</a>
        <a href="#" data-demo="FAQs">FAQs</a>
      </div>
      <div class="footer-col footer-contact">
        <h3>Talk to us</h3>
        <a href="tel:+922111327825">${icon("phone")} 021-111-327-825</a>
        <a href="mailto:salam@bazaar.pk">${icon("mail")} salam@bazaar.pk</a>
        <p>${icon("pin")} 12-B, Main Boulevard,<br>Gulberg III, Lahore</p>
        <p class="footer-hours">Mon–Sat, 9am – 9pm PKT</p>
      </div>
    </div>
    <div class="container newsletter">
      <div>
        <h3>Get Rs 200 off your first order</h3>
        <p>Sign up for fresh drops, flash deals and seasonal picks. No spam, ever.</p>
      </div>
      <form class="newsletter-form" data-newsletter>
        <label class="sr-only" for="newsletterEmail">Email address</label>
        <input type="email" id="newsletterEmail" placeholder="you@example.com" required>
        <button class="btn btn-amber" type="submit">Sign me up</button>
      </form>
    </div>
    <div class="container footer-bottom">
      <p>© <span data-year></span> Bazaar.pk — a demo storefront. All prices in PKR, inclusive of GST.</p>
      <div class="payment-row" aria-label="Accepted payment methods">
        <span class="pay-chip">COD</span>
        <span class="pay-chip">Easypaisa</span>
        <span class="pay-chip">JazzCash</span>
        <span class="pay-chip">Visa</span>
        <span class="pay-chip">Mastercard</span>
      </div>
    </div>
  </footer>`;
}

function renderLayout() {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  if (headerMount) headerMount.innerHTML = headerTemplate();
  if (footerMount) footerMount.innerHTML = footerTemplate();

  /* active nav state */
  const page = document.body.dataset.page || "";
  const params = new URLSearchParams(location.search);
  const activeCat = params.get("category");
  if (page === "shop" && !activeCat) {
    document.querySelector('[data-nav="shop"]')?.classList.add("is-active");
  }
  if (activeCat) {
    document.querySelector(`[data-nav-cat="${CSS.escape(activeCat)}"]`)?.classList.add("is-active");
  }

  /* mobile menu */
  const toggle = document.getElementById("menuToggle");
  const close = document.getElementById("menuClose");
  const menu = document.getElementById("mobileNav");
  const setOpen = open => {
    document.body.classList.toggle("menu-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    if (open) document.getElementById("siteSearch")?.blur();
  };
  toggle?.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  close?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
  menu?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));

  /* demo links */
  document.querySelectorAll("[data-demo]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      toast(`${link.dataset.demo} page is not part of this demo, but everything else works!`, "muted");
    });
  });

  /* newsletter */
  document.querySelectorAll("[data-newsletter]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const email = form.querySelector("input[type=email]");
      if (!email?.checkValidity()) { email?.reportValidity(); return; }
      const code = "WELCOME500";
      toast(`You are in! Use code ${code} at checkout for Rs 500 off.`);
      form.reset();
    });
  });

  /* prefill header search on shop */
  const q = params.get("q");
  const search = document.getElementById("siteSearch");
  if (q && search) search.value = q;

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  updateBadges();
  refreshWishButtons();
}

/* ---------------- global click handling ---------------- */
document.addEventListener("click", event => {
  const addBtn = event.target.closest("[data-add]");
  if (addBtn) {
    const product = getProduct(addBtn.dataset.add);
    if (!product) return;
    addToCart(product.id, 1, {
      size: product.sizes ? product.sizes[0] : "",
      color: product.colorOptions ? product.colorOptions[0] : ""
    });
    if (addBtn.dataset.noFeedback !== "true") {
      const label = addBtn.querySelector("span");
      if (label) {
        const original = label.textContent;
        label.textContent = "Added ✓";
        addBtn.classList.add("is-added");
        setTimeout(() => { label.textContent = original; addBtn.classList.remove("is-added"); }, 1200);
      }
    }
    return;
  }
  const wishBtn = event.target.closest("[data-wish]");
  if (wishBtn) {
    event.preventDefault();
    toggleWishlist(wishBtn.dataset.wish);
  }
});

/* ---------------- reveal on scroll ---------------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  items.forEach(el => observer.observe(el));
}

/* ---------------- init ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  initReveal();
});

window.addEventListener("storage", event => {
  if (event.key === CART_KEY) {
    cart = readJSON(CART_KEY, []).filter(item => getProduct(item.id));
    updateBadges();
  }
});
