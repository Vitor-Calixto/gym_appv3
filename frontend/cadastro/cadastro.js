import { apiFetch } from '../js/storage.js';
import { salvarSessao } from '../js/auth.js';

document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const role = document.getElementById('role').value;
  const erroDiv = document.getElementById('erro');
  const btn = document.getElementById('btn-cadastrar');

  erroDiv.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    const res = await apiFetch('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, role })
    });

    if (res && res.token) {
      salvarSessao(res.token, res.usuario);
      window.location.href = '../home/home.html';
    } else if (res && res.error) {
      erroDiv.textContent = res.error;
      erroDiv.classList.remove('hidden');
    } else {
      erroDiv.textContent = 'Erro inesperado ao cadastrar.';
      erroDiv.classList.remove('hidden');
    }
  } catch (err) {
    erroDiv.textContent = 'Falha de conexão com o servidor.';
    erroDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar';
  }
});
