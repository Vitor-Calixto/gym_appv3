// Lógica da tela meus-treinos
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';

if (!obterUsuario()) window.location.href = '../index/index.html';

let todosTreinos = [];

async function carregarTreinos() {
  const container = document.getElementById('grid-treinos');
  const usuario = obterUsuario();
  let treinos = [];
  if (usuario.role === 'PROFESSOR' || usuario.role === 'ADMIN') {
    const templates = await apiFetch('/treinos/templates');
    treinos = Array.isArray(templates) ? templates : [];
    // também busca treinos atribuídos a alunos do professor
  } else {
    treinos = await apiFetch('/treinos/aluno');
  }

  if (!treinos || treinos.length === 0) {
    container.innerHTML = '<p class="text-zinc-500 text-sm col-span-full">Nenhum histórico de treinos encontrado.</p>';
    return;
  }

  todosTreinos = treinos;
  renderizarTreinos(todosTreinos);
}

function renderizarTreinos(lista) {
  const container = document.getElementById('grid-treinos');
  container.innerHTML = lista.map(t => `
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/50 transition flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-lg text-emerald-400">${t.nome}</h3>
        <p class="text-xs text-zinc-400 mt-1">${new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
        <p class="text-sm text-zinc-300 mt-3 mb-4">${t.itens.length} exercícios na ficha</p>
      </div>
      <a href="../executar-treino/executar-treino.html?id=${t.id}" class="text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2 rounded-lg text-xs transition border border-zinc-700">Ver Ficha Completa</a>
    </div>
  `).join('');
}

document.getElementById('busca-treino').addEventListener('input', (e) => {
  const termo = e.target.value.toLowerCase();
  const filtrados = todosTreinos.filter(t => t.nome.toLowerCase().includes(termo));
  renderizarTreinos(filtrados);
});

carregarTreinos();