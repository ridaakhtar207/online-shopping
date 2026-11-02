/* Cart page */
document.addEventListener("DOMContentLoaded", () => {
  const els = {
    layout: document.getElementById("cartLayout"),
    card: document.getElementById("cartCard"),
    items: document.getElementById("cartItems"),
    empty: document.getElementById("cartEmpty"),
    side: document.getElementById("cartSide"),
    headCount: document.getElementById("cartHeadCount"),
    subtitle: document.getElementById("cartSubtitle"),
    suggestedGrid: document.getElementById("suggestedGrid"),
    suggestedSection: document.getElementById("suggestedSection"),
    suggestedTitle: document.getElementById("suggestedTitle"),
    suggestedEyebrow: document.getElementById("suggestedEyebrow"),
    freeShipText: document.getElementById("freeShipText"),
    progressFill: document.getElementById("progressFill"),
    subtotal: document.getElementById("subtotalVal"),
    discountRow: document.getElementById("discountRow"),
    discount: document.getElementById("discountVal"),
    shipping: document.getElementById("shippingVal"),
    total: document.getElementById("totalVal"),
    couponForm: document.getElementById("couponForm"),
    couponInput: document.getElementById("couponInput"),
    couponApplied: document.getElementById("couponApplied"),
    couponMsg: document.getElementById("couponMsg"),
    checkoutBtn: document.getElementById("checkoutBtn")
  };

  function lineItem(item) {
    const product = getProduct(item.id);
    if (!product) return "";
    const variant = [item.size ? `Size: ${item.size}` : "", item.color ? `Colour: ${item.color}` : ""]
      .filter(Boolean)
      .join(" · ");
    return `
      <div class="cart-item">
        <div class="cart-thumb" style="--g1:${product.tint[0]};--g2:${product.tint[1]}">
          <a href="product.html?id=${product.id}" tabindex="-1" aria-hidden="true">${product.emoji}</a>
        </div>
        <div class="cart-item-info">
          <span class="product-brand">${escapeHtml(product.brand)}</span>
          <a class="cart-name" href="product.html?id=${product.id}">${escapeHtml(product.name)}</a>
          ${variant ? `<div class="cart-variant">${escapeHtml(variant)}</div>` : ""}
          <div class="cart-unit-price">${money(product.price)} each</div>
        </div>
        <div class="cart-item-end">
          <span class="cart-line-total">${money(product.price * item.qty)}</span>
          <div class="qty-stepper" aria-label="Quantity for ${escapeHtml(product.name)}">
            <button type="button" data-cart-qty="-1" data-key="${escapeHtml(item.key)}" aria-label="Decrease quantity" ${item.qty <= 1 ? "disabled" : ""}>−</button>
            <span class="qty-value">${item.qty}</span>
            <button type="button" data-cart-qty="1" data-key="${escapeHtml(item.key)}" aria-label="Increase quantity" ${item.qty >= 99 ? "disabled" : ""}>+</button>
          </div>
          <button class="remove-link" type="button" data-remove-key="${escapeHtml(item.key)}">
            ${icon("close")} Remove
          </button>
        </div>
      </div>`;
  }

  function renderSuggested() {
    const inCart = new Set(cart.map(item => item.id));
    const picks = PRODUCTS.filter(product => !inCart.has(product.id))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4);
    const empty = cart.length === 0;
    els.suggestedSection.hidden = picks.length === 0;
    els.suggestedEyebrow.textContent = empty ? "Start here" : "Complete your order";
    els.suggestedTitle.textContent = empty ? "Popular right now" : "You might also like";
    if (picks.length) renderProducts(els.suggestedGrid, picks);
  }

  function renderCoupon() {
    const coupon = getCoupon();
    if (coupon) {
      els.couponForm.hidden = true;
      els.couponApplied.hidden = false;
      els.couponApplied.innerHTML = `${icon("check")}
        <span>${escapeHtml(coupon.code)} · ${escapeHtml(coupon.label)}</span>
        <button type="button" id="removeCoupon">Remove</button>`;
      els.couponMsg.textContent = "";
    } else {
      els.couponForm.hidden = false;
      els.couponApplied.hidden = true;
      els.couponApplied.innerHTML = "";
    }
  }

  function renderSummary() {
    const totals = getTotals();
    els.subtotal.textContent = money(totals.subtotal);
    els.discountRow.hidden = totals.discount <= 0;
    els.discount.textContent = `-${money(totals.discount)}`;
    els.shipping.textContent = totals.shipping === 0 ? "Free" : money(totals.shipping);
    els.total.textContent = money(totals.total);

    const afterDiscount = Math.max(0, totals.subtotal - totals.discount);
    const remaining = FREE_SHIPPING_THRESHOLD - afterDiscount;
    if (!cart.length) {
      els.freeShipText.innerHTML = `Free delivery on orders over <strong>${money(FREE_SHIPPING_THRESHOLD)}</strong>`;
      els.progressFill.style.width = "0%";
    } else if (remaining > 0) {
      els.freeShipText.innerHTML = `Add <strong>${money(remaining)}</strong> more for free delivery`;
      els.progressFill.style.width = `${Math.min(100, (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100)}%`;
    } else {
      els.freeShipText.innerHTML = `Free delivery unlocked — nice one! 🎉`;
      els.progressFill.style.width = "100%";
    }
  }

  function render() {
    const empty = cart.length === 0;
    els.layout.classList.toggle("is-empty", empty);
    els.card.hidden = empty;
    els.side.hidden = empty;
    els.empty.hidden = !empty;
    els.headCount.textContent = empty ? "" : `${cartCount()} ${cartCount() === 1 ? "item" : "items"}`;

    if (empty) {
      els.subtitle.textContent = "Your cart is empty — let's fix that.";
      els.couponMsg.textContent = "";
      renderSuggested();
      return;
    }

    els.items.innerHTML = cart.map(lineItem).join("");
    els.subtitle.textContent = `${cartCount()} ${cartCount() === 1 ? "item" : "items"} ready for checkout. Cash on delivery available nationwide.`;
    renderSuggested();
    renderCoupon();
    renderSummary();
  }

  els.items.addEventListener("click", event => {
    const qtyBtn = event.target.closest("[data-cart-qty]");
    if (qtyBtn) {
      const item = cart.find(entry => entry.key === qtyBtn.dataset.key);
      if (item) {
        setQty(item.key, item.qty + Number(qtyBtn.dataset.cartQty));
        render();
      }
      return;
    }
    const removeBtn = event.target.closest("[data-remove-key]");
    if (removeBtn) {
      const item = cart.find(entry => entry.key === removeBtn.dataset.removeKey);
      removeFromCart(removeBtn.dataset.removeKey);
      toast(item ? `${getProduct(item.id)?.name || "Item"} removed from cart` : "Item removed from cart", "muted");
      render();
    }
  });

  els.couponForm.addEventListener("submit", event => {
    event.preventDefault();
    const result = applyCoupon(els.couponInput.value);
    els.couponMsg.className = `coupon-msg ${result.ok ? "ok" : "err"}`;
    els.couponMsg.textContent = result.ok ? "" : result.message;
    if (result.ok) {
      els.couponInput.value = "";
      toast(result.message);
    }
    render();
    renderCoupon();
    renderSummary();
  });

  els.couponApplied.addEventListener("click", event => {
    if (event.target.id !== "removeCoupon") return;
    clearCoupon();
    els.couponMsg.className = "coupon-msg ok";
    els.couponMsg.textContent = "Discount code removed.";
    toast("Discount code removed", "muted");
    render();
  });

  els.checkoutBtn.addEventListener("click", event => {
    if (!cart.length) {
      event.preventDefault();
      toast("Your cart is empty — add something first.", "muted");
    }
  });

  render();
});
