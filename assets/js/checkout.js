/* Checkout page */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  const layout = document.getElementById("checkoutLayout");
  const empty = document.getElementById("checkoutEmpty");
  const steps = document.querySelector(".checkout-steps");
  const itemsEl = document.getElementById("checkoutItems");
  const subtotalEl = document.getElementById("coSubtotal");
  const discountRow = document.getElementById("coDiscountRow");
  const discountEl = document.getElementById("coDiscount");
  const shippingEl = document.getElementById("coShipping");
  const totalEl = document.getElementById("coTotal");
  const placeOrderTotal = document.getElementById("placeOrderTotal");
  const summaryCount = document.getElementById("summaryCount");
  const etaNote = document.getElementById("etaNote");
  const standardPrice = document.getElementById("standardPrice");
  const deliveryOptions = document.getElementById("deliveryOptions");
  const paymentOptions = document.getElementById("paymentOptions");
  const cardFields = document.getElementById("cardFields");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  if (!cart.length) {
    layout.hidden = true;
    empty.hidden = false;
    if (steps) steps.hidden = true;
    return;
  }

  const getDelivery = () => document.querySelector('input[name="delivery"]:checked')?.value || "standard";
  const getPayment = () => document.querySelector('input[name="payment"]:checked')?.value || "cod";

  const paymentLabels = {
    cod: "Cash on delivery",
    easypaisa: "Easypaisa wallet",
    jazzcash: "JazzCash wallet",
    card: "Debit / credit card"
  };
  const deliveryLabels = {
    standard: "Standard delivery (2–4 working days)",
    express: "Express delivery (1–2 working days)"
  };

  function renderItems() {
    itemsEl.innerHTML = cart.map(item => {
      const product = getProduct(item.id);
      if (!product) return "";
      const variant = [item.size ? `Size ${item.size}` : "", item.color ? item.color : ""].filter(Boolean).join(" · ");
      return `
        <div class="checkout-item">
          <div class="checkout-thumb" style="--g1:${product.tint[0]};--g2:${product.tint[1]}">
            <span aria-hidden="true">${product.emoji}</span>
            <span class="thumb-qty">${item.qty}</span>
          </div>
          <div class="checkout-item-info">
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml(variant || product.brand)}</span>
          </div>
          <span class="checkout-item-price">${money(product.price * item.qty)}</span>
        </div>`;
    }).join("");
    const totalQty = cartCount();
    summaryCount.textContent = `${totalQty} ${totalQty === 1 ? "item" : "items"} · ${cart.length === 1 ? "1 product" : `${cart.length} products`}`;
  }

  function updateTotals() {
    const method = getDelivery();
    const totals = getTotals({ method });
    subtotalEl.textContent = money(totals.subtotal);
    discountRow.hidden = totals.discount <= 0;
    discountEl.textContent = `-${money(totals.discount)}`;
    shippingEl.textContent = totals.shipping === 0 ? "Free" : money(totals.shipping);
    totalEl.textContent = money(totals.total);
    placeOrderTotal.textContent = money(totals.total);

    const standardCost = shippingCost(Math.max(0, totals.subtotal - totals.discount), "standard");
    standardPrice.textContent = standardCost === 0 ? "Free" : money(standardCost);

    const days = method === "express" ? 1 : 3;
    const eta = new Date(Date.now() + days * 86400000);
    const formatted = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "short" }).format(eta);
    etaNote.innerHTML = `Estimated delivery by <strong>${escapeHtml(formatted)}</strong> · ${method === "express" ? "Express" : "Standard"}`;
  }

  function refreshSelection(container) {
    container.querySelectorAll(".radio-card").forEach(card => {
      card.classList.toggle("is-selected", Boolean(card.querySelector("input:checked")));
    });
  }

  deliveryOptions.addEventListener("change", () => {
    refreshSelection(deliveryOptions);
    updateTotals();
  });

  paymentOptions.addEventListener("change", () => {
    refreshSelection(paymentOptions);
    cardFields.hidden = getPayment() !== "card";
  });

  /* light input formatting for the demo card fields */
  const cardNumber = document.getElementById("cardNumber");
  const cardExpiry = document.getElementById("cardExpiry");
  const cardCvv = document.getElementById("cardCvv");

  cardNumber.addEventListener("input", () => {
    cardNumber.value = cardNumber.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  });
  cardExpiry.addEventListener("input", () => {
    const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
    cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });
  cardCvv.addEventListener("input", () => {
    cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!cart.length) {
      toast("Your cart is empty — add something first.", "muted");
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      toast("Please complete the highlighted details.", "muted");
      return;
    }

    const data = new FormData(form);
    const delivery = getDelivery();
    const payment = getPayment();
    const totals = getTotals({ method: delivery });
    const days = delivery === "express" ? 1 : 3;
    const eta = new Date(Date.now() + days * 86400000);

    const order = {
      number: `BZR-${String(Date.now()).slice(-6)}`,
      placedAt: new Date().toISOString(),
      contact: {
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim()
      },
      shipping: {
        address: String(data.get("address") || "").trim(),
        landmark: String(data.get("landmark") || "").trim(),
        city: String(data.get("city") || "").trim(),
        province: String(data.get("province") || "").trim(),
        postal: String(data.get("postal") || "").trim()
      },
      delivery,
      deliveryLabel: deliveryLabels[delivery],
      payment,
      paymentLabel: paymentLabels[payment] + (payment === "card" ? " (demo)" : ""),
      eta: eta.toISOString(),
      items: cart.map(item => {
        const product = getProduct(item.id);
        return {
          id: item.id,
          name: product.name,
          brand: product.brand,
          emoji: product.emoji,
          tint: product.tint,
          price: product.price,
          qty: item.qty,
          size: item.size,
          color: item.color
        };
      }),
      totals
    };

    writeJSON(ORDER_KEY, order);
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = "Placing your order…";

    setTimeout(() => {
      clearCart();
      clearCoupon();
      location.href = "order-success.html";
    }, 650);
  });

  renderItems();
  updateTotals();
});
