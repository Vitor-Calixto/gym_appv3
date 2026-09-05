// frontend/gerenciar-aulas/gerenciar-aulas.js
import { apiFetch } from '../js/storage.js';
import { showModal } from '../js/ui.js';

async function carregar() {
  try {
    const aulas = await apiFetch('/aulas');
    const grid = document.getElementById('lista-aulas');
    if (!aulas.length) { grid.innerHTML = '<p class="text-zinc-500 text-sm">Nenhuma aula criada.</p>'; return; }
    grid.innerHTML = aulas.map((a) => `
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center gap-3">
        <div class="min-w-0">
          <h3 class="font-bold text-sm truncate">${a.titulo}</h3>
          <p class="text-xs text-zinc-500">${a.categoria} • R$ ${Number(a.preco).toFixed(2)}${a.faixaMinima ? ` • Faixa ${a.faixaMinima}+` : ''}</p>
        </div>
        <button data-id="${a.id}" class="btn-del bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs shrink-0">Excluir</button>
      </div>`).join('');
    grid.querySelectorAll('.btn-del').forEach((btn) => btn.addEventListener('click', async () => {
      await apiFetch(`/aulas/${btn.dataset.id}`, { method: 'DELETE' }).catch((e) => ({ error: e.message }));
      showModal({ titulo: 'Excluída', mensagem: 'Aula excluída.', tipo: 'sucesso' });
      carregar();
    }));
  } catch (e) {
    document.getElementById('lista-aulas').innerHTML = `<p class="text-red-400 text-sm">Erro: ${e.message}</p>`;
  }
}

document.getElementById('form-aula')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    titulo: document.getElementById('titulo').value.trim(),
    embedUrl: document.getElementById('embedUrl').value.trim(),
    preco: parseFloat(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value,
    faixaMinima: document.getElementById('faixaMinima').value || null,
  };
  if (!body.titulo || !body.embedUrl || !(body.preco > 0)) {
    showModal({ titulo: 'Atenção', mensagem: 'Preencha título, embed e preço válido.', tipo: 'erro' });
    return;
  }
  const res = await apiFetch('/aulas', { method: 'POST', body: JSON.stringify(body) }).catch((err) => ({ error: err.message }));
  if (res?.error) { showModal({ titulo: 'Erro', mensagem: res.error, tipo: 'erro' }); return; }
  showModal({ titulo: 'Criada', mensagem: 'Aula criada!', tipo: 'sucesso' });
  e.target.reset();
  carregar();
});

carregar();
