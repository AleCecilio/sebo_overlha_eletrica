// frontend/assets/js/checkout.js
// Modal de checkout: endereço + pagamento + finalização

(function () {
  const { state, apiFetch, toast, totalCarrinho, fecharCarrinho, atualizarBadgeCarrinho } = window.SeBoApp;
  let _pagamento = null;

  function abrirCheckout() {
    if (!state.usuario) {
      toast('Faça login para finalizar a compra.', 'error');
      fecharCarrinho();
      setTimeout(() => window.LoginModal.abrir(), 300);
      return;
    }
    if (state.carrinho.length === 0) {
      toast('Seu carrinho está vazio.', 'error'); return;
    }

    if (document.getElementById('modal-checkout-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay checkout-modal';
    overlay.id = 'modal-checkout-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px">
        <button class="modal-close" onclick="document.getElementById('modal-checkout-overlay').remove()">✕</button>
        <div class="modal-title">Finalizar Pedido</div>
        <p class="modal-subtitle">Total: <strong style="color:var(--primary)">R$ ${totalCarrinho().toFixed(2).replace('.',',')}</strong></p>

        <hr style="border:none;border-top:1px solid var(--border);margin-bottom:20px">

        <div style="font-size:.85rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">
          📍 Endereço de Entrega
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group" style="grid-column:1/-1">
            <label>CEP</label>
            <input type="text" id="end-cep" placeholder="00000-000" maxlength="9">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Logradouro (Rua / Av.)</label>
            <input type="text" id="end-logradouro" placeholder="Rua das Flores">
          </div>
          <div class="form-group">
            <label>Número</label>
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
          💳 Forma de Pagamento
        </div>

        <div class="payment-options">
          <button class="payment-btn" id="pay-pix" onclick="window.Checkout.selecionarPagamento('PIX')">
            <span class="payment-icon">⚡</span> PIX
          </button>
          <button class="payment-btn" id="pay-cartao" onclick="window.Checkout.selecionarPagamento('CARTAO')">
            <span class="payment-icon">💳</span> Cartão
          </button>
        </div>

        <button class="btn btn-success" style="width:100%" onclick="window.Checkout.finalizar()" id="btn-comprar">
          🛒 Confirmar Compra
        </button>
      </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // Auto-preenche CEP
    document.getElementById('end-cep').addEventListener('blur', function () {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length === 8) buscarCep(cep);
    });
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
  }

  async function finalizar() {
    const campos = {
      cep:        document.getElementById('end-cep')?.value.trim(),
      logradouro: document.getElementById('end-logradouro')?.value.trim(),
      numero:     document.getElementById('end-numero')?.value.trim(),
      complemento:document.getElementById('end-complemento')?.value.trim(),
      bairro:     document.getElementById('end-bairro')?.value.trim(),
      cidade:     document.getElementById('end-cidade')?.value.trim(),
      estado:     document.getElementById('end-estado')?.value.trim().toUpperCase(),
    };

    if (!campos.cep || !campos.logradouro || !campos.numero || !campos.bairro || !campos.cidade || !campos.estado) {
      toast('Preencha todos os campos do endereço.', 'error'); return;
    }
    if (!_pagamento) {
      toast('Selecione uma forma de pagamento.', 'error'); return;
    }

    const btn = document.getElementById('btn-comprar');
    btn.innerHTML = '<span class="spinner"></span> Processando...';
    btn.disabled = true;

    try {
      const itens = state.carrinho.map(i => ({ livro_id: i.id, quantidade: i.quantidade }));
      const data  = await apiFetch('/pedidos/checkout', {
        method: 'POST',
        body: JSON.stringify({ itens, endereco: campos, forma_pagamento: _pagamento }),
      });

      // Limpa carrinho após sucesso
      state.carrinho = [];
      window.SeBoApp.salvarCarrinho && localStorage.setItem('sebo_carrinho', '[]');
      atualizarBadgeCarrinho();

      document.getElementById('modal-checkout-overlay').remove();
      fecharCarrinho();
      exibirSucesso(data);

    } catch (e) {
      toast(e.mensagem || 'Erro ao finalizar pedido.', 'error');
      btn.innerHTML = '🛒 Confirmar Compra';
      btn.disabled = false;
    }
  }

  function exibirSucesso(data) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">🎉</div>
        <div class="modal-title">Pedido Confirmado!</div>
        <p style="color:var(--text-secondary);margin:12px 0 20px">
          Pedido <strong>#${data.pedido_id}</strong> processado com sucesso.<br>
          Total pago: <strong style="color:var(--primary)">R$ ${data.total.toFixed(2).replace('.',',')}</strong><br>
          Forma de pagamento: <strong>${data.forma_pagamento}</strong>
        </p>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()" style="width:100%">
          Continuar Comprando
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }

  window.Checkout = { abrir: abrirCheckout, selecionarPagamento, finalizar };
})();
