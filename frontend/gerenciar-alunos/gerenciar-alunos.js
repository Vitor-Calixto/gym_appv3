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
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
}

document.getElementById('btn-cadastrar').onclick=()=>{
  document.getElementById('modal-cadastro').classList.remove('hidden');
};
document.getElementById('btn-fechar-cadastro').onclick=()=>{
  document.getElementById('modal-cadastro').classList.add('hidden');
};

document.getElementById('form-cadastro-aluno').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = {
    nome: document.getElementById('cad-nome').value.trim(),
    email: document.getElementById('cad-email').value.trim(),
    senha: document.getElementById('cad-senha').value,
    whatsapp: document.getElementById('cad-whatsapp').value.trim() || undefined,
  };
  const res = await apiFetch('/alunos', { method: 'POST', body: JSON.stringify(body) }).catch((err)=>({ error: err.message }));
  if (res?.error || res?.message?.includes?.('Erro')) {
    showModal({ titulo: 'Erro', mensagem: res.error || 'Falha ao cadastrar.', tipo: 'erro' });
    return;
  }
  document.getElementById('modal-cadastro').classList.add('hidden');
  e.target.reset();
  showModal({ titulo: 'Aluno cadastrado!', mensagem: `${body.nome} já está vinculado a você e pode fazer login.`, tipo: 'sucesso' });
  carregar();
});

document.getElementById('btn-convidar').onclick=async()=>{
  try {
    const r=await apiFetch('/convites/link',{method:'POST'});
    if (!r || !r.link) throw new Error(r?.error || 'Resposta inválida do servidor.');
    const copiado = await copiarTexto(r.link);
    showModal({titulo: copiado ? 'Link copiado!' : 'Link de convite', mensagem:`<a href="${r.link}" target="_blank" class="text-emerald-400 underline break-all">${r.link}</a><p class="mt-2">${copiado ? 'Já copiei para sua área de transferência — envie ao aluno.' : 'Toque no link para abrir ou copie e envie ao aluno.'}</p>`,tipo:'sucesso'});
  } catch (e) {
    showModal({titulo:'Erro',mensagem: e.message || 'Falha ao gerar link.',tipo:'erro'});
  }
};

carregar();
