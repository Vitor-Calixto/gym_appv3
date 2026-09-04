// home.js - com navbar por role + hero
import { apiFetch } from '../js/storage.js';
import { obterUsuario, logout } from '../js/auth.js';

const usuario = obterUsuario();
if (!usuario) window.location.href = '../index/index.html';
else {
  document.getElementById('boas-vindas').textContent = `Olá, ${usuario.nome}`;
  // Mostra links por role
  if (usuario.role === 'ADMIN' || usuario.role === 'PROFESSOR') {
    document.querySelectorAll('.link-prof').forEach(el => el.classList.remove('hidden'));
  }
  if (usuario.role === 'ADMIN') {
    document.querySelectorAll('.link-admin').forEach(el => el.classList.remove('hidden'));
  }
  carregarTreinos();
}

document.getElementById('btn-logout').addEventListener('click', logout);

async function carregarTreinos() {
  const container = document.getElementById('lista-treinos');
  try {
    let treinos = [];
    if (usuario.role === 'PROFESSOR' || usuario.role === 'ADMIN') {
      treinos = await apiFetch('/treinos/templates');
    } else {
      treinos = await apiFetch('/treinos/aluno');
    }
    if (!treinos || treinos.length === 0) {
      container.innerHTML = '<p class="text-zinc-500 text-sm col-span-3">Nenhum treino cadastrado. Peça ao seu professor para montar sua ficha.</p>';
      return;
    }
    container.innerHTML = treinos.slice(0,6).map(t => `
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-emerald-500/50 transition">
        <h3 class="font-bold text-emerald-400">${t.nome}</h3>
        <p class="text-xs text-zinc-500 mb-3">${t.itens.length} exercícios • ${t.itens.map(i=>i.exercicio.nome).slice(0,2).join(', ')}</p>
        <a href="../executar-treino/executar-treino.html?id=${t.id}" class="inline-block bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs">▶ Iniciar</a>
        <a href="../meus-treinos/meus-treinos.html" class="ml-2 text-xs text-zinc-400 hover:text-white">Ver</a>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p class="text-red-400 text-sm">Erro ao carregar treinos.</p>';
  }
}
