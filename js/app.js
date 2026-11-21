const grid = document.getElementById('productGrid');
const shopGrid = document.getElementById('shopGrid');
const noResults = document.getElementById('noResults');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchOverlay = document.getElementById('searchOverlay');
const searchBtn = document.getElementById('searchBtn');
const closeSearch = document.getElementById('closeSearch');

let cart = JSON.parse(localStorage.getItem('neoncart')) || [];

function renderProducts(list, container) {
  container.innerHTML = '';
  if (!list || list.length === 0) {
    if (container === shopGrid) noResults.style.display = 'block';
    return;
  }
  if (container === shopGrid) noResults.style.display = 'none';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-thumb" id="thumb-${p.id}"><div class="placeholder">&#x1F4BB;</div></div>
      <span class="tag">${p.category}</span>
      <div class="product-body">
        <div class="product-cat">${p.category}</div>
        <h3>${p.title}</h3>
        <div class="price-row">
          $${p.price.toFixed(2)}${p.oldPrice ? ` <del>$${p.oldPrice.toFixed(2)}</del>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-add" onclick="openProduct(${p.id})">Quick View</button>
          <button class="wish-btn" data-id="${p.id}" onclick="toggleWish(this, event)">&#x2661;</button>
        </div>
      </div>
    `;
    card.querySelector('.product-thumb').onclick = () => openProduct(p.id);
    container.appendChild(card);
    initThumb3D(p);
  });
}

function initThumb3D(p) {
  const el = document.getElementById(`thumb-${p.id}`);
  if (!el) return;
  const w = el.clientWidth || 240, h = el.clientHeight || 260;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.innerHTML = '';
  el.appendChild(renderer.domElement);
  let mesh;
  if (p.type === 'box') {
    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({ color: p.color, metalness: 0.4, roughness: 0.4 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.2;
  } else if (p.type === 'sphere') {
    const geo = new THREE.SphereGeometry(0.7, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: p.color, metalness: 0.2, roughness: 0.5 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 1.8;
  } else if (p.type === 'torus') {
    const geo = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const mat = new THREE.MeshStandardMaterial({ color: p.color, metalness: 0.8, roughness: 0.2 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 1.6;
  } else {
    const geo = new THREE.BoxGeometry(0.9,1.4,0.4);
    const mat = new THREE.MeshStandardMaterial({ color: p.color });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.5;
  }
  scene.add(mesh);
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1);
  point.position.set(3,3,3);
  scene.add(point);
  let tick = 0;
  function animate() {
    requestAnimationFrame(animate);
    tick += 0.01;
    mesh.rotation.y = Math.sin(tick)*0.6;
    mesh.rotation.x = Math.cos(tick)*0.3;
    renderer.render(scene, camera);
  }
  animate();
  window.__t3d = window.__t3d || [];
  window.__t3d.push({ renderer });
}

function renderShop() {
  let list = [...products];
  const cat = categoryFilter.value;
  if (cat !== 'all') list = list.filter(p => p.category === cat);
  const s = searchInput.value.trim().toLowerCase();
  if (s) list = list.filter(p => p.title.toLowerCase().includes(s) || p.category.includes(s));
  if (sortFilter.value === 'price-asc') list.sort((a,b) => a.price - b.price);
  else if (sortFilter.value === 'price-desc') list.sort((a,b) => b.price - a.price);
  renderProducts(list, shopGrid);
}

function renderHome() {
  renderProducts(products.filter(p => p.featured), grid);
}

function updateCartBadge() {
  const el = document.getElementById('cartCount');
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  el.textContent = totalQty;
  localStorage.setItem('neoncart', JSON.stringify(cart));
}

function addToCart(id, qty = 1) {
  const p = products.find(x => x.id === id);
  const exist = cart.find(i => i.id === id);
  if (exist) exist.qty += qty;
  else cart.push({ ...p, qty });
  updateCartBadge();
  openCart();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');

  container.innerHTML = '';
  if (cart.length === 0) {
    empty.style.display = 'block';
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }
  empty.style.display = 'none';
  document.getElementById('checkoutBtn').disabled = false;
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-thumb">${item.type === 'box'?'&#x1F4E6;':item.type==='sphere'?'&#x1F4AB;':item.type==='torus'?'&#x1F9F8;':'&#x1F461;'}</div>
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty}</div>
        <div class="cart-item-qty">
          <button onclick="changeQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
          <span class="remove-item" onclick="removeItem(${item.id})">&times;</span>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
  document.getElementById('cartTotal').textContent = '$' + total.toFixed(2);
}
window.changeQty = (id, d) => {
  const i = cart.find(x => x.id === id);
  if (!i) return;
  i.qty += d;
  if (i.qty <= 0) removeItem(id);
  else { renderCart(); updateCartBadge(); }
};
window.removeItem = (id) => {
  cart = cart.filter(x => x.id !== id);
  renderCart(); updateCartBadge();
};

function openCart() {
  renderCart();
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartBackdrop').style.display = 'block';
}
function closeCartFn() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartBackdrop').style.display = 'none';
}

let currentProduct = null;
function openProduct(id) {
  currentProduct = products.find(p => p.id === id);
  if (!currentProduct) return;
  document.getElementById('pCategory').textContent = currentProduct.category;
  document.getElementById('pTitle').textContent = currentProduct.title;
  document.getElementById('pPrice').innerHTML = `$${currentProduct.price.toFixed(2)}${currentProduct.oldPrice ? ` <del>$${currentProduct.oldPrice.toFixed(2)}</del>` : ''}`;
  document.getElementById('pDesc').textContent = currentProduct.desc;
  document.getElementById('qtyInput').value = 1;
  const viewer = document.getElementById('productViewer');
  viewer.innerHTML = '<div class="placeholder3d">Loading 3D...</div>';
  const w = viewer.clientWidth || 500, h = viewer.clientHeight || 460;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewer.innerHTML = '';
  viewer.appendChild(renderer.domElement);
  let mesh;
  if (currentProduct.type === 'box') {
    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({ color: currentProduct.color, metalness: 0.5, roughness: 0.3 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.6;
  } else if (currentProduct.type === 'sphere') {
    const geo = new THREE.SphereGeometry(0.8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: currentProduct.color, metalness: 0.3, roughness: 0.4 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.2;
  } else if (currentProduct.type === 'torus') {
    const geo = new THREE.TorusGeometry(0.6, 0.25, 32, 100);
    const mat = new THREE.MeshStandardMaterial({ color: currentProduct.color, metalness: 0.9, roughness: 0.1 });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.0;
  } else {
    const geo = new THREE.BoxGeometry(0.8,1.3,0.5);
    const mat = new THREE.MeshStandardMaterial({ color: currentProduct.color });
    mesh = new THREE.Mesh(geo, mat);
    camera.position.z = 2.8;
  }
  scene.add(mesh);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const pLight = new THREE.PointLight(0xffffff, 1.5); pLight.position.set(3,4,5); scene.add(pLight);
  const pLight2 = new THREE.PointLight(currentProduct.color, 0.8); pLight2.position.set(-3,-2,3); scene.add(pLight2);
  let isDown = false, lastX = 0, rotY = 0, rotX = -0.3;
  viewer.addEventListener('mousedown', () => { isDown = true; });
  window.addEventListener('mouseup', () => { isDown = false; });
  viewer.addEventListener('mousemove', e => {
    if (!isDown) return;
    rotY += (e.movementX || 0) * 0.005;
    rotX += (e.movementY || 0) * 0.005;
  });
  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y = rotY + Math.sin(Date.now()*0.001)*0.1;
    mesh.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  animate();
  document.getElementById('productModal').style.display = 'flex';
}
window.openProduct = openProduct;

document.getElementById('addToCartModal').onclick = () => {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('qtyInput').value || '1', 10);
  addToCart(currentProduct.id, qty);
  document.getElementById('productModal').style.display = 'none';
};

// Search
searchBtn.onclick = () => { searchOverlay.style.display = 'flex'; searchInput.focus(); };
closeSearch.onclick = () => { searchOverlay.style.display = 'none'; searchResults.style.display = 'none'; };
searchInput.oninput = () => {
  const s = searchInput.value.trim().toLowerCase();
  searchResults.style.display = s ? 'block' : 'none';
  if (!s) { searchResults.innerHTML = ''; return; }
  const matches = products.filter(p => p.title.toLowerCase().includes(s) || p.category.includes(s)).slice(0, 6);
  searchResults.innerHTML = matches.map(p => `
    <div class="search-item" onclick="selectSearch(${p.id})">${p.title} <span style="float:right;color:var(--muted);font-size:0.8rem;">$${p.price.toFixed(2)}</span></div>
  `).join('');
};
window.selectSearch = (id) => {
  searchOverlay.style.display = 'none';
  openProduct(id);
};

// Category pills on product cards -> filter
document.addEventListener('click', e => {
  if (e.target.classList.contains('tag')) {
    const cat = e.target.textContent;
    categoryFilter.value = cat;
    location.hash = '#shop';
    renderShop();
  }
});

categoryFilter.onchange = renderShop;
sortFilter.onchange = renderShop;

// Modals
document.getElementById('closeModal').onclick = () => { document.getElementById('productModal').style.display = 'none'; };
document.getElementById('closeCheckout').onclick = () => { document.getElementById('checkoutModal').style.display = 'none'; };
document.getElementById('closeCart').onclick = closeCartFn;
document.getElementById('cartBackdrop').onclick = closeCartFn;
window.addEventListener('click', e => {
  if (e.target === document.getElementById('productModal')) document.getElementById('productModal').style.display = 'none';
  if (e.target === document.getElementById('checkoutModal')) document.getElementById('checkoutModal').style.display = 'none';
});

// Qty in modal
document.getElementById('qtyMinus').onclick = () => {
  const i = document.getElementById('qtyInput'); let v = Math.max(1, parseInt(i.value||'1',10)-1); i.value = v;
};
document.getElementById('qtyPlus').onclick = () => {
  const i = document.getElementById('qtyInput'); i.value = parseInt(i.value||'1',10)+1;
};

// Checkout
document.getElementById('checkoutBtn').onclick = () => {
  renderCart();
  document.getElementById('checkoutModal').style.display = 'flex';
  closeCartFn();
};
document.getElementById('checkoutForm').onsubmit = e => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const order = {
    id: 'NC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    items: [...cart],
    total: cart.reduce((s, i) => s + i.price*i.qty, 0),
    customer: Object.fromEntries(formData),
    date: new Date().toISOString()
  };
  let orders = JSON.parse(localStorage.getItem('neoncart_orders') || '[]');
  orders.push(order);
  localStorage.setItem('neoncart_orders', JSON.stringify(orders));
  cart = [];
  updateCartBadge();
  document.getElementById('checkoutMsg').style.display = 'none';
  document.getElementById('orderId').textContent = order.id;
  e.target.reset();
  e.target.style.display = 'none';
  document.getElementById('orderSuccess').style.display = 'block';
  document.getElementById('checkoutMsg').textContent = '';
};
document.getElementById('continueShopping').onclick = () => {
  document.getElementById('checkoutModal').style.display = 'none';
  location.hash = '#shop';
};

// Contact form
document.getElementById('contactForm').onsubmit = e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Sending...';
  setTimeout(() => {
    btn.textContent = orig;
    document.getElementById('contactMsg').textContent = 'Thanks! Your message has been sent.';
    document.getElementById('contactMsg').style.color = 'var(--success)';
    e.target.reset();
  }, 900);
};

// Menu toggle
document.getElementById('menuToggle').onclick = () => {
  document.getElementById('navMenu').classList.toggle('open');
};

// Init
updateCartBadge();
renderHome();
renderShop();

// Hero 3D scene
(function hero3D() {
  const el = document.getElementById('hero3d');
  if (!el) return;
  const w = el.clientWidth || 420, h = el.clientHeight || 420;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  const group = new THREE.Group();
  ['#00f2ff','#7209b7','#ff00ff'].forEach((c, i) => {
    const geo = new THREE.IcosahedronGeometry(0.7, 0);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(c), metalness: 0.8, roughness: 0.2 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.sin(i)*1.5, Math.cos(i)*1.5, 0);
    group.add(m);
  });
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pl = new THREE.PointLight(0x00f2ff, 1); pl.position.set(3,3,3); scene.add(pl);
  camera.position.z = 4;
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    group.rotation.y = t;
    group.rotation.x = Math.sin(t*0.5)*0.4;
    group.children.forEach((m, i) => {
      m.position.z = Math.sin(t + i)*0.8;
      m.scale.setScalar(1 + Math.sin(t*2 + i)*0.15);
    });
    renderer.render(scene, camera);
  }
  animate();
})();
