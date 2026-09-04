// gerenciar-alunos - conectado ao backend
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';

if (!obterUsuario() || obterUsuario().role === 'ALUNO') window.location.href = '../home/home.html';

async function carregarAlunos() {
  const tbody = document.getElementById('tabela-alunos');
  tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">Carregando...</td></tr>';
  try {
    const alunos = await apiFetch('/alunos');
    const lista = Array.isArray(alunos) ? alunos : (alunos.alunos || []);
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">Nenhum aluno vinculado.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(aluno => `
      <tr class="hover:bg-zinc-800/50 transition">
        <td class="p-4 text-zinc-200 font-medium">${aluno.nome}</td>
        <td class="p-4 text-zinc-400">${aluno.email}</td>
        <td class="p-4">
          <span class="px-2 py-1 text-xs rounded-full ${aluno.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}">
            ${aluno.status}
          </span>
        </td>
        <td class="p-4 text-right flex gap-2 justify-end">
          <a href="../anamnese/anamnese.html?aluno=${aluno.id}" class="text-zinc-400 hover:text-emerald-400 text-xs">Anamnese</a>
          <a href="../montar-treino/montar-treino.html?aluno=${aluno.id}" class="text-emerald-500 hover:text-emerald-400 text-xs font-medium">Treino</a>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-400">Erro: ${e.message}</td></tr>`;
  }
}
carregarAlunos();
