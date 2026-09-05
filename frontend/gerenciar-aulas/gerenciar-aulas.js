// frontend/gerenciar-aulas/gerenciar-aulas.js — catálogo do professor + pacotes + pendentes
import { apiFetch } from '../js/storage.js';
import { showModal } from '../js/ui.js';

let cacheAulas = [];

async function carregarAulas() {
  const aulas = await apiFetch('/aulas').catch(() => []);
  cacheAulas = Array.isArray(aulas) ? aulas : [];
  document.getElementById('lista-aulas').innerHTML = cacheAulas.length ? cacheAulas.map((a) => `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center gap-3">
      <div class="min-w-0">
        <h3 class="font-bold text-sm truncate">${a.titulo}</h3>
        <p class="text-xs text-zinc-500">${a.categoria} • R$ ${Number(a.preco).toFixed(2)}${a.gratuita ? ' • GRÁTIS' : ''}${a.secao ? ` • ${a.secao} #${a.ordem}` : ''}${a.faixaMinima ? ` • ${a.faixaMinima}+` : ''}</p>
      </div>
      <button data-id="${a.id}" class="btn-del-aula bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs shrink-0">Excluir</button>
    </div>`).join('') : '<p class="text-xs text-zinc-600">Nenhuma aula criada.</p>';
  document.querySelectorAll('.btn-del-aula').forEach((btn) => btn.addEventListener('click', async () => {
    await apiFetch(`/aulas/${btn.dataset.id}`, { method: 'DELETE' }).catch((e) => ({ error: e.message }));
    carregarAulas();
  }));
  // Checkboxes do montador de pacotes
  document.getElementById('pac-aulas').innerHTML = cacheAulas.filter((a) => !a.gratuita).map((a) => `
    <label class="flex items-center gap-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
      <input type="checkbox" value="${a.id}" class="pac-check accent-emerald-500"> ${a.titulo}
    </label>`).join('') || '<p class="text-xs text-zinc-600">Crie aulas pagas primeiro.</p>';
}

document.getElementById('form-aula')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    titulo: document.getElementById('titulo').value.trim(),
    embedUrl: document.getElementById('embedUrl').value.trim(),
    preco: parseFloat(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value,
    faixaMinima: document.getElementById('faixaMinima').value || null,
    secao: document.getElementById('secao').value.trim() || null,
    ordem: parseInt(document.getElementById('ordem').value) || 0,
    gratuita: document.getElementById('gratuita').checked,
  };
  if (!body.titulo || !body.embedUrl || !(body.preco >= 0)) {
    showModal({ titulo: 'Atenção', mensagem: 'Preencha título, embed e preço.', tipo: 'erro' });
    return;
  }
  const res = await apiFetch('/aulas', { method: 'POST', body: JSON.stringify(body) }).catch((err) => ({ error: err.message }));
  if (res?.error) { showModal({ titulo: 'Erro', mensagem: res.error, tipo: 'erro' }); return; }
  showModal({ titulo: 'Criada', mensagem: 'Aula criada no seu catálogo!', tipo: 'sucesso' });
  e.target.reset();
  carregarAulas();
});

async function carregarPacotes() {
  const pacotes = await apiFetch('/pacotes').catch(() => []);
  document.getElementById('lista-pacotes').innerHTML = pacotes.length ? pacotes.map((p) => `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center gap-3">
      <div><h3 class="font-bold text-sm">📦 ${p.titulo}</h3><p class="text-xs text-zinc-500">${p.itens?.length || 0} aulas • R$ ${Number(p.preco).toFixed(2)}</p></div>
      <button data-id="${p.id}" class="btn-del-pac bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs shrink-0">Excluir</button>
    </div>`).join('') : '<p class="text-xs text-zinc-600">Nenhum pacote.</p>';
  document.querySelectorAll('.btn-del-pac').forEach((btn) => btn.addEventListener('click', async () => {
    await apiFetch(`/pacotes/${btn.dataset.id}`, { method: 'DELETE' }).catch(() => ({}));
    carregarPacotes();
  }));
}

document.getElementById('form-pacote')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const aulaIds = [...document.querySelectorAll('.pac-check:checked')].map((c) => c.value);
  if (!aulaIds.length) { showModal({ titulo: 'Atenção', mensagem: 'Selecione ao menos 1 aula.', tipo: 'erro' }); return; }
  const body = {
    titulo: document.getElementById('pac-titulo').value.trim(),
    preco: parseFloat(document.getElementById('pac-preco').value),
    categoria: document.getElementById('pac-categoria').value,
    aulaIds,
  };
  const res = await apiFetch('/pacotes', { method: 'POST', body: JSON.stringify(body) }).catch((err) => ({ error: err.message }));
  if (res?.error) { showModal({ titulo: 'Erro', mensagem: res.error, tipo: 'erro' }); return; }
  showModal({ titulo: 'Pacote criado', mensagem: 'Pacote visível só para você e seus alunos!', tipo: 'sucesso' });
  e.target.reset();
  carregarPacotes();
});

async function carregarPendentes() {
  const lista = await apiFetch('/aulas/pendentes').catch(() => []);
  document.getElementById('lista-pendentes').innerHTML = lista.length ? lista.map((a) => `
    <div class="bg-zinc-900 border border-yellow-600/30 rounded-xl p-4 flex justify-between items-center gap-3">
      <div><h3 class="font-bold text-sm">${a.aluno?.nome || 'Aluno'}</h3><p class="text-xs text-zinc-500">${a.aula?.titulo} • R$ ${Number(a.aula?.preco || 0).toFixed(2)}${a.aluno?.whatsapp ? ` • ${a.aluno.whatsapp}` : ''}</p></div>
      <button data-aula="${a.aulaId}" data-aluno="${a.alunoId}" class="btn-liberar bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">Liberar</button>
    </div>`).join('') : '<p class="text-xs text-zinc-600">Nenhum pagamento pendente.</p>';
  document.querySelectorAll('.btn-liberar').forEach((btn) => btn.addEventListener('click', async () => {
    await apiFetch(`/aulas/${btn.dataset.aula}/liberar`, { method: 'POST', body: JSON.stringify({ alunoId: btn.dataset.aluno }) }).catch(() => ({}));
    showModal({ titulo: 'Liberado', mensagem: 'Acesso liberado para o aluno!', tipo: 'sucesso' });
    carregarPendentes();
  }));
}

carregarAulas();
carregarPacotes();
carregarPendentes();
