// Lógica da tela alunos
// frontend/alunos/alunos.js
import { apiFetch } from '../js/storage.js';
const id=new URLSearchParams(location.search).get('id');
async function carregar(){
  const aluno=await apiFetch(`/alunos/${id}`);
  document.getElementById('perfil').innerHTML=`
    <div class="flex gap-4">
      <img src="${aluno.fotoUrl||'https://placehold.co/100x100'}" class="w-20 h-20 rounded-xl object-cover">
      <div>
        <h1 class="font-bold text-lg">${aluno.nome}</h1>
        <p class="text-sm text-zinc-400">${aluno.email} • ${aluno.whatsapp||''}</p>
        <p class="text-xs text-zinc-500">${aluno.treinos?.length||0} treinos • Anamnese: ${aluno.anamnese?'OK':'pendente'}</p>
      </div>
    </div>`;
  document.getElementById('treinos').innerHTML=(aluno.treinos||[]).map(t=>`<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><h3 class="font-bold text-emerald-400">${t.nome}</h3><p class="text-xs text-zinc-500">${t.itens.length} exercícios</p><a href="../executar-treino/executar-treino.html?id=${t.id}" class="text-xs text-emerald-400">Ver</a></div>`).join('');
}
carregar();