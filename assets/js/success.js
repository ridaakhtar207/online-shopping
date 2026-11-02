/* Order confirmation */
document.addEventListener("DOMContentLoaded", () => {
  const order = readJSON(ORDER_KEY, null);
  const card = document.getElementById("successCard");
  const noOrder = document.getElementById("noOrder");

  if (!order || !order.number) {
    card.hidden = true;
    noOrder.hidden = false;
    return;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("successName", order.contact?.name || "friend");
  setText("orderNumber", order.number);
  setText("deliveryAddress", order.shipping?.address || "—");

  const cityBits = [order.shipping?.city, order.shipping?.province, order.shipping?.postal].filter(Boolean);
  setText("deliveryCity", cityBits.join(", ") + (order.shipping?.landmark ? ` · Near ${order.shipping.landmark}` : ""));

  setText("contactName", order.contact?.name || "—");
  setText("contactPhone", [order.contact?.phone, order.contact?.email].filter(Boolean).join(" · "));
  setText("paymentMethod", order.paymentLabel || "Cash on delivery");
  setText("paymentNote", order.payment === "cod"
    ? `Pay ${money(order.totals?.total || 0)} when it arrives`
    : "Payment request sent to your phone");

  const etaDate = order.eta ? new Date(order.eta) : new Date(Date.now() + 3 * 86400000);
  setText("etaDate", new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "short" }).format(etaDate));
  setText("deliveryMethod", order.deliveryLabel || "Standard delivery (2–4 working days)");

  if (order.payment === "cod") {
    const codNote = document.getElementById("codNote");
    codNote.hidden = false;
    codNote.innerHTML = `${icon("bag")} <span><strong>Keep ${money(order.totals?.total || 0)} ready in cash.</strong> Our rider will call before arriving, so there's no need to wait by the door.</span>`;
  }

  const items = order.items || [];
  const itemsWrap = document.getElementById("successItems");
  itemsWrap.innerHTML = items.map(item => {
    const tint = Array.isArray(item.tint) ? item.tint : ["#f1f5f3", "#e2e8e5"];
    const variant = [item.size ? `Size ${item.size}` : "", item.color || "", `Qty ${item.qty}`].filter(Boolean).join(" · ");
    return `
      <div class="success-item">
        <span class="s-thumb" style="--g1:${tint[0]};--g2:${tint[1]}" aria-hidden="true">${item.emoji || "🛍️"}</span>
        <div class="success-item-info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.brand || "")}${variant ? ` · ${escapeHtml(variant)}` : ""}</span>
        </div>
        <span>${money(item.price * item.qty)}</span>
      </div>`;
  }).join("");

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  setText("successItemCount", `· ${totalQty} ${totalQty === 1 ? "item" : "items"}`);
  setText("successTotal", money(order.totals?.total || items.reduce((sum, item) => sum + item.price * item.qty, 0)));

  const placed = order.placedAt ? new Date(order.placedAt) : null;
  if (placed && !Number.isNaN(placed.getTime())) {
    setText("placedAt", `Placed on ${new Intl.DateTimeFormat("en-PK", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(placed)} · This is a demo order.`);
  }

  document.getElementById("printOrder").addEventListener("click", () => window.print());
});
