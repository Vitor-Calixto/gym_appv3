// alterar-senha - suporta token (esqueci) e logado (alterar)
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';

const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const isReset = !!token;

if (!isReset && !obterUsuario()) window.location.href = '../index/index.html';

if (isReset) document.querySelector('h1').textContent = 'Redefinir Senha';

document.getElementById('form-senha').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nova = document.getElementById('nova-senha').value;
  const confirma = document.getElementById('confirma-senha').value;
  const msg = document.getElementById('msg-senha');
  msg.classList.remove('hidden', 'text-emerald-500', 'text-red-500');
  if (nova !== confirma) { msg.classList.add('text-red-500'); msg.textContent = 'As senhas não coincidem.'; return; }
  try {
    let res;
    if (isReset) {
      res = await apiFetch('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha: nova }) });
    } else {
      res = await apiFetch('/auth/alterar-senha', { method: 'PUT', body: JSON.stringify({ novaSenha: nova }) });
    }
    if (res && res.sucesso) {
      msg.classList.add('text-emerald-500');
      msg.textContent = res.mensagem;
      setTimeout(() => window.location.href = '../index/index.html', 1500);
    } else if (res && res.error) { msg.classList.add('text-red-500'); msg.textContent = res.error; }
    else { msg.classList.add('text-emerald-500'); msg.textContent = 'Senha atualizada!'; }
  } catch (err) { msg.classList.add('text-red-500'); msg.textContent = err.message; }
});
