// montar-treino MFIT style - lista + modal com gifs duplos
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';
if (!obterUsuario() || obterUsuario().role === 'ALUNO') window.location.href = '../home/home.html';

let cache = [];
let ficha = [];
let modalId = null;

async function init() {
  const res = await apiFetch('/exercicios');
  cache = res.exercicios || res || [];
  render();
  // alunos para template opcional
  try {
    const alunos = await apiFetch('/alunos');
    const lista = Array.isArray(alunos) ? alunos : [];
    const sel = document.getElementById('aluno-select');
    sel.innerHTML = '<option value="">📦 Template (sem aluno)</option>' + lista.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('');
    const p = new URLSearchParams(location.search).get('aluno');
    if (p) sel.value = p;
  } catch {}
}

function render() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const grupo = document.getElementById('filtro-grupo').value;
  let lista = cache.filter(e => {
    if (grupo && e.grupoMuscular !== grupo) return false;
    if (busca && !e.nome.toLowerCase().includes(busca)) return false;
    return true;
  });
  const grid = document.getElementById('grid-exercicios');
  grid.innerHTML = lista.map(ex => {
    const gif = ex.gifInicioUrl || ex.gifUrl || '';
    const hasGif = gif && !gif.includes('placehold');
    const isSel = ficha.find(f=>f.exercicioId===ex.id);
    return `
    <div class="bg-zinc-900 border ${isSel ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'} rounded-xl flex gap-3 p-3 items-center cursor-pointer hover:border-zinc-700" onclick="abrirModal('${ex.id}')">
      <div class="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-800">
        ${hasGif ? `<img src="${gif}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" referrerpolicy="no-referrer"><div style="display:none" class="text-zinc-600 text-xs">404</div>` : `<div class="text-zinc-600 text-xs">sem gif</div>`}
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-sm text-zinc-100 leading-tight truncate">${ex.nome}</h4>
        <div class="flex gap-1 mt-1">
          <span class="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">${ex.grupoMuscular}</span>
          <span class="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">${ex.nivel || 'Musculação'}</span>
        </div>
      </div>
      <div class="w-4 h-4 rounded border ${isSel ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'} flex items-center justify-center text-[10px] text-zinc-950" onclick="event.stopPropagation(); toggleFicha('${ex.id}')">${isSel?'✓':''}</div>
    </div>`;
  }).join('');
}

window.abrirModal = (id) => {
  const ex = cache.find(e=>e.id===id);
  if(!ex) return;
  modalId = id;
  document.getElementById('modal-titulo').textContent = ex.nome;
  document.getElementById('modal-grupo').textContent = ex.grupoMuscular;
  document.getElementById('modal-gif-inicio').src = ex.gifInicioUrl || ex.gifUrl || '';
  document.getElementById('modal-gif-fim').src = ex.gifFimUrl || ex.gifUrl || '';
  // carrega config existente se já na ficha
  const f = ficha.find(x=>x.exercicioId===id);
  document.getElementById('modal-series').value = f?.series || 3;
  document.getElementById('modal-reps').value = f?.repeticoes || '12';
  document.getElementById('modal-descanso').value = f?.descansoSeg || 60;
  document.getElementById('modal-obs').value = f?.observacoes || '';
  document.getElementById('modal-exercicio').classList.remove('hidden');
};
window.fecharModal = () => { document.getElementById('modal-exercicio').classList.add('hidden'); modalId=null; };

window.salvarDoModal = () => {
  if(!modalId) return;
  const series = document.getElementById('modal-series').value;
  const reps = document.getElementById('modal-reps').value;
  const descanso = document.getElementById('modal-descanso').value;
  const obs = document.getElementById('modal-obs').value;
  const ex = cache.find(e=>e.id===modalId);
  const idx = ficha.findIndex(f=>f.exercicioId===modalId);
  const item = { exercicioId: modalId, nome: ex.nome, series, repeticoes: reps, descansoSeg: descanso, observacoes: obs };
  if (idx >=0) ficha[idx]=item; else ficha.push(item);
  atualizarCount(); fecharModal(); render();
};

window.toggleFicha = (id) => {
  const idx = ficha.findIndex(f=>f.exercicioId===id);
  if (idx>=0) ficha.splice(idx,1);
  else {
    const ex = cache.find(e=>e.id===id);
    ficha.push({ exercicioId: id, nome: ex.nome, series: 3, repeticoes: '12', descansoSeg: 60 });
  }
  atualizarCount(); render();
};

function atualizarCount() {
  document.getElementById('ficha-count').textContent = `${ficha.length} exercícios selecionados`;
}

document.getElementById('busca').addEventListener('input', render);
document.getElementById('filtro-grupo').addEventListener('change', render);
document.getElementById('btn-limpar').addEventListener('click', ()=>{ document.getElementById('busca').value=''; document.getElementById('filtro-grupo').value=''; render(); });

document.getElementById('btn-salvar-treino').addEventListener('click', async () => {
  const nome = document.getElementById('nome-treino').value.trim();
  const alunoId = document.getElementById('aluno-select').value || null;
  if (!nome || !ficha.length) return showModal({ titulo: 'Atenção', mensagem: 'Informe nome e selecione exercícios.', tipo: 'erro' });
  const payload = { nome, itens: ficha };
  if (alunoId) payload.alunoId = alunoId;
  const res = await apiFetch('/treinos', { method: 'POST', body: JSON.stringify(payload) });
  if (res && res.id) { showModal({ titulo: 'Sucesso', mensagem: alunoId ? 'Treino atribuído!' : 'Template salvo!', tipo: 'sucesso' }); ficha=[]; atualizarCount(); render(); document.getElementById('nome-treino').value=''; }
  else showModal({ titulo: 'Erro', mensagem: res.error||'Erro ao salvar', tipo: 'erro' });
});

init();
