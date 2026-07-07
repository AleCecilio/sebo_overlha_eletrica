// frontend/assets/js/login.js
// Modal de Login, 2FA e fluxo de autenticação

(function () {
  const { apiFetch, salvarAuth, atualizarUIAuth, toast, validarCpf } = window.SeBoApp;

  let _usuarioTemp = null; // dados após login bem-sucedido, antes do 2FA
  let _canalSelecionado = null;

  // ── Abre o modal de login/cadastro ──────────────────────────────────────
  function abrirLogin(abaInicial = 'entrar') {
    if (document.getElementById('modal-login')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-login-overlay';
    overlay.innerHTML = `
      <div class="modal" id="modal-login">
        <button class="modal-close" onclick="window.LoginModal.fechar()"><i class="fa fa-xmark"></i></button>

        <div class="auth-tabs">
          <div class="auth-tab" id="tab-entrar" onclick="window.LoginModal.mostrarAba('entrar')">Entrar</div>
          <div class="auth-tab" id="tab-cadastrar" onclick="window.LoginModal.mostrarAba('cadastrar')">Cadastrar</div>
        </div>

        <!-- ── Painel: Entrar ─────────────────────────────────────────── -->
        <div id="painel-entrar">
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

          <button id="btn-google-auth" class="btn-social" onclick="window.LoginModal.google()">
            <i class="fab fa-google"></i> Entrar com Google (simulado)
          </button>
        </div>

        <!-- ── Painel: Cadastrar ──────────────────────────────────────── -->
        <div id="painel-cadastrar" style="display:none">
          <p class="modal-subtitle">Crie sua conta gratuitamente</p>

          <div class="form-group">
            <label>Nome completo</label>
            <input type="text" id="cad-nome" placeholder="Seu nome completo">
            <div class="form-error" id="err-cad-nome"></div>
          </div>
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" id="cad-email" placeholder="ex: joao@email.com" oninput="window.LoginModal.verificarDominioAdmin()">
            <div class="form-error" id="err-cad-email"></div>
          </div>
          <div class="form-group">
            <label>Telefone (opcional)</label>
            <input type="text" id="cad-telefone" placeholder="(35) 99000-0000">
          </div>
          <div class="form-group">
            <label>CPF (opcional)</label>
            <input type="text" id="cad-cpf" placeholder="000.000.000-00">
            <div class="form-error" id="err-cad-cpf"></div>
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input type="password" id="cad-senha" placeholder="Mínimo 6 caracteres">
            <div class="form-error" id="err-cad-senha"></div>
          </div>

          <!-- Campo de código de administrador: só aparece para e-mails com
               o domínio @seboovelhaeletrica (PARTE 8 do escopo). Nunca é
               exibido por padrão para clientes comuns. -->
          <div class="form-group" id="grupo-codigo-admin" style="display:none">
            <label><i class="fa fa-shield-halved"></i> Código de Administrador</label>
            <input type="text" id="cad-codigo-admin" placeholder="Código fornecido pela administração">
            <div class="form-error" id="err-cad-codigo-admin"></div>
          </div>

          <button class="btn btn-primary" style="width:100%" onclick="window.LoginModal.cadastrar()" id="btn-cadastrar-submit">
            Criar Conta
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) window.LoginModal.fechar(); });
    document.getElementById('login-senha').addEventListener('keydown', e => {
      if (e.key === 'Enter') window.LoginModal.submeter();
    });
    mostrarAba(abaInicial);
    setTimeout(() => document.getElementById('login-identificador').focus(), 100);
  }

  function mostrarAba(aba) {
    document.getElementById('painel-entrar').style.display    = aba === 'entrar' ? 'block' : 'none';
    document.getElementById('painel-cadastrar').style.display  = aba === 'cadastrar' ? 'block' : 'none';
    document.getElementById('tab-entrar').classList.toggle('active', aba === 'entrar');
    document.getElementById('tab-cadastrar').classList.toggle('active', aba === 'cadastrar');
  }

  // Mostra o campo de código de administrador apenas quando o e-mail digitado
  // contém o domínio @seboovelhaeletrica. Nunca aparece para clientes comuns.
  function verificarDominioAdmin() {
    const email = document.getElementById('cad-email').value.trim().toLowerCase();
    const grupo = document.getElementById('grupo-codigo-admin');
    grupo.style.display = email.includes('@seboovelhaeletrica') ? 'block' : 'none';
  }

  async function cadastrar() {
    const nome      = document.getElementById('cad-nome').value.trim();
    const email     = document.getElementById('cad-email').value.trim();
    const telefone  = document.getElementById('cad-telefone').value.trim();
    const cpf       = document.getElementById('cad-cpf').value.trim();
    const senha     = document.getElementById('cad-senha').value;
    const codigoAdmin = document.getElementById('cad-codigo-admin').value.trim();

    ['err-cad-nome','err-cad-email','err-cad-cpf','err-cad-senha','err-cad-codigo-admin'].forEach(id => {
      document.getElementById(id).textContent = '';
    });

    if (!nome)  { document.getElementById('err-cad-nome').textContent = 'Campo obrigatório.'; return; }
    if (!email) { document.getElementById('err-cad-email').textContent = 'Campo obrigatório.'; return; }
    if (!senha || senha.length < 6) { document.getElementById('err-cad-senha').textContent = 'Mínimo de 6 caracteres.'; return; }
    if (cpf && !validarCpf(cpf)) { document.getElementById('err-cad-cpf').textContent = 'CPF inválido.'; return; }

    const btn = document.getElementById('btn-cadastrar-submit');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await apiFetch('/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify({
          nome, email, telefone: telefone || null, cpf: cpf || null, senha,
          codigo_admin: codigoAdmin || undefined,
        }),
      });
      salvarAuth(data.token, data.usuario);
      fecharModal();
      atualizarUIAuth();
      toast(`Bem-vindo(a), ${data.usuario.nome.split(' ')[0]}!`, 'success');
    } catch (e) {
      toast(e.mensagem || 'Erro ao criar conta.', 'error');
    } finally {
      if (document.getElementById('btn-cadastrar-submit')) {
        btn.innerHTML = 'Criar Conta';
        btn.disabled = false;
      }
    }
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
        <button class="modal-close" onclick="document.getElementById('modal-2fa-canal-overlay').remove()"><i class="fa fa-xmark"></i></button>
        <div class="modal-title">Verificação em 2 Etapas</div>
        <p class="modal-subtitle">Olá, <strong>${_usuarioTemp.nome}</strong>! Escolha como receber seu código:</p>

        <div class="canal-options">
          <button class="canal-btn" id="canal-email" onclick="window.LoginModal.selecionarCanal('EMAIL')">
            <span class="canal-icon"><i class="fa fa-envelope"></i></span>
            <span>E-mail</span>
            ${_usuarioTemp.email ? `<span style="font-size:.7rem;color:var(--text-muted)">${_usuarioTemp.email.substring(0,3)}***</span>` : ''}
          </button>
          <button class="canal-btn" id="canal-sms" onclick="window.LoginModal.selecionarCanal('SMS')">
            <span class="canal-icon"><i class="fa fa-mobile-screen"></i></span>
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
        <button class="modal-close" onclick="document.getElementById('modal-2fa-codigo-overlay').remove()"><i class="fa fa-xmark"></i></button>
        <div class="modal-title">Código de Verificação</div>
        <p class="modal-subtitle">
          Insira o código de 6 dígitos enviado via <strong>${_canalSelecionado === 'EMAIL' ? 'E-mail' : 'SMS'}</strong>.
          <br><span style="color:var(--primary);font-size:.8rem"><i class="fa fa-terminal"></i> Confira o terminal do servidor para o código (ambiente de dev)</span>
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
      toast(`Bem-vindo(a), ${data.usuario.nome.split(' ')[0]}!`, 'success');
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
    mostrarAba,
    verificarDominioAdmin,
    cadastrar,
    submeter: submeterLogin,
    google: googleAuth,
    selecionarCanal,
    enviarCodigo,
    verificarCodigo,
    reenviar,
  };
})();
