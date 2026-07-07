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
function adicionarAoCarrinho(livro, quantidade = 1) {
  quantidade = Math.max(1, parseInt(quantidade) || 1);

  if (livro.estoque <= 0) {
    toast('Este livro está indisponível (sem estoque).', 'error');
    return;
  }

  const idx = state.carrinho.findIndex(i => i.id === livro.id);
  if (idx >= 0) {
    const novaQtd = state.carrinho[idx].quantidade + quantidade;
    if (novaQtd <= livro.estoque) {
      state.carrinho[idx].quantidade = novaQtd;
    } else {
      state.carrinho[idx].quantidade = livro.estoque;
      toast('Quantidade máxima em estoque atingida.', 'error');
    }
  } else {
    state.carrinho.push({ ...livro, quantidade: Math.min(quantidade, livro.estoque) });
  }
  salvarCarrinho();
  atualizarBadgeCarrinho();
  toast(`"${livro.titulo}" adicionado ao carrinho!`, 'success');
}

// Ajusta a quantidade de um item já presente no carrinho, respeitando o
// estoque disponível do livro (nunca ultrapassa) e nunca deixando a
// quantidade cair abaixo de 1 (para remover, usar removerDoCarrinho).
function atualizarQuantidadeCarrinho(id, novaQuantidade) {
  const idx = state.carrinho.findIndex(i => i.id === id);
  if (idx < 0) return;

  let qtd = parseInt(novaQuantidade) || 1;
  qtd = Math.max(1, Math.min(qtd, state.carrinho[idx].estoque || qtd));

  state.carrinho[idx].quantidade = qtd;
  salvarCarrinho();
  atualizarBadgeCarrinho();
  renderizarCarrinho();
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
          <div class="qty-stepper cart-item-qty">
            <button type="button" onclick="window.SeBoApp.atualizarQuantidadeCarrinho(${item.id}, ${item.quantidade - 1})" ${item.quantidade <= 1 ? 'disabled' : ''}>−</button>
            <input type="number" min="1" max="${item.estoque || 99}" value="${item.quantidade}"
              onchange="window.SeBoApp.atualizarQuantidadeCarrinho(${item.id}, this.value)">
            <button type="button" onclick="window.SeBoApp.atualizarQuantidadeCarrinho(${item.id}, ${item.quantidade + 1})" ${item.quantidade >= (item.estoque || 99) ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removerDoCarrinho(${item.id})" title="Remover"><i class="fa fa-xmark"></i></button>
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
  const btnConta   = document.getElementById("btn-conta");
  const btnAdmin   = document.getElementById("btn-admin");
  const userInfo   = document.getElementById("user-info");
  if (state.usuario) {
    if (btnLogin)   btnLogin.style.display   = "none";
    if (btnLogout)  btnLogout.style.display  = "flex";
    if (btnPedidos) btnPedidos.style.display = "flex";
    if (btnConta)   btnConta.style.display   = "flex";
    if (btnAdmin)   btnAdmin.style.display   = state.usuario.perfil === "ADMIN" ? "flex" : "none";
    if (userInfo)   userInfo.textContent     = state.usuario.nome.split(" ")[0];
  } else {
    if (btnLogin)   btnLogin.style.display   = "flex";
    if (btnLogout)  btnLogout.style.display  = "none";
    if (btnPedidos) btnPedidos.style.display = "none";
    if (btnConta)   btnConta.style.display   = "none";
    if (btnAdmin)   btnAdmin.style.display   = "none";
    if (userInfo)   userInfo.textContent     = "";
  }
}

// Exportar para uso nos outros scripts
window.SeBoApp = {
  state, API, apiFetch, toast,
  adicionarAoCarrinho, removerDoCarrinho, atualizarQuantidadeCarrinho,
  renderizarCarrinho, abrirCarrinho, fecharCarrinho,
  atualizarBadgeCarrinho, totalCarrinho,
  salvarAuth, limparAuth, atualizarUIAuth, logout,
  validarCpf, toggleDark,
};
