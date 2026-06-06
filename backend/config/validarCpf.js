// backend/config/validarCpf.js
// Algoritmo oficial de validação de CPF (Receita Federal do Brasil)

/**
 * Remove formatação e valida matematicamente um CPF.
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean}
 */
function validarCpf(cpf) {
  if (!cpf) return false;

  // Remove máscara
  const numeros = cpf.replace(/\D/g, '');

  // Deve ter 11 dígitos
  if (numeros.length !== 11) return false;

  // Rejeita sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[9])) return false;

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[10])) return false;

  return true;
}

module.exports = { validarCpf };
