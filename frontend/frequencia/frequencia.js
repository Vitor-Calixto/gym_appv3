// Frequência persistente (localStorage) + heatmap 35 dias
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

const eu = obterUsuario();
if (!eu) location.href = '../index/index.html';
const KEY = `omni_freq_${eu.id}`;

function ler() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

function salvar(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 365)));
}

function hojeISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function render() {
  const dias = new Set(ler());
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-7 gap-1.5';
  const celulas = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ativo = dias.has(iso);
    celulas.push(`<div title="${iso}" class="aspect-square rounded-md border ${ativo ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-950 border-zinc-800'}"></div>`);
  }
  grid.innerHTML = celulas.join('');

  const lista = document.getElementById('lista-frequencia');
  lista.innerHTML = '';
  lista.appendChild(grid);
  const total = dias.size;
  const info = document.createElement('p');
  info.className = 'text-xs text-zinc-500 pt-2';
  info.textContent = `${total} dia(s) com treino registrado neste dispositivo.`;
  lista.appendChild(info);
}

document.getElementById('btn-checkin')?.addEventListener('click', () => {
  const arr = ler();
  const hoje = hojeISO();
  if (arr.includes(hoje)) {
    showModal({ titulo: 'Já registrado', mensagem: 'Check-in de hoje já feito.', tipo: 'erro' });
    return;
  }
  arr.unshift(hoje);
  salvar(arr);
  render();
  showModal({ titulo: 'Check-in', mensagem: 'Check-in realizado! Bom treino.', tipo: 'sucesso' });
});

render();
