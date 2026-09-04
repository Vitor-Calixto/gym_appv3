// agenda.js - conectado ao backend
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal, showPrompt } from '../js/ui.js';

if (!obterUsuario()) window.location.href = '../index/index.html';

async function carregarAgenda() {
  const container = document.getElementById('lista-agenda');
  container.innerHTML = '<p class="text-sm text-zinc-500 text-center">Carregando...</p>';
  try {
    const agendas = await apiFetch('/agenda');
    const lista = Array.isArray(agendas) ? agendas : [];
    if (!lista.length) {
      container.innerHTML = '<p class="text-sm text-zinc-500 text-center">Nenhum agendamento futuro.</p>';
      return;
    }
    container.innerHTML = lista.map(item => {
      const d = new Date(item.data);
      const dataStr = d.toLocaleDateString('pt-BR');
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `
      <div class="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition">
        <div class="flex gap-4 items-center">
          <div class="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-center min-w-[70px]">
            <span class="block text-lg font-bold">${dataStr.split('/')[0]}</span>
            <span class="block text-xs uppercase">${hora}</span>
          </div>
          <div>
            <h3 class="font-bold text-zinc-200">${item.titulo}</h3>
            <p class="text-sm text-zinc-400">${item.tipo} ${item.aluno ? '• ' + item.aluno.nome : ''}</p>
          </div>
        </div>
        <span class="text-xs px-2 py-1 rounded-full ${item.status==='CANCELADO' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}">${item.status}</span>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = `<p class="text-sm text-red-400 text-center">Erro: ${e.message}</p>`;
  }
}

// Criar agendamento via modal (sem prompt nativo)
document.querySelector('button')?.addEventListener('click', () => {
  showPrompt({ titulo: 'Novo agendamento', placeholder: 'Título', onConfirm: (titulo) => {
    if (!titulo) return;
    showPrompt({ titulo: 'Data e hora', placeholder: 'YYYY-MM-DD HH:mm', valor: new Date().toISOString().slice(0,16).replace('T',' '), onConfirm: async (data) => {
      if (!data) return;
      try {
        await apiFetch('/agenda', { method: 'POST', body: JSON.stringify({ titulo, data, tipo: 'AVALIACAO' }) });
        showModal({ titulo: 'Sucesso', mensagem: 'Agendamento criado!', tipo: 'sucesso' });
        carregarAgenda();
      } catch (e) { showModal({ titulo: 'Erro', mensagem: e.message, tipo: 'erro' }); }
    }});
  }});
});

carregarAgenda();
