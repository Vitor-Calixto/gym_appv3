// frontend/gerenciar-aulas/gerenciar-aulas.js
import { apiFetch } from '../js/storage.js';
import { showModal } from '../js/ui.js';
async function carregar(){ const aulas=await apiFetch('/aulas'); document.getElementById('lista-aulas').innerHTML=aulas.map(a=>`<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><h3 class="font-bold">${a.titulo}</h3><p class="text-xs text-zinc-500">${a.categoria} • R$ ${a.preco}</p></div>`).join(''); }
document.getElementById('form-aula')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const body={titulo:document.getElementById('titulo').value, embedUrl:document.getElementById('embedUrl').value, preco:parseFloat(document.getElementById('preco').value), categoria:document.getElementById('categoria').value};
  await apiFetch('/aulas',{method:'POST',body:JSON.stringify(body)});
  showModal({titulo:'Criada',mensagem:'Aula criada!',tipo:'sucesso'}); carregar();
});
carregar();