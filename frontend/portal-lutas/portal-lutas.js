// Espelho da lógica inline de portal-lutas.html (a página usa o script inline).
// Mantido para evitar código obsoleto caso a página volte a usar este arquivo.
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

export async function carregarPortal(gridId = 'grid-aulas') {
  const user = obterUsuario();
  if (!user) { location.href = '../index/index.html'; return; }
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const [aulas, minhas] = await Promise.all([
    apiFetch('/aulas').catch(() => []),
    apiFetch('/aulas/minhas').catch(() => []),
  ]);
  const liberadas = new Map((minhas || []).map((m) => [m.aulaId || m.aula?.id, m]));
  grid.innerHTML = (aulas || []).map((a) => {
    const lib = liberadas.get(a.id);
    if (lib) return `<div class="bg-zinc-900 border border-emerald-600/40 rounded-xl p-4"><h3 class="font-bold text-sm">${a.titulo}</h3><p class="text-xs text-emerald-400">LIBERADA</p></div>`;
    return `<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><h3 class="font-bold text-sm">${a.titulo}</h3><button data-id="${a.id}" class="btn-comprar mt-2 bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">Comprar</button><div id="aula-${a.id}" class="hidden mt-3"></div></div>`;
  }).join('');
  grid.querySelectorAll('.btn-comprar').forEach((btn) => btn.addEventListener('click', async () => {
    const res = await apiFetch(`/aulas/${btn.dataset.id}/comprar`, { method: 'POST' }).catch((e) => ({ error: e.message }));
    if (res?.error) { showModal({ titulo: 'Bloqueado', mensagem: res.error, tipo: 'erro' }); return; }
    if (res?.jaLiberado) { location.reload(); return; }
  }));
}
