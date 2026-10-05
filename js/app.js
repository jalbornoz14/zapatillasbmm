/* BMM Zapatillas — demo de tienda.
   Todo corre en el navegador y el catálogo sale de js/data.js.
   No hay servidor ni pagos reales; el pedido se envía por WhatsApp. */
(() => {
  'use strict';

  const SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
  const INK = '#17163B';

  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $('#app');
  const productDialog = $('#product-dialog');
  const cartDialog = $('#cart-dialog');

  /* ---------- utilidades ---------- */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => 'S/ ' + Number(n || 0).toFixed(2);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const priceOf = (p) => (p.salePrice ? p.salePrice : p.price);
  const fullName = (p) => (p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : p.brand + ' ' + p.name);
  const stockOf = (p) => SIZES.reduce((s, k) => s + (Number(p.sizes?.[k]) || 0), 0);
  const safeHex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback);
  const isDark = (hex) => {
    const h = safeHex(hex, '#ffffff').slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (r * 299 + g * 587 + b * 114) / 1000 < 120;
  };

  /* ---------- datos ---------- */
  const state = clone(window.BMM_SEED);
  // Si ya se corrió el importador, el catálogo real reemplaza al de ejemplo.
  if (Array.isArray(window.BMM_CATALOGO) && window.BMM_CATALOGO.length) {
    state.products = clone(window.BMM_CATALOGO);
  }
  const GENDERS = ['Hombre', 'Mujer', 'Unisex', 'Niños'].filter((g) => state.products.some((p) => p.gender === g));

  let cart = [];
  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem('bmm-cart') || '[]') || []; } catch (e) { cart = []; }
  }
  function saveCart() {
    try { localStorage.setItem('bmm-cart', JSON.stringify(cart)); } catch (e) { /* demo */ }
  }

  /* ---------- ilustración de zapatilla (dibujo genérico propio) ---------- */
  function shoeSVG(art = {}) {
    const upper = safeHex(art.upper, '#FFFFFF');
    const accent = safeHex(art.accent, '#2B3FF2');
    const sole = safeHex(art.sole, '#FFFFFF');
    const lace = isDark(upper) ? '#FFFFFF' : INK;
    const laces = [0.12, 0.32, 0.52, 0.72, 0.92].map((t) => {
      const x = 208 + 100 * t, y = 102 + 58 * t;
      return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 15).toFixed(1)}" y2="${(y + 25).toFixed(1)}"/>`;
    }).join('');
    return `<svg class="shoe" viewBox="0 0 480 300" role="img" aria-label="Ilustración de zapatilla">
      <ellipse cx="250" cy="266" rx="205" ry="9" fill="${INK}" opacity=".14"/>
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
        <path d="M58 216C52 180 58 140 78 112C92 100 108 104 118 118C130 134 150 138 168 124L196 92C204 84 216 86 222 94L318 160C360 172 420 176 444 206L446 218Z" fill="${upper}"/>
        <path d="M58 216C52 180 58 140 78 112C92 100 108 104 118 118C114 150 112 186 122 216Z" fill="${accent}"/>
        <path d="M122 216C150 176 196 160 236 164L286 196C250 210 190 216 122 216Z" fill="${accent}"/>
        <path d="M366 172C398 178 432 188 444 206L446 218L350 218C346 198 352 182 366 172Z" fill="${upper}"/>
        <path d="M118 118C130 134 150 138 168 124L182 108C160 120 136 118 124 104Z" fill="${INK}" fill-opacity=".28"/>
        <path d="M184 128L296 192" fill="none"/>
        <path d="M48 214L448 214L448 228Q446 254 404 254L78 254Q48 254 48 228Z" fill="${sole}"/>
        <path d="M50 238L446 238Q438 254 404 254L78 254Q54 254 50 238Z" fill="${INK}" fill-opacity=".88"/>
      </g>
      <g stroke="${lace}" stroke-width="5" stroke-linecap="round">${laces}</g>
    </svg>`;
  }

  function tileHTML(p, extra = '') {
    const tile = p.image ? '#FFFFFF' : safeHex(p.art?.tile, '#E0E3EC');
    const media = p.image
      ? `<img src="${esc(p.image)}" alt="${esc(fullName(p))}" loading="lazy">`
      : shoeSVG(p.art);
    return `<div class="tile ${p.image ? 'tile--photo' : ''} ${extra}" style="--tile:${tile}">${media}</div>`;
  }

  function priceHTML(p) {
    return p.salePrice
      ? `<span class="price"><span class="price__now">${money(p.salePrice)}</span> <s class="price__was">${money(p.price)}</s></span>`
      : `<span class="price"><span class="price__now">${money(p.price)}</span></span>`;
  }

  /* =====================================================================
     TIENDA
     ===================================================================== */
  const filters = { q: '', brand: '', gender: '', size: '', sort: 'destacadas' };
  let selectedSize = null;
  let openProductId = null;
  let lastOrder = null;

  const visibleProducts = () => state.products.filter((p) => p.visible);
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function cartLines() {
    return cart.map((l) => {
      const p = state.products.find((x) => x.id === l.id && x.visible);
      if (!p) return null;
      const max = Number(p.sizes?.[l.size]) || 0;
      if (max <= 0) return null;
      return { ...l, qty: Math.min(l.qty, max), max, p };
    }).filter(Boolean);
  }

  function headerHTML() {
    const s = state.settings;
    return `<header class="top">
      <a class="brand" href="#/" aria-label="${esc(s.storeName)} ${esc(s.tagline)}, inicio">
        <span class="brand__mark">${esc(s.storeName)}</span><span class="brand__sub">${esc(s.tagline)}</span>
      </a>
      <label class="search">
        <span class="sr">Buscar zapatillas</span>
        <input type="search" id="q" placeholder="Busca por modelo o marca" value="${esc(filters.q)}" autocomplete="off">
      </label>
      <nav class="top__nav">
        <button class="cartbtn" data-act="open-cart" type="button">
          Carrito <span class="cartbtn__n" id="cart-n">${cartCount()}</span>
        </button>
      </nav>
    </header>`;
  }

  function heroHTML() {
    const list = visibleProducts();
    const p = list.find((x) => x.featured && stockOf(x) > 0) || list.find((x) => stockOf(x) > 0) || list[0];
    if (!p) return '';
    const tile = p.image ? '#FFFFFF' : safeHex(p.art?.tile, '#E0E3EC');
    const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
    return `<section class="hero ${isDark(tile) ? 'hero--dark' : ''} ${p.image ? 'hero--photo' : ''}" style="--tile:${tile}">
      <div class="hero__text">
        <p class="hero__brand">${esc(p.brand)}</p>
        <h1 class="hero__name ${p.name.length > 16 ? 'hero__name--long' : ''}">${esc(p.name)}</h1>
        ${p.colorway ? `<p class="hero__color">${esc(p.colorway)}</p>` : ''}
        ${p.description ? `<p class="hero__desc">${esc(p.description)}</p>` : ''}
        <div class="hero__buy">
          ${priceHTML(p)}
          <button class="btn btn--ink" type="button" data-act="open-product" data-id="${esc(p.id)}">Ver tallas disponibles</button>
        </div>
      </div>
      <div class="hero__art">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.brand + ' ' + p.name)}">` : shoeSVG(p.art)}
        ${off ? `<span class="sticker" aria-label="${off} por ciento de descuento">−${off}%</span>` : ''}
      </div>
    </section>`;
  }

  function promisesHTML() {
    const items = (state.settings.promises || []).filter(Boolean);
    if (!items.length) return '';
    return `<ul class="promises">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
  }

  function filtersHTML() {
    const brands = [...new Set(visibleProducts().map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'es'));
    const chip = (value, label) => `<button type="button" class="chip" data-act="brand" data-brand="${esc(value)}" aria-pressed="${filters.brand === value}">${esc(label)}</button>`;
    const opt = (v, label, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(label)}</option>`;
    return `<div class="filters">
      <div class="chips" role="group" aria-label="Marca">
        ${chip('', 'Todas')}${brands.map((b) => chip(b, b)).join('')}
      </div>
      <div class="selects">
        <label class="select"><span>Para</span>
          <select data-filter="gender">${opt('', 'Todos', filters.gender)}${GENDERS.map((g) => opt(g, g, filters.gender)).join('')}</select>
        </label>
        <label class="select"><span>Talla</span>
          <select data-filter="size">${opt('', 'Todas', filters.size)}${SIZES.map((z) => opt(z, z, filters.size)).join('')}</select>
        </label>
        <label class="select"><span>Ordenar</span>
          <select data-filter="sort">
            ${opt('destacadas', 'Novedades', filters.sort)}
            ${opt('precio-asc', 'Menor precio', filters.sort)}
            ${opt('precio-desc', 'Mayor precio', filters.sort)}
          </select>
        </label>
      </div>
    </div>`;
  }

  function filteredProducts() {
    const q = filters.q.trim().toLowerCase();
    let list = visibleProducts().filter((p) => {
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.gender && p.gender !== filters.gender) return false;
      if (filters.size && !(Number(p.sizes?.[filters.size]) > 0)) return false;
      if (q && !(p.name + ' ' + p.brand + ' ' + (p.colorway || '') + ' ' + (p.sku || '')).toLowerCase().includes(q)) return false;
      return true;
    });
    if (filters.sort === 'precio-asc') list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (filters.sort === 'precio-desc') list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    return list;
  }

  function cardHTML(p) {
    const out = stockOf(p) === 0;
    const badge = out ? '<span class="badge badge--out">Agotada</span>'
      : p.salePrice ? '<span class="badge badge--sale">Oferta</span>' : '';
    return `<li>
      <button class="card ${out ? 'card--out' : ''}" type="button" data-act="open-product" data-id="${esc(p.id)}">
        ${tileHTML(p)}
        ${badge}
        <span class="card__brand">${esc(p.brand)}</span>
        <span class="card__name">${esc(p.name)}</span>
        ${p.colorway ? `<span class="card__color">${esc(p.colorway)}</span>` : ''}
        ${priceHTML(p)}
      </button>
    </li>`;
  }

  function renderGrid() {
    const host = $('#grid-host');
    if (!host) return;
    const list = filteredProducts();
    const total = visibleProducts().length;
    if (!total) {
      host.innerHTML = `<div class="empty"><h2>Pronto habrá zapatillas aquí</h2>
        <p>Estamos cargando el catálogo.</p></div>`;
      return;
    }
    if (!list.length) {
      host.innerHTML = `<div class="empty"><h2>No hay zapatillas con esos filtros</h2>
        <p>Prueba con otra talla o marca.</p>
        <button class="btn btn--line" type="button" data-act="clear-filters">Quitar filtros</button></div>`;
      return;
    }
    host.innerHTML = `<p class="count">${list.length} ${list.length === 1 ? 'zapatilla' : 'zapatillas'}</p>
      <ul class="grid">${list.map(cardHTML).join('')}</ul>`;
  }

  function renderStore() {
    document.title = `${state.settings.storeName} ${state.settings.tagline}`;
    app.className = 'store';
    app.innerHTML = `${headerHTML()}
      <main>
        ${heroHTML()}
        ${promisesHTML()}
        <section class="catalog" aria-label="Catálogo">
          <h2 class="catalog__title">Catálogo</h2>
          <div id="filters-host">${filtersHTML()}</div>
          <div id="grid-host"></div>
        </section>
      </main>
      <footer class="foot">
        <p>${esc(state.settings.storeName)} ${esc(state.settings.tagline)}, Lima. Sitio de demostración: los modelos y precios son de ejemplo.</p>
      </footer>`;
    renderGrid();
  }

  /* ---------- detalle de producto ---------- */
  function renderProductDialog() {
    const p = state.products.find((x) => x.id === openProductId);
    if (!p) { productDialog.close(); return; }
    const out = stockOf(p) === 0;
    const left = selectedSize ? Number(p.sizes[selectedSize]) || 0 : null;
    productDialog.innerHTML = `<div class="pd">
      <button class="x" type="button" data-act="close-dialog" aria-label="Cerrar">×</button>
      ${tileHTML(p, 'pd__tile')}
      <div class="pd__info">
        <p class="pd__brand">${esc(p.brand)}, ${esc(String(p.gender).toLowerCase())}</p>
        <h2 class="pd__name">${esc(p.name)}</h2>
        ${priceHTML(p)}
        ${p.colorway ? `<p class="pd__color">${esc(p.colorway)}</p>` : ''}
        ${p.description ? `<p class="pd__desc">${esc(p.description)}</p>` : ''}
        ${p.sku ? `<p class="pd__sku">Código ${esc(p.sku)}</p>` : ''}
        <fieldset class="sizes">
          <legend>${out ? 'Agotada en todas las tallas' : 'Elige tu talla'}</legend>
          <div class="sizes__list">
            ${SIZES.map((z) => {
              const n = Number(p.sizes?.[z]) || 0;
              return `<button type="button" class="size" data-act="pick-size" data-size="${z}" ${n ? '' : 'disabled'} aria-pressed="${selectedSize === z}">${z}</button>`;
            }).join('')}
          </div>
          <p class="sizes__hint">${left === null ? '&nbsp;' : left <= 2 ? `Quedan ${left} en talla ${selectedSize}` : `Disponible en talla ${selectedSize}`}</p>
        </fieldset>
        <button class="btn btn--cobalt btn--wide" type="button" data-act="add-to-cart" ${selectedSize ? '' : 'disabled'}>
          ${out ? 'Sin stock' : selectedSize ? 'Agregar al carrito' : 'Elige una talla para agregar'}
        </button>
      </div>
    </div>`;
  }

  function openProduct(id) {
    openProductId = id;
    selectedSize = null;
    renderProductDialog();
    if (!productDialog.open) productDialog.showModal();
  }

  /* ---------- carrito y pedido ---------- */
  function updateCartCount() {
    const n = $('#cart-n');
    if (n) n.textContent = cartCount();
  }

  function renderCart() {
    if (lastOrder) {
      cartDialog.innerHTML = `<div class="cart">
        <header class="cart__head"><h2>Pedido ${esc(lastOrder.id)} enviado</h2>
          <button class="x" type="button" data-act="close-dialog" aria-label="Cerrar">×</button></header>
        <div class="cart__done">
          <p>Abrimos WhatsApp con el detalle de tu pedido. Envía el mensaje y te confirmamos stock y entrega.</p>
          <p>Total: <strong>${money(lastOrder.total)}</strong></p>
          <a class="btn btn--cobalt btn--wide" href="${esc(lastOrder.link)}" target="_blank" rel="noopener">Abrir WhatsApp otra vez</a>
          <button class="btn btn--line btn--wide" type="button" data-act="close-dialog">Seguir viendo zapatillas</button>
        </div>
      </div>`;
      return;
    }
    const lines = cartLines();
    const total = lines.reduce((s, l) => s + priceOf(l.p) * l.qty, 0);
    const body = !lines.length
      ? `<div class="cart__empty"><p>Tu carrito está vacío.</p>
          <button class="btn btn--line" type="button" data-act="close-dialog">Ver el catálogo</button></div>`
      : `<ul class="cart__lines">${lines.map((l) => `<li class="line">
            ${tileHTML(l.p, 'line__tile')}
            <div class="line__info">
              <p class="line__name">${esc(fullName(l.p))}</p>
              ${l.p.colorway ? `<p class="line__meta">${esc(l.p.colorway)}</p>` : ''}
              <p class="line__meta">Talla ${esc(l.size)}</p>
              <div class="qty" role="group" aria-label="Cantidad">
                <button type="button" data-act="qty" data-id="${esc(l.id)}" data-size="${esc(l.size)}" data-d="-1" aria-label="Quitar uno">−</button>
                <span>${l.qty}</span>
                <button type="button" data-act="qty" data-id="${esc(l.id)}" data-size="${esc(l.size)}" data-d="1" ${l.qty >= l.max ? 'disabled' : ''} aria-label="Agregar uno">+</button>
              </div>
            </div>
            <div class="line__end">
              <p class="line__price">${money(priceOf(l.p) * l.qty)}</p>
              <button type="button" class="link" data-act="remove-line" data-id="${esc(l.id)}" data-size="${esc(l.size)}">Quitar</button>
            </div>
          </li>`).join('')}</ul>
        <form class="checkout" id="checkout" novalidate>
          <p class="checkout__total"><span>Total</span><strong>${money(total)}</strong></p>
          <label class="field"><span>Tu nombre</span><input name="name" required autocomplete="name"></label>
          <fieldset class="field field--radio"><legend>Entrega</legend>
            <label><input type="radio" name="delivery" value="Delivery" checked> Delivery</label>
            <label><input type="radio" name="delivery" value="Recojo en tienda"> Recojo en tienda</label>
          </fieldset>
          <label class="field" id="addr-field"><span>Dirección y distrito</span><input name="address" autocomplete="street-address"></label>
          <p class="form-error" id="checkout-error" hidden></p>
          <button class="btn btn--cobalt btn--wide" type="submit">Pedir por WhatsApp</button>
          <p class="checkout__note">No pagas aquí. Coordinamos el pago y la entrega por WhatsApp.</p>
        </form>`;
    cartDialog.innerHTML = `<div class="cart">
      <header class="cart__head"><h2>Carrito</h2>
        <button class="x" type="button" data-act="close-dialog" aria-label="Cerrar">×</button></header>
      ${body}
    </div>`;
  }

  function openCart() {
    renderCart();
    if (!cartDialog.open) cartDialog.showModal();
  }

  function submitOrder(form) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const delivery = String(data.get('delivery') || 'Delivery');
    const address = String(data.get('address') || '').trim();
    const err = $('#checkout-error');
    const fail = (msg) => { err.textContent = msg; err.hidden = false; };
    if (!name) return fail('Escribe tu nombre para identificar el pedido.');
    if (delivery === 'Delivery' && !address) return fail('Escribe la dirección y el distrito para el delivery.');
    const lines = cartLines();
    if (!lines.length) return fail('Tu carrito está vacío.');

    const items = lines.map((l) => ({
      productId: l.id, name: fullName(l.p) + (l.p.colorway ? ' ' + l.p.colorway : ''), brand: l.p.brand, size: l.size, qty: l.qty, price: priceOf(l.p)
    }));
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const id = 'B-' + String(Date.now()).slice(-5);
    const s = state.settings;
    const text = [
      `Hola ${s.storeName}, quiero hacer este pedido:`,
      ...items.map((i) => `• ${i.qty} × ${i.name}, talla ${i.size}: ${money(i.price * i.qty)}`),
      `Total: ${money(total)}`,
      `Nombre: ${name}`,
      `Entrega: ${delivery}${delivery === 'Delivery' ? ' a ' + address : ''}`,
      `Pedido ${id}`
    ].join('\n');
    const link = `https://wa.me/${String(s.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

    lines.forEach((l) => { l.p.sizes[l.size] = Math.max(0, (Number(l.p.sizes[l.size]) || 0) - l.qty); });
    cart = [];
    saveCart();
    lastOrder = { id, total, link };
    renderCart();
    updateCartCount();
    renderGrid();
    try { window.open(link, '_blank', 'noopener'); } catch (e) { /* queda el botón */ }
  }

  /* =====================================================================
     EVENTOS
     ===================================================================== */
  const actions = {
    'open-product': (el) => openProduct(el.dataset.id),
    'open-cart': () => { lastOrder = null; openCart(); },
    'close-dialog': (el) => el.closest('dialog')?.close(),
    'brand': (el) => { filters.brand = el.dataset.brand; $('#filters-host').innerHTML = filtersHTML(); renderGrid(); },
    'clear-filters': () => {
      Object.assign(filters, { q: '', brand: '', gender: '', size: '', sort: 'destacadas' });
      const q = $('#q'); if (q) q.value = '';
      $('#filters-host').innerHTML = filtersHTML(); renderGrid();
    },
    'pick-size': (el) => { selectedSize = el.dataset.size; renderProductDialog(); },
    'add-to-cart': () => {
      const p = state.products.find((x) => x.id === openProductId);
      if (!p || !selectedSize) return;
      const max = Number(p.sizes[selectedSize]) || 0;
      const line = cart.find((l) => l.id === p.id && l.size === selectedSize);
      if (line) line.qty = Math.min(max, line.qty + 1);
      else cart.push({ id: p.id, size: selectedSize, qty: 1 });
      saveCart(); updateCartCount();
      productDialog.close();
      lastOrder = null;
      openCart();
    },
    'qty': (el) => {
      const line = cart.find((l) => l.id === el.dataset.id && l.size === el.dataset.size);
      if (!line) return;
      line.qty += Number(el.dataset.d);
      if (line.qty <= 0) cart = cart.filter((l) => l !== line);
      saveCart(); updateCartCount(); renderCart();
    },
    'remove-line': (el) => {
      cart = cart.filter((l) => !(l.id === el.dataset.id && l.size === el.dataset.size));
      saveCart(); updateCartCount(); renderCart();
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el) { actions[el.dataset.act]?.(el, e); return; }
    // clic en el fondo del diálogo lo cierra
    if (e.target instanceof HTMLDialogElement) e.target.close();
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'q') { filters.q = t.value; renderGrid(); }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.filter) { filters[t.dataset.filter] = t.value; renderGrid(); }
    if (t.name === 'delivery') {
      const f = $('#addr-field'); if (f) f.hidden = t.value !== 'Delivery';
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.id === 'checkout') submitOrder(form);
  });

  /* ---------- inicio ---------- */
  loadCart();
  renderStore();
})();
