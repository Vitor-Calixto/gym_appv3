// financeiro.js - conectado ao backend
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal, showPrompt } from '../js/ui.js';

if (!obterUsuario()) window.location.href = '../index/index.html';

async function carregarFinanceiro() {
  const tbody = document.getElementById('tabela-financeiro');
  tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">Carregando...</td></tr>';
  try {
    const faturas = await apiFetch('/financeiro');
    const lista = Array.isArray(faturas) ? faturas : [];
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">Nenhuma fatura.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(f => {
      const ref = new Date(f.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const venc = new Date(f.createdAt).toLocaleDateString('pt-BR');
      const valor = `R$ ${Number(f.valor).toFixed(2).replace('.',',')}`;
      const status = f.status;
      return `
      <tr class="hover:bg-zinc-800/50 transition">
        <td class="p-4 text-zinc-200 font-medium capitalize">${f.plano} • ${ref}</td>
        <td class="p-4 text-zinc-400">${venc}</td>
        <td class="p-4 text-zinc-300 font-mono">${valor}</td>
        <td class="p-4">
          <span class="px-2 py-1 text-xs rounded-full ${status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-400' : status === 'PENDENTE' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-400'}">
            ${status}
          </span>
          ${status === 'PENDENTE' ? `<button onclick=\"pagar('${f.id}')\" class="ml-2 text-xs bg-emerald-600 px-2 py-1 rounded">Pagar</button>` : ''}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-400">Erro: ${e.message}</td></tr>`;
  }
}

window.pagar = async (id) => {
  try {
    const res = await apiFetch('/financeiro/checkout', { method: 'POST', body: JSON.stringify({ plano: 'MENSAL' }) });
    if (res.checkoutUrl) window.open(res.checkoutUrl, '_blank');
    else showModal({ titulo: 'Checkout', mensagem: 'Checkout gerado!', tipo: 'sucesso' });
  } catch (e) { showModal({ titulo: 'Erro', mensagem: e.message, tipo: 'erro' }); }
};

// Botão criar mensalidade (só professor/admin)
const user = obterUsuario();
if (user.role !== 'ALUNO') {
  const header = document.querySelector('header');
  const btn = document.createElement('button');
  btn.textContent = '+ Gerar Mensalidade';
  btn.className = 'bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold mt-2';
  btn.onclick = () => {
    showPrompt({ titulo: 'Gerar mensalidade', placeholder: 'ID do aluno (vazio para você)', onConfirm: (alunoId) => {
      showPrompt({ titulo: 'Plano', placeholder: 'MENSAL/TRIMESTRAL/ANUAL', valor: 'MENSAL', onConfirm: async (plano) => {
        await apiFetch('/financeiro/checkout', { method: 'POST', body: JSON.stringify({ plano: plano||'MENSAL', alunoId: alunoId || undefined }) });
        showModal({ titulo: 'Sucesso', mensagem: 'Fatura criada!', tipo: 'sucesso' });
        carregarFinanceiro();
      }});
    }});
  };
  header.appendChild(btn);
}

carregarFinanceiro();
