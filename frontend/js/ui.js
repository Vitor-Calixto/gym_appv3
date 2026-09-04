// ui.js - Modal nativo para substituir alert/prompt/confirm
export function showModal({ titulo = 'Aviso', mensagem = '', tipo = 'info', textoBotao = 'OK', onConfirm = null }) {
  let el = document.getElementById('ui-modal');
  if (el) el.remove();
  const cor = tipo === 'erro' ? 'border-red-500/30' : tipo === 'sucesso' ? 'border-emerald-500/30' : 'border-zinc-800';
  const btnCor = tipo === 'erro' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500';
  el = document.createElement('div');
  el.id = 'ui-modal';
  el.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';
  el.innerHTML = `
    <div class="bg-zinc-900 border ${cor} w-full max-w-sm rounded-2xl p-5 shadow-2xl">
      <h3 class="font-bold text-white">${titulo}</h3>
      <p class="text-sm text-zinc-400 mt-2 leading-relaxed">${mensagem}</p>
      <button id="ui-modal-ok" class="w-full mt-4 ${btnCor} text-white font-bold py-2.5 rounded-xl text-sm">${textoBotao}</button>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('ui-modal-ok').onclick = () => { el.remove(); if (onConfirm) onConfirm(); };
  el.onclick = (e) => { if (e.target === el) el.remove(); };
}

export function showPrompt({ titulo, placeholder = '', valor = '', onConfirm }) {
  let el = document.getElementById('ui-modal');
  if (el) el.remove();
  el = document.createElement('div');
  el.id = 'ui-modal';
  el.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';
  el.innerHTML = `
    <div class="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl">
      <h3 class="font-bold text-white">${titulo}</h3>
      <input id="ui-prompt-input" placeholder="${placeholder}" value="${valor}" class="w-full mt-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
      <div class="flex gap-2 mt-4">
        <button id="ui-prompt-cancel" class="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-xl text-sm">Cancelar</button>
        <button id="ui-prompt-ok" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm">OK</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('ui-prompt-cancel').onclick = () => el.remove();
  document.getElementById('ui-prompt-ok').onclick = () => { const v = document.getElementById('ui-prompt-input').value; el.remove(); if (onConfirm) onConfirm(v); };
  setTimeout(()=>document.getElementById('ui-prompt-input')?.focus(), 50);
}
