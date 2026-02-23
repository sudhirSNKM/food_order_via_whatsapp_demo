/* ====================================
   GreenBowl Cloud Kitchen – main.js
   Full multi-item cart system
   ==================================== */

'use strict';

/* ========================================
   CART STATE – persists in sessionStorage
   ======================================== */
let cart = JSON.parse(sessionStorage.getItem('gb_cart') || '[]');

function saveCart() {
  sessionStorage.setItem('gb_cart', JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

/* ============================================================
   addToCart(name, price, qty, emoji)
   Called from inline onclick="addToCart(...)" on each card
   ============================================================ */
function addToCart(name, price, qty, emoji) {
  qty = parseInt(qty) || 1;
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 20);
  } else {
    cart.push({ name, price: parseInt(price), qty, emoji: emoji || '🥗' });
  }
  saveCart();
  renderCartDrawer();
  updateCartBadge();
  flashAddedFeedback(name);
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function updateCartQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, 20));
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function clearCart() {
  if (!cart.length) return;
  if (!confirm('Clear your entire cart?')) return;
  cart = [];
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

/* ========================================
   CART BADGE in nav
   ======================================== */
function updateCartBadge() {
  document.querySelectorAll('.cart-nav-badge').forEach(badge => {
    const count = getCartCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.toggle('has-items', count > 0);
  });
}

/* ========================================
   FLASH FEEDBACK on Add to Cart button
   ======================================== */
function flashAddedFeedback(name) {
  // Find the button for this item by searching all add-cart buttons
  document.querySelectorAll('[data-item-name]').forEach(btn => {
    if (btn.getAttribute('data-item-name') === name) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✅ Added!';
      btn.classList.add('added');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('added');
      }, 1200);
    }
  });
  // Open drawer briefly
  openCartDrawer();
}

/* ========================================
   CART DRAWER OPEN / CLOSE
   ======================================== */
function openCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (!overlay || !drawer) return;
  overlay.classList.add('open');
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('open');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}

/* ========================================
   RENDER CART DRAWER CONTENTS
   ======================================== */
function renderCartDrawer() {
  const itemsContainer = document.getElementById('cartDrawerItems');
  const footer = document.getElementById('cartDrawerFooter');
  const countEl = document.getElementById('cartDrawerCount');
  if (!itemsContainer) return;

  const count = getCartCount();
  const total = getCartTotal();

  if (countEl) countEl.textContent = count;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <div class="cart-empty-text">Your cart is empty</div>
        <div class="cart-empty-sub">Add items from the menu to get started!</div>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = '';

  // Render line items
  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-line-item">
      <div class="cart-line-emoji">${item.emoji}</div>
      <div class="cart-line-info">
        <div class="cart-line-name">${item.name}</div>
        <div class="cart-line-unit">₹${item.price} each</div>
      </div>
      <div class="cart-line-controls">
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.name)}', -1)">−</button>
        <span class="cart-line-qty">${item.qty}</span>
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.name)}', 1)">+</button>
      </div>
      <div class="cart-line-total">₹${item.price * item.qty}</div>
      <button class="cart-line-remove" onclick="removeFromCart('${escHtml(item.name)}')" title="Remove">✕</button>
    </div>
  `).join('');

  // Render summary
  const summaryEl = document.getElementById('cartSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="cart-summary-row"><span>Items (${count})</span><span>₹${total}</span></div>
      <div class="cart-summary-row"><span>Delivery</span><span style="color:#28a745;font-weight:700;">Free 🎉</span></div>
      <div class="cart-summary-row total"><span>Total</span><span>₹${total}</span></div>
    `;
  }

  // Enable WhatsApp button
  const waBtn = document.getElementById('cartSendWa');
  if (waBtn) waBtn.disabled = false;
}

/* helper – escape single quotes in names for inline onclick */
function escHtml(str) {
  return str.replace(/'/g, "\\'");
}

/* ========================================
   SEND FULL ORDER TO WHATSAPP
   ======================================== */
function sendCartToWhatsApp() {
  if (!cart.length) return;

  let msg = '🥗 *GreenBowl Order*\n';
  msg += '—————————————\n';
  cart.forEach((item, i) => {
    msg += `${i + 1}. *${item.name}*\n`;
    msg += `   Qty: ${item.qty} × ₹${item.price} = ₹${item.price * item.qty}\n`;
  });
  msg += '—————————————\n';
  msg += `🧾 *Total: ₹${getCartTotal()}*\n`;
  msg += '—————————————\n';
  msg += '📍 Please confirm availability and delivery time. Thank you!';

  window.open(`https://wa.me/918300293097?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ========================================
   LOADER
   ======================================== */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 1800);
  }
});

/* ========================================
   STICKY HEADER
   ======================================== */
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ========================================
   MOBILE NAV
   ======================================== */
function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const burger = document.getElementById('hamburger');
  if (!nav || !burger) return;
  nav.classList.toggle('open');
  burger.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
}

function closeMobileNav() {
  const nav = document.getElementById('mobileNav');
  const burger = document.getElementById('hamburger');
  if (nav) nav.classList.remove('open');
  if (burger) burger.classList.remove('open');
  document.body.style.overflow = '';
}

/* ========================================
   SCROLL REVEAL
   ======================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

/* ========================================
   COUNTER ANIMATION
   ======================================== */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target') || el.getAttribute('data-counter'), 10);
  if (!target) return;
  const duration = 2200;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString('en-IN');
  }, step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      if (!el.dataset.counted) {
        el.dataset.counted = 'true';
        animateCounter(el);
      }
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter-val').forEach(el => counterObserver.observe(el));
document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

/* ========================================
   TESTIMONIALS SLIDER
   ======================================== */
(function initSlider() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const totalSlides = cards.length;
  let currentSlide = 0;
  let autoplay;

  const dotsContainer = document.getElementById('sliderDots');
  if (dotsContainer) {
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function getCardWidth() {
    const card = cards[0];
    if (!card) return 375;
    return card.offsetWidth + 24;
  }

  function goToSlide(index) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    track.style.transform = `translateX(-${currentSlide * getCardWidth()}px)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }
  }

  function next() { goToSlide(currentSlide >= totalSlides - 1 ? 0 : currentSlide + 1); }
  function prev() { goToSlide(currentSlide <= 0 ? totalSlides - 1 : currentSlide - 1); }

  const nextBtn = document.getElementById('slideNext');
  const prevBtn = document.getElementById('slidePrev');
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });

  function startAutoplay() { autoplay = setInterval(next, 4000); }
  function resetAutoplay() { clearInterval(autoplay); startAutoplay(); }
  startAutoplay();

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetAutoplay(); }
  }, { passive: true });
})();

/* ========================================
   PARALLAX HERO (Contact page)
   ======================================== */
const contactHero = document.getElementById('contactHero');
if (contactHero) {
  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight) {
      contactHero.style.backgroundPositionY = `calc(50% + ${window.scrollY * 0.35}px)`;
    }
  }, { passive: true });
}

/* ========================================
   QUANTITY CONTROLS on menu cards
   ======================================== */
function changeQty(btn, delta) {
  const control = btn.closest('.qty-control');
  const input = control.querySelector('.qty-val');
  if (!input) return;
  let val = parseInt(input.value) + delta;
  input.value = Math.max(1, Math.min(val, 20));
}

/* ========================================
   ACTIVE NAV HIGHLIGHT
   ======================================== */
(function highlightNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.split('#')[0] === path) link.classList.add('active');
  });
})();

/* ========================================
   KEYBOARD ESC
   ======================================== */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileNav();
    closeCartDrawer();
  }
});

/* ========================================
   INSTAGRAM CLICK
   ======================================== */
document.querySelectorAll('.insta-item').forEach(item => {
  item.addEventListener('click', () => {
    window.open('https://instagram.com/greenbowl.kitchen', '_blank');
  });
});

/* ========================================
   FEATURE CARD STAGGER
   ======================================== */
document.querySelectorAll('.feature-card, .mission-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.08}s`;
});

/* ========================================
   INIT
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartDrawer();

  // Close drawer when clicking overlay
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);

  // Send order button
  const waBtn = document.getElementById('cartSendWa');
  if (waBtn) waBtn.addEventListener('click', sendCartToWhatsApp);

  // Clear cart button
  const clearBtn = document.getElementById('cartClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearCart);
});

console.log('%c🥗 GreenBowl Cloud Kitchen', 'color:#556B2F;font-size:1.2rem;font-weight:bold;');
console.log('%cFresh • Healthy • Delivered Daily', 'color:#8FBC8F;font-size:0.9rem;');
