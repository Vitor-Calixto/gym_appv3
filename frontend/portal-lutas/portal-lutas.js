// frontend/portal-lutas/portal-lutas.js
import { apiFetch } from '../js/storage.js';
const VIDEOS_LUIZ_DOREA = ['_8u1rX4bksM','CTXLq50wU0Q'];
async function carregarPlaylist(){
  const grid=document.getElementById('grid-aulas');
  const demo=document.createElement('div');
  demo.className='grid gap-3 mb-6';
  demo.innerHTML=`<h2 class="font-bold text-emerald-500">Luiz Dorea - Ao Vivo</h2>` + VIDEOS_LUIZ_DOREA.map(id=>`
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <iframe class="w-full h-64" src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
      <div class="p-3"><p class="text-xs text-zinc-500">youtube.com/live/${id}</p></div>
    </div>
  `).join('');
  grid.before(demo);
}
async function carregar(){
  const aulas=await apiFetch('/aulas');
  document.getElementById('grid-aulas').innerHTML=aulas.map(a=>`
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div class="p-4">
        <h3 class="font-bold">${a.titulo}</h3><p class="text-xs text-zinc-500">${a.categoria}</p>
        <button onclick="comprar('${a.id}')" class="mt-2 bg-emerald-600 px-3 py-1 rounded text-xs">Comprar R$ ${a.preco} - PIX</button>
        <div id="aula-${a.id}" class="hidden mt-3"></div>
      </div>
    </div>`).join('');
}
window.comprar=async(id)=>{
  const res=await apiFetch(`/aulas/${id}/comprar`,{method:'POST'});
  if(res.qrCode){
    document.getElementById(`aula-${id}`).innerHTML=`<img src="data:image/png;base64,${res.qrCode}" class="w-48 mx-auto"><p class="text-xs text-center mt-2 break-all">${res.copiaCola}</p>`;
    document.getElementById(`aula-${id}`).classList.remove('hidden');
  }
};
carregarPlaylist();
carregar();