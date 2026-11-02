/* Wishlist page */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("wishlistGrid");
  const empty = document.getElementById("wishlistEmpty");
  const toolbar = document.getElementById("wishlistToolbar");
  const countText = document.getElementById("wishlistCountText");
  const subtitle = document.getElementById("wishlistSubtitle");
  const addAllBtn = document.getElementById("addAll");
  const clearBtn = document.getElementById("clearWishlist");

  function render() {
    const products = wishlist.map(getProduct).filter(Boolean);
    const emptyState = products.length === 0;

    toolbar.hidden = emptyState;
    empty.hidden = !emptyState;
    grid.hidden = emptyState;
    countText.textContent = `${products.length} ${products.length === 1 ? "product" : "products"} saved`;
    subtitle.textContent = emptyState
      ? "Saved for later — but not for long, hopefully."
      : `${products.length} ${products.length === 1 ? "favourite" : "favourites"} waiting in your wishlist.`;

    if (emptyState) {
      grid.innerHTML = "";
      return;
    }
    renderProducts(grid, products);
  }

  addAllBtn.addEventListener("click", () => {
    const products = wishlist.map(getProduct).filter(Boolean);
    if (!products.length) return;
    products.forEach(product => {
      addToCart(product.id, 1, {
        size: product.sizes ? product.sizes[0] : "",
        color: product.colorOptions ? product.colorOptions[0] : ""
      }, true);
    });
    toast(`${products.length} ${products.length === 1 ? "item" : "items"} added to your cart`);
  });

  clearBtn.addEventListener("click", () => {
    if (!wishlist.length) return;
    wishlist = [];
    saveWishlist();
    render();
    toast("Wishlist cleared", "muted");
  });

  /* remove the card after the shared wishlist handler toggles it */
  grid.addEventListener("click", event => {
    if (event.target.closest("[data-wish]")) {
      setTimeout(render, 0);
    }
  });

  render();
});
