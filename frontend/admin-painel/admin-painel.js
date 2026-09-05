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

// --- Dashboard global ADMIN: usuários, planos e prazo ---
const ehAdmin = user && user.role === 'ADMIN';
if (ehAdmin) {
  document.getElementById('abas-admin')?.classList.remove('hidden');
  document.getElementById('abas-admin')?.classList.add('flex');
  document.getElementById('resumo-admin')?.classList.remove('hidden');
  carregarResumo();
  document.querySelectorAll('.aba-btn').forEach((b) => b.addEventListener('click', () => alternarAba(b.dataset.aba)));
  document.getElementById('busca-usuario')?.addEventListener('input', carregarUsuarios);
  document.getElementById('filtro-role')?.addEventListener('change', carregarUsuarios);
  document.getElementById('filtro-status')?.addEventListener('change', carregarFaturas);
  document.getElementById('btn-recarregar-faturas')?.addEventListener('click', carregarFaturas);
  carregarUsuarios();
  carregarFaturas();
}

function alternarAba(aba) {
  document.getElementById('secao-usuarios')?.classList.toggle('hidden', aba !== 'usuarios');
  document.getElementById('secao-faturas')?.classList.toggle('hidden', aba !== 'faturas');
  document.querySelectorAll('.aba-btn').forEach((b) => {
    const ativa = b.dataset.aba === aba;
    b.className = `aba-btn px-3 py-1.5 rounded-lg text-xs ${ativa ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400'}`;
  });
}

async function carregarFaturas() {
  const tbody = document.getElementById('tabela-faturas');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-zinc-500">Carregando...</td></tr>';
  const status = document.getElementById('filtro-status')?.value || '';
  const lista = await apiFetch(`/admin/faturas${status ? `?status=${status}` : ''}`).catch(() => []);
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-zinc-500">Nenhuma fatura.</td></tr>'; return; }
  tbody.innerHTML = lista.map((f) => `
    <tr class="border-t border-zinc-800 hover:bg-zinc-800/40">
      <td class="p-2">${f.aluno?.nome || f.alunoId}<br><span class="text-zinc-500">${f.aluno?.email || ''}</span></td>
      <td class="p-2">${f.plano} (R$ ${Number(f.valor).toFixed(2)})</td>
      <td class="p-2 ${f.status === 'PAGO' ? 'text-emerald-400' : f.status === 'PENDENTE' ? 'text-yellow-400' : 'text-red-400'}">${f.status}</td>
      <td class="p-2 text-zinc-400">${new Date(f.createdAt).toLocaleDateString('pt-BR')}</td>
      <td class="p-2 text-zinc-400">${f.mercadoPagoId || '-'}</td>
      <td class="p-2 flex gap-1">
        <button data-id="${f.id}" data-status="PAGO" class="btn-fat bg-emerald-600 px-2 py-1 rounded">PAGO</button>
        <button data-id="${f.id}" data-status="PENDENTE" class="btn-fat bg-yellow-600 px-2 py-1 rounded">PENDENTE</button>
        <button data-id="${f.id}" data-status="CANCELADO" class="btn-fat bg-zinc-700 px-2 py-1 rounded">CANCELAR</button>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('.btn-fat').forEach((btn) => btn.addEventListener('click', async () => {
    const res = await apiFetch(`/admin/faturas/${btn.dataset.id}`, { method: 'PUT', body: JSON.stringify({ status: btn.dataset.status }) }).catch((e) => ({ error: e.message }));
    showModal(res.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Salvo', mensagem: `Fatura marcada como ${btn.dataset.status}.`, tipo: 'sucesso' });
    carregarFaturas();
    carregarUsuarios();
    carregarResumo();
  }));
}

async function carregarResumo() {
  try {
    const r = await apiFetch('/admin/resumo');
    document.getElementById('resumo-admin').innerHTML = `
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><p class="text-xs text-zinc-500">Alunos</p><p class="font-bold">${r.totalAlunos}</p></div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><p class="text-xs text-zinc-500">Professores</p><p class="font-bold">${r.totalProfessores}</p></div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><p class="text-xs text-zinc-500">Faturas pagas</p><p class="font-bold">${r.totalFaturasPagas}</p></div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><p class="text-xs text-zinc-500">Receita</p><p class="font-bold">R$ ${Number(r.receitaTotal || 0).toFixed(2)}</p></div>`;
  } catch {}
}

async function carregarUsuarios() {
  const tbody = document.getElementById('tabela-usuarios');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-zinc-500">Carregando...</td></tr>';
  const q = document.getElementById('busca-usuario')?.value || '';
  const role = document.getElementById('filtro-role')?.value || '';
  const lista = await apiFetch(`/admin/usuarios?search=${encodeURIComponent(q)}${role ? `&role=${role}` : ''}`).catch(() => []);
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-zinc-500">Nenhum usuário.</td></tr>'; return; }
  tbody.innerHTML = lista.map((u) => `
    <tr class="border-t border-zinc-800 hover:bg-zinc-800/40">
      <td class="p-2 font-medium">${u.nome}</td>
      <td class="p-2 text-zinc-400">${u.email}</td>
      <td class="p-2"><select data-id="${u.id}" class="sel-role bg-zinc-950 border border-zinc-800 rounded px-1 py-1">${['ALUNO', 'PROFESSOR', 'ADMIN'].map((r) => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
      <td class="p-2 text-zinc-400">${u.professor?.nome || '-'}</td>
      <td class="p-2">${u.planoAtual || '-'}</td>
      <td class="p-2 ${u.diasRestantes < 0 ? 'text-red-400' : u.statusAssinatura === 'ATIVO' ? 'text-emerald-400' : 'text-yellow-400'}">${u.planoAtual ? `${u.diasRestantes}d (${u.statusAssinatura})` : '-'}</td>
      <td class="p-2"><button data-id="${u.id}" class="btn-salvar-user bg-emerald-600 px-2 py-1 rounded">Salvar</button></td>
    </tr>`).join('');
  tbody.querySelectorAll('.btn-salvar-user').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    const roleSel = tbody.querySelector(`.sel-role[data-id="${id}"]`)?.value;
    const res = await apiFetch(`/admin/usuarios/${id}`, { method: 'PUT', body: JSON.stringify({ role: roleSel }) }).catch((e) => ({ error: e.message }));
    showModal(res.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Salvo', mensagem: 'Perfil atualizado.', tipo: 'sucesso' });
    carregarUsuarios();
  }));
}

carregar();
