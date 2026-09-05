// frontend/gerenciar-alunos/gerenciar-alunos.js
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal, showPrompt } from '../js/ui.js';
if (!obterUsuario() || obterUsuario().role === 'ALUNO') location.href='../home/home.html';
async function carregar(){
  const grid=document.getElementById('grid-alunos');
  grid.innerHTML='<p class="text-zinc-500 text-sm">Carregando...</p>';
  const alunos=await apiFetch('/alunos');
  const lista=Array.isArray(alunos)?alunos:[];
  if(!lista.length){ grid.innerHTML='<p class="text-zinc-500 text-sm">Nenhum aluno. Convide.</p>'; return; }
  grid.innerHTML=lista.map(a=>`
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3">
      <img src="${a.fotoUrl||'https://placehold.co/80x80/18181b/71717a?text=Foto'}" class="w-16 h-16 rounded-xl object-cover border border-zinc-800">
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-sm truncate">${a.nome}</h3>
        <p class="text-xs text-zinc-400 truncate">${a.email}</p>
        <p class="text-xs text-emerald-400 truncate">${a.whatsapp||'sem whatsapp'}</p>
        <div class="flex gap-2 mt-2">
          <a href="../alunos/alunos.html?id=${a.id}" class="text-xs bg-zinc-800 px-2 py-1 rounded">Perfil</a>
          <a href="../montar-treino/montar-treino.html?aluno=${a.id}" class="text-xs bg-emerald-600 px-2 py-1 rounded text-zinc-950">Treino</a>
        </div>
      </div>
    </div>
  `).join('');
}
document.getElementById('btn-convidar')?.addEventListener('click',()=>showPrompt({titulo:'Convidar aluno',placeholder:'E-mail',onConfirm:async(email)=>{ if(!email) return; const r=await apiFetch('/convites/convidar',{method:'POST',body:JSON.stringify({email})}); showModal({titulo:'Enviado',mensagem:`Convite para ${email}`,tipo:'sucesso'});}}));
carregar();