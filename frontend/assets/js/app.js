// frontend/assets/js/app.js
// Módulo principal: estado global, API, carrinho, toasts

const API = 'http://localhost:3000';

// ── Estado Global ─────────────────────────────────────────────────────────
const state = {
  usuario: JSON.parse(localStorage.getItem('sebo_usuario') || 'null'),
  token:   localStorage.getItem('sebo_token') || null,
  carrinho: JSON.parse(localStorage.getItem('sebo_carrinho') || '[]'),
  dark:    localStorage.getItem('sebo_dark') === 'true',
};

// Aplica dark mode salvo
if (state.dark) document.body.classList.add('dark');

// ── Persistência ──────────────────────────────────────────────────────────
function salvarCarrinho() {
  localStorage.setItem('sebo_carrinho', JSON.stringify(state.carrinho));
}
function salvarAuth(token, usuario) {
  state.token   = token;
  state.usuario = usuario;
  localStorage.setItem('sebo_token',   token);
  localStorage.setItem('sebo_usuario', JSON.stringify(usuario));
}
function limparAuth() {
  state.token   = null;
  state.usuario = null;
  localStorage.removeItem('sebo_token');
  localStorage.removeItem('sebo_usuario');
}

// ── Fetch Autenticado ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, mensagem: data.erro || 'Erro desconhecido.' };
  return data;
}

// ── Toasts ────────────────────────────────────────────────────────────────
function toast(msg, tipo = '', duracao = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  const icone = tipo === 'success' ? '' : tipo === 'error' ? '' : 'ℹ';
  el.innerHTML = `<span>${icone}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, duracao);
}

// ── Carrinho ──────────────────────────────────────────────────────────────
function adicionarAoCarrinho(livro) {
  const idx = state.carrinho.findIndex(i => i.id === livro.id);
  if (idx >= 0) {
    if (state.carrinho[idx].quantidade < livro.estoque) {
      state.carrinho[idx].quantidade++;
    } else {
      toast('Quantidade máxima em estoque atingida.', 'error'); return;
    }
  } else {
    state.carrinho.push({ ...livro, quantidade: 1 });
  }
  salvarCarrinho();
  atualizarBadgeCarrinho();
  toast(`"${livro.titulo}" adicionado ao carrinho!`, 'success');
}

function removerDoCarrinho(id) {
  state.carrinho = state.carrinho.filter(i => i.id !== id);
  salvarCarrinho();
  atualizarBadgeCarrinho();
  renderizarCarrinho();
}

function totalCarrinho() {
  return state.carrinho.reduce((s, i) => s + parseFloat(i.preco) * i.quantidade, 0);
}

function atualizarBadgeCarrinho() {
  const badge = document.querySelector('.cart-badge');
  const qtd   = state.carrinho.reduce((s, i) => s + i.quantidade, 0);
  if (badge) {
    badge.textContent = qtd;
    badge.style.display = qtd > 0 ? 'flex' : 'none';
  }
}

function renderizarCarrinho() {
  const lista = document.querySelector('.cart-items');
  const totalEl = document.querySelector('.cart-total span:last-child');
  if (!lista) return;

  if (state.carrinho.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="icon"></div>
        <h3>Carrinho vazio</h3>
        <p>Adicione livros ao carrinho para continuar.</p>
      </div>`;
  } else {
    lista.innerHTML = state.carrinho.map(item => `
      <div class="cart-item">
        ${item.imagem_url
          ? `<img src="${item.imagem_url}" alt="${item.titulo}">`
          : `<div style="width:56px;height:80px;background:var(--surface);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.5rem"></div>`}
        <div class="cart-item-info">
          <div class="cart-item-title">${item.titulo}</div>
          <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:4px">${item.autor}</div>
          <div class="cart-item-price">R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2).replace('.',',')}
            <span style="font-weight:400;font-size:.8rem;color:var(--text-secondary)"> (${item.quantidade}x)</span>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removerDoCarrinho(${item.id})" title="Remover"></button>
      </div>
    `).join('');
  }

  if (totalEl) totalEl.textContent = `R$ ${totalCarrinho().toFixed(2).replace('.',',')}`;
}

// ── Drawer do Carrinho ────────────────────────────────────────────────────
function abrirCarrinho() {
  const drawer = document.querySelector('.cart-drawer');
  if (drawer) { renderizarCarrinho(); drawer.classList.add('open'); }
}
function fecharCarrinho() {
  const drawer = document.querySelector('.cart-drawer');
  if (drawer) drawer.classList.remove('open');
}

// ── Dark Mode ─────────────────────────────────────────────────────────────
function toggleDark() {
  state.dark = !state.dark;
  document.body.classList.toggle('dark', state.dark);
  localStorage.setItem('sebo_dark', state.dark);
}

// ── Atualiza UI de autenticação ───────────────────────────────────────────
function atualizarUIAuth_OLD() {
  const btnLogin  = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const userInfo  = document.getElementById('user-info');

  if (state.usuario) {
    if (btnLogin)  btnLogin.style.display  = 'none';
    if (btnLogout) btnLogout.style.display = 'flex';
    if (userInfo)  userInfo.textContent    = state.usuario.nome.split(' ')[0];
  } else {
    if (btnLogin)  btnLogin.style.display  = 'flex';
    if (btnLogout) btnLogout.style.display = 'none';
    if (userInfo)  userInfo.textContent    = '';
  }
}

function logout() {
  limparAuth();
  atualizarUIAuth();
  toast('Você saiu da conta.', '');
}

// ── Validação de CPF (front-end) ──────────────────────────────────────────
function validarCpf(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]);
}

// ── Atualiza UI de autenticação ───────────────────────────────────────────
function atualizarUIAuth() {
  const btnLogin   = document.getElementById("btn-login");
  const btnLogout  = document.getElementById("btn-logout");
  const btnPedidos = document.getElementById("btn-pedidos");
  const btnAdmin   = document.getElementById("btn-admin");
  const userInfo   = document.getElementById("user-info");
  if (state.usuario) {
    if (btnLogin)   btnLogin.style.display   = "none";
    if (btnLogout)  btnLogout.style.display  = "flex";
    if (btnPedidos) btnPedidos.style.display = "flex";
    if (btnAdmin)   btnAdmin.style.display   = state.usuario.perfil === "ADMIN" ? "flex" : "none";
    if (userInfo)   userInfo.textContent     = state.usuario.nome.split(" ")[0];
  } else {
    if (btnLogin)   btnLogin.style.display   = "flex";
    if (btnLogout)  btnLogout.style.display  = "none";
    if (btnPedidos) btnPedidos.style.display = "none";
    if (btnAdmin)   btnAdmin.style.display   = "none";
    if (userInfo)   userInfo.textContent     = "";
  }
}

// Exportar para uso nos outros scripts
window.SeBoApp = {
  state, API, apiFetch, toast,
  adicionarAoCarrinho, removerDoCarrinho,
  renderizarCarrinho, abrirCarrinho, fecharCarrinho,
  atualizarBadgeCarrinho, totalCarrinho,
  salvarAuth, limparAuth, atualizarUIAuth, logout,
  validarCpf, toggleDark,
};
