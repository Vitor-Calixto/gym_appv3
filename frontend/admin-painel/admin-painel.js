import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

const user = obterUsuario();
if (!user || (user.role !== 'ADMIN' && user.role !== 'PROFESSOR')) {
  showModal({ titulo: 'Acesso negado', mensagem: 'Apenas ADMIN/PROFESSOR.', tipo: 'erro', onConfirm: () => window.location.href = '../home/home.html' });
}

let cache = [];
let grupoAtivo = '';

const grid = document.getElementById('grid-exercicios');
const vazio = document.getElementById('vazio');
const totalCount = document.getElementById('total-count');

async function carregar() {
  grid.innerHTML = '<p class="col-span-4 text-center text-zinc-500 text-sm py-10">Carregando 330 exercícios...</p>';
  try {
    const res = await apiFetch('/exercicios');
    // compat: pode vir {exercicios:[]} ou array direto
    cache = res.exercicios || res || [];
    if (!Array.isArray(cache)) cache = [];
    totalCount.textContent = cache.length;
    render();
  } catch (e) {
    grid.innerHTML = `<p class="col-span-4 text-center text-red-400 text-sm py-10">Erro ao carregar: ${e.message}</p>`;
  }
}

function render() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const nivel = document.getElementById('filtro-nivel').value;
  let filtrados = cache.filter(ex => {
    if (grupoAtivo && ex.grupoMuscular !== grupoAtivo) return false;
    if (nivel && ex.nivel !== nivel) return false;
    if (busca && !ex.nome.toLowerCase().includes(busca)) return false;
    return true;
  });

  if (filtrados.length === 0) {
    grid.innerHTML = '';
    vazio.classList.remove('hidden');
    return;
  }
  vazio.classList.add('hidden');
  grid.innerHTML = filtrados.map(ex => {
    const gifInicio = ex.gifInicioUrl || ex.gifUrl || 'https://placehold.co/200x200/18181b/71717a?text=GIF';
    const gifFim = ex.gifFimUrl || ex.gifUrl || gifInicio;
    return `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-emerald-500/40 transition group">
      <div class="gif-anim relative h-36 bg-black overflow-hidden">
        <img src="${gifInicio}" onerror="this.src='https://placehold.co/200x200/18181b/71717a?text=404'" class="gif-layer gif-inicio w-full h-full object-contain">
        <img src="${gifFim}" onerror="this.style.display='none'" class="gif-layer gif-fim w-full h-full object-contain absolute inset-0">
        <span class="absolute top-2 left-2 bg-zinc-950/80 text-[10px] px-2 py-0.5 rounded-full border border-zinc-800">${ex.grupoMuscular}</span>
        <span class="absolute top-2 right-2 bg-emerald-600/90 text-[10px] px-2 py-0.5 rounded-full">${ex.nivel || 'INICIANTE'}</span>
      </div>
      <div class="p-3">
        <h4 class="font-bold text-sm truncate">${ex.nome}</h4>
        <p class="text-xs text-zinc-500 truncate">${ex.descricao || ''}</p>
        <p class="text-[10px] text-zinc-600 mt-1">${ex.equipamento || ''}</p>
        <button onclick="abrirModal('${ex.id}')" class="mt-2 w-full bg-zinc-800 hover:bg-emerald-600 hover:text-white text-xs py-2 rounded-lg transition">Editar</button>
      </div>
    </div>`;
  }).join('');
}

// Filtros
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('bg-emerald-600','text-white','active'));
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.add('bg-zinc-800','text-zinc-400'));
    btn.classList.remove('bg-zinc-800','text-zinc-400');
    btn.classList.add('bg-emerald-600','text-white','active');
    grupoAtivo = btn.dataset.grupo;
    render();
  });
});
document.getElementById('busca').addEventListener('input', render);
document.getElementById('filtro-nivel').addEventListener('change', render);
document.getElementById('btn-recarregar').addEventListener('click', carregar);

// Modal
window.abrirModal = (id) => {
  const ex = cache.find(e => e.id === id);
  if (!ex) return;
  document.getElementById('edit-id').value = ex.id;
  document.getElementById('edit-nome').value = ex.nome;
  document.getElementById('edit-grupo').value = ex.grupoMuscular;
  document.getElementById('edit-nivel').value = ex.nivel || 'INICIANTE';
  document.getElementById('edit-desc').value = ex.descricao || '';
  document.getElementById('edit-gifInicio').value = ex.gifInicioUrl || ex.gifUrl || '';
  document.getElementById('edit-gifFim').value = ex.gifFimUrl || ex.gifUrl || '';
  document.getElementById('preview-inicio').src = ex.gifInicioUrl || ex.gifUrl || '';
  document.getElementById('preview-fim').src = ex.gifFimUrl || ex.gifUrl || '';
  document.getElementById('preview-fim2').src = ex.gifFimUrl || ex.gifUrl || '';
  document.getElementById('file-inicio').value = '';
  document.getElementById('file-fim').value = '';
  document.getElementById('modal-editar').classList.remove('hidden');
};
window.fecharModal = () => document.getElementById('modal-editar').classList.add('hidden');

// Preview dinâmico
document.getElementById('edit-gifInicio').addEventListener('input', e => document.getElementById('preview-inicio').src = e.target.value);
document.getElementById('edit-gifFim').addEventListener('input', e => { document.getElementById('preview-fim').src = e.target.value; document.getElementById('preview-fim2').src = e.target.value; });

// Salvar
document.getElementById('form-editar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const payload = {
    nome: document.getElementById('edit-nome').value,
    grupoMuscular: document.getElementById('edit-grupo').value,
    nivel: document.getElementById('edit-nivel').value,
    descricao: document.getElementById('edit-desc').value,
    gifInicioUrl: document.getElementById('edit-gifInicio').value,
    gifFimUrl: document.getElementById('edit-gifFim').value,
  };

  const fileInicio = document.getElementById('file-inicio').files[0];
  const fileFim = document.getElementById('file-fim').files[0];

  try {
    let res;
    if (fileInicio || fileFim) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k,v]) => fd.append(k, v));
      if (fileInicio) fd.append('gifInicio', fileInicio);
      if (fileFim) fd.append('gifFim', fileFim);
      const token = localStorage.getItem('omni_token');
      res = await fetch(`http://localhost:3001/api/exercicios/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: fd }).then(r=>r.json());
    } else {
      res = await apiFetch(`/exercicios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    }
    if (res && (res.id || res.sucesso)) {
      showModal({ titulo: 'Sucesso', mensagem: 'Exercício atualizado!', tipo: 'sucesso' });
      fecharModal();
      await carregar();
    } else {
      showModal({ titulo: 'Erro', mensagem: res.error || 'Erro ao salvar', tipo: 'erro' });
    }
  } catch (err) {
    showModal({ titulo: 'Erro', mensagem: err.message, tipo: 'erro' });
  }
});

carregar();
