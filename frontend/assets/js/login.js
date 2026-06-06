// frontend/assets/js/login.js
// Modal de Login, 2FA e fluxo de autenticação

(function () {
  const { apiFetch, salvarAuth, atualizarUIAuth, toast, validarCpf } = window.SeBoApp;

  let _usuarioTemp = null; // dados após login bem-sucedido, antes do 2FA
  let _canalSelecionado = null;

  // ── Abre o modal de login ───────────────────────────────────────────────
  function abrirLogin() {
    if (document.getElementById('modal-login')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-login-overlay';
    overlay.innerHTML = `
      <div class="modal" id="modal-login">
        <button class="modal-close" onclick="window.LoginModal.fechar()">✕</button>
        <div class="modal-title">Entrar</div>
        <p class="modal-subtitle">Use seu e-mail, CPF ou telefone</p>

        <div class="form-group">
          <label>E-mail, CPF ou Telefone</label>
          <input type="text" id="login-identificador" placeholder="ex: joao@email.com">
          <div class="form-error" id="err-identificador"></div>
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" id="login-senha" placeholder="••••••••">
          <div class="form-error" id="err-senha"></div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-bottom:12px" onclick="window.LoginModal.submeter()" id="btn-login-submit">
          Continuar
        </button>

        <div style="text-align:center;color:var(--text-muted);font-size:.85rem;margin-bottom:12px">— ou —</div>

        <button class="btn btn-outline" style="width:100%" onclick="window.LoginModal.google()">
          <span>🔵</span> Entrar com Google (simulado)
        </button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) window.LoginModal.fechar(); });
    document.getElementById('login-senha').addEventListener('keydown', e => {
      if (e.key === 'Enter') window.LoginModal.submeter();
    });
    setTimeout(() => document.getElementById('login-identificador').focus(), 100);
  }

  async function submeterLogin() {
    const identificador = document.getElementById('login-identificador').value.trim();
    const senha         = document.getElementById('login-senha').value;
    const errId         = document.getElementById('err-identificador');
    const errSenha      = document.getElementById('err-senha');
    errId.textContent = ''; errSenha.textContent = '';

    if (!identificador) { errId.textContent = 'Campo obrigatório.'; return; }
    if (!senha)         { errSenha.textContent = 'Campo obrigatório.'; return; }

    // Valida CPF se parecer ser CPF
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    if (cpfRegex.test(identificador) && !validarCpf(identificador)) {
      errId.textContent = 'CPF inválido.'; return;
    }

    const btn = document.getElementById('btn-login-submit');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identificador, senha }),
      });
      _usuarioTemp = data;
      fecharModal();
      abrirModal2FACanal();
    } catch (e) {
      toast(e.mensagem || 'Credenciais inválidas.', 'error');
    } finally {
      if (document.getElementById('btn-login-submit')) {
        btn.innerHTML = 'Continuar';
        btn.disabled = false;
      }
    }
  }

  // ── Modal de escolha do canal 2FA ───────────────────────────────────────
  function abrirModal2FACanal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-2fa-canal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('modal-2fa-canal-overlay').remove()">✕</button>
        <div class="modal-title">Verificação em 2 Etapas</div>
        <p class="modal-subtitle">Olá, <strong>${_usuarioTemp.nome}</strong>! Escolha como receber seu código:</p>

        <div class="canal-options">
          <button class="canal-btn" id="canal-email" onclick="window.LoginModal.selecionarCanal('EMAIL')">
            <span class="canal-icon">📧</span>
            <span>E-mail</span>
            ${_usuarioTemp.email ? `<span style="font-size:.7rem;color:var(--text-muted)">${_usuarioTemp.email.substring(0,3)}***</span>` : ''}
          </button>
          <button class="canal-btn" id="canal-sms" onclick="window.LoginModal.selecionarCanal('SMS')">
            <span class="canal-icon">📱</span>
            <span>SMS</span>
            ${_usuarioTemp.telefone ? `<span style="font-size:.7rem;color:var(--text-muted)">***${_usuarioTemp.telefone.slice(-4)}</span>` : ''}
          </button>
        </div>

        <button class="btn btn-primary" style="width:100%" onclick="window.LoginModal.enviarCodigo()" id="btn-enviar-codigo" disabled>
          Enviar Código
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }

  function selecionarCanal(canal) {
    _canalSelecionado = canal;
    document.querySelectorAll('.canal-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById(`canal-${canal.toLowerCase()}`).classList.add('selected');
    document.getElementById('btn-enviar-codigo').disabled = false;
  }

  async function enviarCodigo() {
    if (!_canalSelecionado) return;
    const btn = document.getElementById('btn-enviar-codigo');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      await apiFetch('/auth/2fa/enviar', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: _usuarioTemp.usuario_id, canal: _canalSelecionado }),
      });
      document.getElementById('modal-2fa-canal-overlay').remove();
      abrirModal2FAVerificacao();
    } catch (e) {
      toast(e.mensagem || 'Erro ao enviar código.', 'error');
      btn.innerHTML = 'Enviar Código';
      btn.disabled = false;
    }
  }

  // ── Modal de verificação do código ─────────────────────────────────────
  function abrirModal2FAVerificacao() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-2fa-codigo-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="document.getElementById('modal-2fa-codigo-overlay').remove()">✕</button>
        <div class="modal-title">Código de Verificação</div>
        <p class="modal-subtitle">
          Insira o código de 6 dígitos enviado via <strong>${_canalSelecionado === 'EMAIL' ? 'E-mail' : 'SMS'}</strong>.
          <br><span style="color:var(--primary);font-size:.8rem">💡 Confira o terminal do servidor para o código (ambiente de dev)</span>
        </p>

        <div class="codigo-2fa-input" id="inputs-2fa">
          ${[0,1,2,3,4,5].map(i => `<input type="text" maxlength="1" inputmode="numeric" id="digit-${i}" data-index="${i}">`).join('')}
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="window.LoginModal.verificarCodigo()" id="btn-verificar">
          Verificar
        </button>

        <div style="text-align:center;margin-top:16px">
          <button onclick="window.LoginModal.reenviar()" style="background:none;color:var(--primary);font-size:.85rem;font-weight:600">
            Reenviar código
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Comportamento de navegação automática entre dígitos
    setTimeout(() => {
      const inputs = document.querySelectorAll('.codigo-2fa-input input');
      inputs.forEach((input, idx) => {
        input.addEventListener('input', () => {
          input.value = input.value.replace(/\D/g, '');
          if (input.value && idx < 5) inputs[idx + 1].focus();
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
          if (e.key === 'Enter') window.LoginModal.verificarCodigo();
        });
      });
      inputs[0].focus();
    }, 100);
  }

  async function verificarCodigo() {
    const inputs = document.querySelectorAll('.codigo-2fa-input input');
    const codigo = Array.from(inputs).map(i => i.value).join('');

    if (codigo.length !== 6) {
      toast('Digite todos os 6 dígitos.', 'error'); return;
    }

    const btn = document.getElementById('btn-verificar');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await apiFetch('/auth/2fa/verificar', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: _usuarioTemp.usuario_id, codigo }),
      });
      salvarAuth(data.token, data.usuario);
      document.getElementById('modal-2fa-codigo-overlay').remove();
      atualizarUIAuth();
      toast(`Bem-vindo(a), ${data.usuario.nome.split(' ')[0]}! 🎉`, 'success');
    } catch (e) {
      toast(e.mensagem || 'Código inválido.', 'error');
      inputs.forEach(i => i.value = '');
      inputs[0].focus();
      btn.innerHTML = 'Verificar';
      btn.disabled = false;
    }
  }

  async function reenviar() {
    try {
      await apiFetch('/auth/2fa/enviar', {
        method: 'POST',
        body: JSON.stringify({ usuario_id: _usuarioTemp.usuario_id, canal: _canalSelecionado }),
      });
      toast('Novo código enviado!', 'success');
    } catch (e) {
      toast(e.mensagem || 'Erro ao reenviar.', 'error');
    }
  }

  // Google Auth simulado
  async function googleAuth() {
    const fakeGoogle = {
      google_id: 'google_' + Date.now(),
      nome: 'Usuário Google',
      email: `usuario${Date.now()}@gmail.com`,
    };
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify(fakeGoogle),
      });
      salvarAuth(data.token, data.usuario);
      fecharModal();
      atualizarUIAuth();
      toast(`Bem-vindo(a) via Google, ${data.usuario.nome.split(' ')[0]}!`, 'success');
    } catch (e) {
      toast(e.mensagem || 'Erro no login Google.', 'error');
    }
  }

  function fecharModal() {
    const el = document.getElementById('modal-login-overlay');
    if (el) el.remove();
  }

  // Expõe publicamente
  window.LoginModal = {
    abrir: abrirLogin,
    fechar: fecharModal,
    submeter: submeterLogin,
    google: googleAuth,
    selecionarCanal,
    enviarCodigo,
    verificarCodigo,
    reenviar,
  };
})();
