// ─── Config ──────────────────────────────────────────────────────────────────

// Resolve API_BASE same way as frontend config.js
var API_BASE = (function() {
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  return isLocal
    ? 'http://localhost:8080'
    : 'https://webshop-backend-473383712022.europe-west1.run.app';
})();

// ─── Auth ────────────────────────────────────────────────────────────────────

function getAuth() {
  return sessionStorage.getItem('admin_auth');
}

function setAuth(username, password) {
  const token = btoa(username + ':' + password);
  sessionStorage.setItem('admin_auth', token);
  sessionStorage.setItem('admin_username', username);
}

function logout() {
  sessionStorage.removeItem('admin_auth');
  sessionStorage.removeItem('admin_username');
  window.location.href = 'index.html';
}

function doLogin() {
  const username = $('#login-username').val().trim();
  const password = $('#login-password').val();
  if (!username || !password) return;

  $.ajax({
    url: API_BASE + '/api/admin/orders?size=1',
    headers: { 'Authorization': 'Basic ' + btoa(username + ':' + password) },
    success: function() {
      setAuth(username, password);
      showApp();
    },
    error: function() {
      $('#login-error').removeClass('d-none');
    }
  });
}

function showApp() {
  $('#login-overlay').hide();
  $('#app').removeClass('d-none');
  const username = sessionStorage.getItem('admin_username') || 'A';
  $('#nav-username').text(username.charAt(0).toUpperCase()).attr('title', username + ' — Odjavi se');
}

function initPage() {
  if (getAuth()) {
    showApp();
  }
  $('#login-password').on('keypress', function(e) {
    if (e.which === 13) doLogin();
  });
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function api(path, options = {}) {
  const auth = getAuth();
  const defaults = {
    url: API_BASE + path,
    headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json' },
    contentType: 'application/json',
  };
  return new Promise((resolve, reject) => {
    $.ajax(Object.assign(defaults, options))
      .done(resolve)
      .fail(function(xhr) {
        if (xhr.status === 401) { logout(); return; }
        const msg = xhr.responseJSON?.message || xhr.responseText || 'Greška';
        showToast(msg, 'danger');
        reject(xhr);
      });
  });
}

function apiPost(path, data)        { return api(path, { method: 'POST',   data: JSON.stringify(data) }); }
function apiPut(path, data)         { return api(path, { method: 'PUT',    data: JSON.stringify(data) }); }
function apiPatch(path, data)       { return api(path, { method: 'PATCH',  data: JSON.stringify(data) }); }
function apiDelete(path)            { return api(path, { method: 'DELETE' }); }

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' RSD';
}

function statusBadge(status) {
  const map = {
    CREATED: 'badge badge-created', CONFIRMED: 'badge badge-confirmed',
    PROCESSING: 'badge badge-processing', SHIPPED: 'badge badge-shipped',
    DELIVERED: 'badge badge-delivered', CANCELLED: 'badge badge-cancelled'
  };
  return map[status] || 'badge badge-secondary';
}

// Ensure toast container exists
function getToastContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'success') {
  const container = getToastContainer();
  const item = document.createElement('div');
  item.className = 'toast-item ' + type;
  item.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.1rem;cursor:pointer;margin-left:.75rem">×</button>`;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

function confirmDelete(name, onConfirm) {
  if (confirm('Obrisati "' + name + '"?')) onConfirm();
}

// Flatten category tree → [{id, name (indented), slug}]
function flattenCategories(tree, depth = 0) {
  const result = [];
  for (const cat of tree) {
    result.push({ id: cat.id, name: '\u00a0\u00a0'.repeat(depth) + cat.name, slug: cat.slug });
    if (cat.children && cat.children.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}

// Best price across supplier_products for display
function bestPrice(supplierProducts) {
  if (!supplierProducts || !supplierProducts.length) return null;
  const active = supplierProducts.filter(s => s.active);
  const prices = active.map(s => s.retailPrice || s.webPrice).filter(p => p != null);
  return prices.length ? Math.min(...prices) : null;
}

function totalStock(supplierProducts) {
  if (!supplierProducts || !supplierProducts.length) return 0;
  return supplierProducts.filter(s => s.active).reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
}

function anyInStock(supplierProducts) {
  if (!supplierProducts || !supplierProducts.length) return false;
  return supplierProducts.some(s => s.active && s.inStock);
}
