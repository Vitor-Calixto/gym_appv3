// Lógica da tela index - versão estável anterior
import { apiFetch } from '../js/storage.js';
import { salvarSessao } from '../js/auth.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const erroDiv = document.getElementById('erro');

  erroDiv.classList.add('hidden');

  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });

  if (res && res.token) {
    salvarSessao(res.token, res.usuario);
    window.location.href = '../home/home.html';
  } else if (res && res.error) {
    erroDiv.textContent = res.error;
    erroDiv.classList.remove('hidden');
  }
});
