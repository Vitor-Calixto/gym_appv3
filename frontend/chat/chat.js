// Chat offline-first (localStorage) entre professor e aluno
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';

const eu = obterUsuario();
if (!eu) location.href = '../index/index.html';

const sel = document.getElementById('conversa');
const box = document.getElementById('mensagens');
let parceiroId = null;
let parceiroNome = '';

function chaveChat(a, b) {
  return `omni_chat_${[a, b].sort().join('_')}`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function carregarParceiros() {
  let lista = [];
  if (eu.role === 'ALUNO') {
    let professorId = eu.professorId;
    if (!professorId) {
      const me = await apiFetch('/auth/me').catch(() => null);
      professorId = me?.professorId || null;
    }
    if (!professorId) {
      sel.innerHTML = '<option value="">Sem professor vinculado</option>';
      box.innerHTML = '<p class="text-zinc-500 text-sm">Aceite o convite do professor para conversar.</p>';
      return;
    }
    parceiroId = professorId;
    parceiroNome = 'Professor';
    sel.innerHTML = `<option value="${professorId}">Professor</option>`;
  } else {
    const alunos = await apiFetch('/alunos').catch(() => []);
    lista = Array.isArray(alunos) ? alunos : [];
    if (!lista.length) {
      sel.innerHTML = '<option value="">Nenhum aluno vinculado</option>';
      box.innerHTML = '<p class="text-zinc-500 text-sm">Convide um aluno para conversar.</p>';
      return;
    }
    sel.innerHTML = lista.map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');
    parceiroId = lista[0].id;
    parceiroNome = lista[0].nome;
  }
  render();
}

function ler() {
  if (!parceiroId) return [];
  try {
    return JSON.parse(localStorage.getItem(chaveChat(eu.id, parceiroId)) || '[]');
  } catch {
    return [];
  }
}

function render() {
  const msgs = ler();
  if (!msgs.length) { box.innerHTML = '<p class="text-zinc-500 text-sm">Nenhuma mensagem. Diga olá!</p>'; return; }
  box.innerHTML = msgs.map((m) => `
    <div class="flex ${m.de === eu.id ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.de === eu.id ? 'bg-emerald-600 text-white' : 'bg-zinc-800'}">
        <p>${esc(m.texto)}</p>
        <p class="text-[10px] opacity-60 mt-1">${new Date(m.ts).toLocaleString('pt-BR')}</p>
      </div>
    </div>`).join('');
  box.scrollTop = box.scrollHeight;
}

sel.addEventListener('change', () => {
  parceiroId = sel.value || null;
  parceiroNome = sel.selectedOptions[0]?.textContent || '';
  render();
});

document.getElementById('form-msg').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('texto');
  const texto = input.value.trim();
  if (!texto || !parceiroId) return;
  const msgs = ler();
  msgs.push({ de: eu.id, texto: texto.slice(0, 500), ts: Date.now() });
  localStorage.setItem(chaveChat(eu.id, parceiroId), JSON.stringify(msgs.slice(-200)));
  input.value = '';
  render();
});

window.addEventListener('storage', (e) => {
  if (parceiroId && e.key === chaveChat(eu.id, parceiroId)) render();
});
setInterval(render, 3000);

carregarParceiros();
