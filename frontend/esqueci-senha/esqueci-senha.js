// esqueci-senha - conectado
import { apiFetch } from '../js/storage.js';

document.getElementById('form-recuperar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const msgDiv = document.getElementById('mensagem');
  msgDiv.classList.remove('hidden', 'text-red-500', 'text-emerald-500');
  msgDiv.textContent = 'Processando...';
  try {
    const res = await apiFetch('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) });
    msgDiv.classList.add('text-emerald-500');
    msgDiv.textContent = res.mensagem || 'Instruções enviadas para o e-mail!';
    if (res.token_dev) {
      msgDiv.textContent += ` [DEV token: ${res.token_dev}]`;
      console.log('Token dev:', res.token_dev);
    }
  } catch (err) {
    msgDiv.classList.add('text-red-500');
    msgDiv.textContent = 'Erro: ' + err.message;
  }
});
