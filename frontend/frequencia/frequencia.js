// Lógica da tela frequencia
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

if (!obterUsuario()) window.location.href = '../index/index.html';

const checkins = ['12/11/2026 - 07:30', '10/11/2026 - 18:45', '09/11/2026 - 19:00'];

function renderizarFrequencia() {
  const container = document.getElementById('lista-frequencia');
  container.innerHTML = checkins.map(data => `
    <li class="bg-zinc-950 px-4 py-3 rounded-lg border border-zinc-800 text-sm text-zinc-300 flex items-center gap-3">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      Treino concluído em: <strong class="text-zinc-100">${data}</strong>
    </li>
  `).join('');
}

document.getElementById('btn-checkin').addEventListener('click', () => {
  const agora = new Date();
  const formatado = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth()+1).padStart(2, '0')}/2026 - ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  
  checkins.unshift(formatado);
  renderizarFrequencia();
  showModal({ titulo: 'Check-in', mensagem: 'Check-in realizado! Bom treino.', tipo: 'sucesso' });
});

renderizarFrequencia();