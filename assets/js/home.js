/* Homepage: curated grids + flash sale countdown */
document.addEventListener("DOMContentLoaded", () => {
  const dealIds = ["gul-ahmed-lawn-3pc", "soundcore-life-q30", "sonex-cookware-5pc"];
  const featuredIds = [
    "gul-ahmed-lawn-3pc",
    "infinix-hot-40i",
    "soundcore-life-q30",
    "chaunsa-mangoes-5kg",
    "ca-cricket-bat",
    "sonex-cookware-5pc",
    "super-basmati-5kg",
    "j-rose-oud-perfume"
  ];

  renderProducts(
    document.getElementById("deal-grid"),
    dealIds.map(getProduct).filter(Boolean)
  );
  renderProducts(
    document.getElementById("featured-grid"),
    featuredIds.map(getProduct).filter(Boolean)
  );

  /* countdown to midnight */
  const hourEl = document.querySelector("[data-countdown-hours]");
  const minEl = document.querySelector("[data-countdown-minutes]");
  const secEl = document.querySelector("[data-countdown-seconds]");
  const pad = value => String(value).padStart(2, "0");

  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    let diff = Math.max(0, midnight - now);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (hourEl) hourEl.textContent = pad(hours);
    if (minEl) minEl.textContent = pad(minutes);
    if (secEl) secEl.textContent = pad(seconds);
  }
  tick();
  setInterval(tick, 1000);
});
