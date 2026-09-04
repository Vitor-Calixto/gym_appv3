// anamnese.js - conectado ao backend
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

if (!obterUsuario()) window.location.href = '../index/index.html';

// Carregar anamnese existente
async function carregarAnamnese() {
  try {
    const data = await apiFetch('/anamnese/me/dados');
    if (data && data.respostas) {
      const r = data.respostas;
      if (r.peso) document.getElementById('peso').value = r.peso;
      if (r.altura) document.getElementById('altura').value = r.altura;
      if (r.objetivo) document.getElementById('objetivo').value = r.objetivo;
      if (r.lesoes) document.getElementById('lesoes').value = r.lesoes;
    }
  } catch {}
}
carregarAnamnese();

document.getElementById('form-anamnese').addEventListener('submit', async (e) => {
  e.preventDefault();
  const peso = document.getElementById('peso').value;
  const altura = document.getElementById('altura').value;
  const objetivo = document.getElementById('objetivo').value;
  const lesoes = document.getElementById('lesoes').value;
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const res = await apiFetch('/anamnese', { method: 'POST', body: JSON.stringify({ peso: Number(peso), altura: Number(altura), objetivo, lesoes }) });
    if (res && res.sucesso) {
      showModal({ titulo: 'Sucesso', mensagem: 'Anamnese salva!', tipo: 'sucesso', onConfirm: () => window.location.href = '../home/home.html' });
    } else if (res && res.error) showModal({ titulo: 'Erro', mensagem: res.error, tipo: 'erro' });
    else showModal({ titulo: 'Sucesso', mensagem: 'Salvo com sucesso!', tipo: 'sucesso', onConfirm: () => window.location.href = '../home/home.html' });
  } catch (err) {
    showModal({ titulo: 'Erro', mensagem: err.message, tipo: 'erro' });
  } finally { btn.disabled = false; btn.textContent = 'Salvar Anamnese'; }
});
