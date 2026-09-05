// Lógica da tela alunos (perfil do aluno para o professor)
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

const eu = obterUsuario();
if (!eu) location.href = '../index/index.html';
const id = new URLSearchParams(location.search).get('id');
if (!id) location.href = '../gerenciar-alunos/gerenciar-alunos.html';

const podeEditar = eu.role === 'ADMIN' || eu.role === 'PROFESSOR';
if (podeEditar) document.getElementById('edicao')?.classList.remove('hidden');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function carregar() {
  try {
    const aluno = await apiFetch(`/alunos/${id}`);
    document.getElementById('perfil').innerHTML = `
      <div class="flex gap-4">
        <img src="${esc(aluno.fotoUrl) || 'https://placehold.co/100x100'}" class="w-20 h-20 rounded-xl object-cover border border-zinc-800">
        <div class="min-w-0">
          <h1 class="font-bold text-lg truncate">${esc(aluno.nome)}</h1>
          <p class="text-sm text-zinc-400 truncate">${esc(aluno.email)} • ${esc(aluno.whatsapp || 'sem whatsapp')}</p>
          <p class="text-xs text-zinc-500">${aluno.treinos?.length || 0} treinos • Anamnese: ${aluno.anamnese ? 'OK' : 'pendente'}</p>
        </div>
      </div>`;
    if (podeEditar && aluno.whatsapp) {
      const w = document.getElementById('whatsapp');
      if (w && !w.value) w.value = aluno.whatsapp;
    }
    document.getElementById('treinos').innerHTML = (aluno.treinos || []).map((t) => `<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><h3 class="font-bold text-emerald-400">${esc(t.nome)}</h3><p class="text-xs text-zinc-500">${t.itens.length} exercícios</p><a href="../executar-treino/executar-treino.html?id=${t.id}" class="text-xs text-emerald-400">Ver</a></div>`).join('');
  } catch (e) {
    document.getElementById('perfil').innerHTML = `<p class="text-red-400 text-sm">Erro: ${esc(e.message)}</p>`;
  }
}

document.getElementById('btn-whatsapp')?.addEventListener('click', async () => {
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const res = await apiFetch(`/usuarios/${id}/whatsapp`, { method: 'PUT', body: JSON.stringify({ whatsapp }) }).catch((e) => ({ error: e.message }));
  showModal(res?.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Salvo', mensagem: 'WhatsApp atualizado.', tipo: 'sucesso' });
  carregar();
});

document.getElementById('form-foto')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('foto').files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('foto', file);
  const token = localStorage.getItem('omni_token');
  const res = await fetch(`http://localhost:3001/api/usuarios/foto?alunoId=${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }).then((r) => r.json()).catch((err) => ({ error: err.message }));
  showModal(res?.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Foto atualizada', mensagem: 'Foto do aluno atualizada.', tipo: 'sucesso' });
  carregar();
});

carregar();
