// frontend/assets/js/checkout.js
// Modal de checkout: endereco + pagamento + animacao de loading + finalizacao

(function () {
  const { state, apiFetch, toast, totalCarrinho, fecharCarrinho, atualizarBadgeCarrinho } = window.SeBoApp;
  let _pagamento = null;
  let _enderecoSelecionadoId = null; // id de um endereço já salvo, se escolhido

  async function abrirCheckout() {
    if (!state.usuario) {
      toast('Faca login para finalizar a compra.', 'error');
      fecharCarrinho();
      setTimeout(() => window.LoginModal.abrir(), 300);
      return;
    }
    if (state.carrinho.length === 0) {
      toast('Seu carrinho esta vazio.', 'error'); return;
    }
    if (document.getElementById('modal-checkout-overlay')) return;

    _enderecoSelecionadoId = null;

    // Busca endereços já salvos do usuário para oferecer como opção rápida
    // (PARTE 5 do escopo), sem obrigar a digitar tudo de novo.
    let enderecosSalvos = [];
    try {
      const data = await apiFetch('/enderecos');
      enderecosSalvos = data.enderecos || [];
    } catch (_e) { /* segue sem endereços salvos */ }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay checkout-modal';
    overlay.id = 'modal-checkout-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px" id="checkout-modal-inner">

        <!-- Formulario de checkout -->
        <div id="checkout-form-area">
          <button class="modal-close" onclick="document.getElementById('modal-checkout-overlay').remove()">x</button>
          <div class="modal-title">Finalizar Pedido</div>
          <p class="modal-subtitle">Total: <strong style="color:var(--primary)">R$ ${totalCarrinho().toFixed(2).replace('.',',')}</strong></p>
          <hr style="border:none;border-top:1px solid var(--border);margin-bottom:20px">

          <div style="font-size:.85rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">
            Endereco de Entrega
          </div>

          ${enderecosSalvos.length > 0 ? `
            <div id="enderecos-salvos-lista">
              ${enderecosSalvos.map(e => `
                <div class="endereco-card" id="end-salvo-${e.id}" onclick="window.Checkout.selecionarEnderecoSalvo(${e.id})">
                  <strong>${e.logradouro}, ${e.numero}</strong>${e.principal ? '<span class="endereco-principal-tag">Principal</span>' : ''}<br>
                  <span style="font-size:.82rem;color:var(--text-secondary)">${e.bairro} — ${e.cidade}/${e.estado} — CEP ${e.cep}</span>
                </div>
              `).join('')}
              <div class="endereco-card" id="end-salvo-novo" onclick="window.Checkout.selecionarEnderecoSalvo(null)">
                <i class="fa fa-plus"></i> <strong>Usar um novo endereço</strong>
              </div>
            </div>
          ` : ''}

          <div id="endereco-form-manual" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="grid-column:1/-1">
              <label>CEP</label>
              <input type="text" id="end-cep" placeholder="00000-000" maxlength="9">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Logradouro</label>
              <input type="text" id="end-logradouro" placeholder="Rua das Flores">
            </div>
            <div class="form-group">
              <label>Numero</label>
              <input type="text" id="end-numero" placeholder="42">
            </div>
            <div class="form-group">
              <label>Complemento</label>
              <input type="text" id="end-complemento" placeholder="Apto 3 (opcional)">
            </div>
            <div class="form-group">
              <label>Bairro</label>
              <input type="text" id="end-bairro" placeholder="Centro">
            </div>
            <div class="form-group">
              <label>Cidade</label>
              <input type="text" id="end-cidade" placeholder="Passos">
            </div>
            <div class="form-group">
              <label>Estado (UF)</label>
              <input type="text" id="end-estado" placeholder="MG" maxlength="2">
            </div>
          </div>

          <hr style="border:none;border-top:1px solid var(--border);margin:8px 0 20px">

          <div style="font-size:.85rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">
            Forma de Pagamento
          </div>

          <div class="payment-options">
            <button class="payment-btn" id="pay-pix" onclick="window.Checkout.selecionarPagamento('PIX')">
              <span class="payment-icon"><i class="fa fa-qrcode"></i></span> PIX
            </button>
            <button class="payment-btn" id="pay-cartao" onclick="window.Checkout.selecionarPagamento('CARTAO')">
              <span class="payment-icon"><i class="fa fa-credit-card"></i></span> Cartão
            </button>
          </div>

          <p id="pagamento-hint" style="font-size:.82rem;color:var(--text-secondary);margin-bottom:10px">
            Escolha uma forma de pagamento para continuar.
          </p>
          <button class="btn btn-success" style="width:100%;display:none" id="btn-comprar"
            onclick="event.preventDefault(); window.Checkout.finalizar()">
            Confirmar pagamento
          </button>
        </div>

        <!-- Area de loading (oculta inicialmente) -->
        <div id="checkout-loading-area" style="display:none">
          <div class="checkout-loading">
            <div class="loader-spinner"></div>
            <div>
              <strong id="loading-titulo" style="font-size:1rem">Processando pagamento...</strong>
              <p id="loading-subtitulo">Aguarde enquanto confirmamos sua compra.</p>
            </div>
          </div>
        </div>

      </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // Se já existe endereço salvo, seleciona o principal (ou o primeiro) por
    // padrão e esconde o formulario manual até o usuario pedir "novo endereço".
    if (enderecosSalvos.length > 0) {
      const principal = enderecosSalvos.find(e => e.principal) || enderecosSalvos[0];
      selecionarEnderecoSalvo(principal.id);
    }

    // Auto-preenche CEP via ViaCEP
    document.getElementById('end-cep').addEventListener('blur', function () {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length === 8) buscarCep(cep);
    });
  }

  function selecionarEnderecoSalvo(id) {
    _enderecoSelecionadoId = id;
    document.querySelectorAll('.endereco-card').forEach(el => el.classList.remove('selecionado'));
    const formManual = document.getElementById('endereco-form-manual');

    if (id) {
      const card = document.getElementById(`end-salvo-${id}`);
      if (card) card.classList.add('selecionado');
      if (formManual) formManual.style.display = 'none';
    } else {
      const card = document.getElementById('end-salvo-novo');
      if (card) card.classList.add('selecionado');
      if (formManual) formManual.style.display = 'grid';
    }
  }

  async function buscarCep(cep) {
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        document.getElementById('end-logradouro').value = data.logradouro || '';
        document.getElementById('end-bairro').value     = data.bairro     || '';
        document.getElementById('end-cidade').value     = data.localidade || '';
        document.getElementById('end-estado').value     = data.uf         || '';
      }
    } catch (_) { /* silencioso */ }
  }

  function selecionarPagamento(tipo) {
    _pagamento = tipo;
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById(`pay-${tipo.toLowerCase()}`).classList.add('selected');

    // So exibe o botao de confirmacao depois que uma forma de pagamento foi escolhida
    const hint = document.getElementById('pagamento-hint');
    const btn  = document.getElementById('btn-comprar');
    if (hint) hint.style.display = 'none';
    if (btn)  btn.style.display  = 'block';
  }

  // ── Exibe animacao de loading ──────────────────────────────────────────────
  function mostrarLoading(titulo, subtitulo) {
    document.getElementById('checkout-form-area').style.display    = 'none';
    document.getElementById('checkout-loading-area').style.display = 'block';
    if (titulo)    document.getElementById('loading-titulo').textContent    = titulo;
    if (subtitulo) document.getElementById('loading-subtitulo').textContent = subtitulo;
  }

  async function finalizar() {
    let campos = null;

    if (!_enderecoSelecionadoId) {
      campos = {
        cep:        document.getElementById('end-cep')?.value.trim(),
        logradouro: document.getElementById('end-logradouro')?.value.trim(),
        numero:     document.getElementById('end-numero')?.value.trim(),
        complemento:document.getElementById('end-complemento')?.value.trim(),
        bairro:     document.getElementById('end-bairro')?.value.trim(),
        cidade:     document.getElementById('end-cidade')?.value.trim(),
        estado:     document.getElementById('end-estado')?.value.trim().toUpperCase(),
      };

      if (!campos.cep || !campos.logradouro || !campos.numero || !campos.bairro || !campos.cidade || !campos.estado) {
        toast('Preencha todos os campos do endereco, ou selecione um endereco salvo.', 'error'); return;
      }
    }
    if (!_pagamento) {
      toast('Selecione uma forma de pagamento.', 'error'); return;
    }

    // Oculta formulario e exibe loading — event.preventDefault() ja foi chamado
    mostrarLoading(
      `Processando ${_pagamento === 'PIX' ? 'PIX' : 'cartao'}...`,
      'Aguarde enquanto confirmamos sua compra.'
    );

    // Simula 3 segundos de "processamento" e so entao chama a API
    setTimeout(async () => {
      try {
        const itens = state.carrinho.map(i => ({ livro_id: i.id, quantidade: i.quantidade }));
        const corpo = _enderecoSelecionadoId
          ? { itens, endereco_id: _enderecoSelecionadoId, forma_pagamento: _pagamento }
          : { itens, endereco: campos, forma_pagamento: _pagamento };

        const data  = await apiFetch('/pedidos/checkout', {
          method: 'POST',
          body: JSON.stringify(corpo),
        });

        // Limpa carrinho
        state.carrinho = [];
        localStorage.setItem('sebo_carrinho', '[]');
        atualizarBadgeCarrinho();

        document.getElementById('modal-checkout-overlay').remove();
        fecharCarrinho();
        exibirSucesso(data);

      } catch (e) {
        // Em caso de erro, remove o loading e mostra mensagem
        document.getElementById('modal-checkout-overlay').remove();
        toast(e.mensagem || 'Erro ao finalizar pedido.', 'error');
      }
    }, 3000);
  }

  function exibirSucesso(data) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center;max-width:400px">
        <div class="checkout-success-icon" style="margin:0 auto 16px"><i class="fa fa-check"></i></div>
        <div class="modal-title">Pedido Confirmado!</div>
        <p style="color:var(--text-secondary);margin:12px 0 20px">
          Pedido <strong>#${data.pedido_id}</strong> processado com sucesso.<br>
          Total pago: <strong style="color:var(--primary)">R$ ${data.total.toFixed(2).replace('.',',')}</strong><br>
          Pagamento: <strong>${data.forma_pagamento}</strong>
        </p>
        <a href="pages/pedidos.html" class="btn btn-outline" style="width:100%;margin-bottom:10px">
          Ver meus pedidos
        </a>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()" style="width:100%">
          Continuar comprando
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }

  window.Checkout = { abrir: abrirCheckout, selecionarPagamento, selecionarEnderecoSalvo, finalizar };
})();
