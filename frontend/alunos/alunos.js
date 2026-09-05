// Lógica da tela alunos (perfil do aluno para o professor)
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';

const eu = obterUsuario();
if (!eu) location.href = '../index/index.html';
const id = new URLSearchParams(location.search).get('id');
if (!id) location.href = '../gerenciar-alunos/gerenciar-alunos.html';

const podeEditar = eu.role === 'ADMIN' || eu.role === 'PROFESSOR';
if (podeEditar) document.getElementById('edicao')?.classList.remove('hidden');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function carregar() {
  try {
    const aluno = await apiFetch(`/alunos/${id}`);
    document.getElementById('perfil').innerHTML = `
      <div class="flex gap-4">
        <img src="${esc(aluno.fotoUrl) || 'https://placehold.co/100x100'}" class="w-20 h-20 rounded-xl object-cover border border-zinc-800">
        <div class="min-w-0">
          <h1 class="font-bold text-lg truncate">${esc(aluno.nome)}</h1>
          <p class="text-sm text-zinc-400 truncate">${esc(aluno.email)} • ${esc(aluno.whatsapp || 'sem whatsapp')}</p>
          <p class="text-xs text-zinc-500">${aluno.treinos?.length || 0} treinos • Anamnese: ${aluno.anamnese ? 'OK' : 'pendente'}</p>
        </div>
      </div>`;
    if (podeEditar && aluno.whatsapp) {
      const w = document.getElementById('whatsapp');
      if (w && !w.value) w.value = aluno.whatsapp;
    }
    const zap = (aluno.whatsapp || '').replace(/\D/g, '');
    window.__fichas = Object.fromEntries((aluno.treinos || []).map((t) => [t.id, t]));
    window.__alunoNome = aluno.nome;
    window.__alunoZap = aluno.whatsapp || '';
    document.getElementById('treinos').innerHTML = (aluno.treinos || []).map((t) => {
      const texto = `*${t.nome}* - Prof. ${eu.nome}\n` + t.itens.map((it, i) => `${i + 1}. ${it.exercicio.nome} - ${it.series}x${it.repeticoes} (${it.descansoSeg}s pausa)`).join('\n');
      const execUrl = `${location.origin}/executar-treino/executar-treino.html?id=${t.id}`;
      const textoLink = `Seu treino *${t.nome}* já está no app, ${aluno.nome.split(' ')[0]}! Abra aqui: ${execUrl}`;
      const zapBtns = zap
        ? `<a href="https://wa.me/${zap}?text=${encodeURIComponent(texto)}" target="_blank" class="text-xs bg-emerald-600 text-white px-2 py-1 rounded">WhatsApp</a><a href="https://wa.me/${zap}?text=${encodeURIComponent(textoLink)}" target="_blank" class="text-xs bg-emerald-800 text-white px-2 py-1 rounded">Link do app</a>`
        : `<span class="text-xs text-zinc-600">Sem WhatsApp</span>`;
      return `<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><h3 class="font-bold text-emerald-400">${esc(t.nome)}</h3><p class="text-xs text-zinc-500">${t.itens.length} exercícios</p><div class="flex gap-2 mt-2 flex-wrap"><a href="../executar-treino/executar-treino.html?id=${t.id}" class="text-xs text-emerald-400">Ver</a>${zapBtns}<button onclick="exportarPDF('${t.id}')" class="text-xs bg-zinc-700 px-2 py-1 rounded">PDF</button><button onclick="enviarPDF('${t.id}')" class="text-xs bg-emerald-700 px-2 py-1 rounded">Enviar PDF</button><button onclick="exportarExcel('${t.id}')" class="text-xs bg-zinc-700 px-2 py-1 rounded">Excel</button></div></div>`;
    }).join('');

window.enviarPDF = async (id) => {
  const t = window.__fichas[id];
  if (!t || !window.jspdf) { exportarPDF(id); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(t.nome, 14, 18);
  doc.setFontSize(11);
  doc.text(`Aluno: ${window.__alunoNome} - Prof: ${eu.nome} - ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  let y = 36;
  doc.setFontSize(10);
  t.itens.forEach((it, i) => {
    if (y > 280) { doc.addPage(); y = 18; }
    doc.text(`${i + 1}. ${it.exercicio.nome} - ${it.series}x${it.repeticoes} (${it.descansoSeg}s)`, 14, y);
    y += 7;
  });
  const file = new File([doc.output('blob')], `treino-${t.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: t.nome }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  exportarPDF(id);
};

function zapLink(t) {
  const zap = (window.__alunoZap || '').replace(/\D/g, '');
  if (!zap) return null;
  const texto = `*${t.nome}* - Prof. ${eu.nome}\nSegue a ficha em anexo.`;
  return `https://wa.me/${zap}?text=${encodeURIComponent(texto)}`;
}

function modalEnviar(t, arquivo) {
  const link = zapLink(t);
  showModal({
    titulo: `${arquivo} pronto!`,
    mensagem: link
      ? `O download começou. Toque abaixo para abrir a conversa e anexar o arquivo.<br><br><a href="${link}" target="_blank" style="display:block;text-align:center;background:#16a34a;color:#fff;font-weight:bold;padding:10px;border-radius:10px;">Abrir WhatsApp do aluno</a>`
      : `O download começou. Cadastre o WhatsApp do aluno para abrir a conversa direto.`,
    tipo: 'sucesso'
  });
}

window.exportarExcel = (id) => {
  const t = window.__fichas[id];
  if (!t) return;
  const linhas = ['Exercício;Séries;Repetições;Descanso (s);Observações'];
  t.itens.forEach((it) => linhas.push([it.exercicio.nome, it.series, it.repeticoes, it.descansoSeg, it.observacoes || ''].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')));
  const blob = new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `treino-${t.nome.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  modalEnviar(t, 'Excel');
};

window.exportarPDF = (id) => {
  const t = window.__fichas[id];
  if (!t) return;
  const zapNum = (window.__alunoZap || '').replace(/\D/g, '');
  if (zapNum) window.__alunoZap = zapNum;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>${esc(t.nome)}</title><style>body{font-family:Arial;margin:24px;color:#111}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;font-size:13px;text-align:left}th{background:#eee}</style></head><body>
    <h1>${esc(t.nome)}</h1><p>Aluno: ${esc(window.__alunoNome)} • Prof: ${esc(eu.nome)} • ${new Date().toLocaleDateString('pt-BR')}</p>
    <table><tr><th>#</th><th>Exercício</th><th>Séries</th><th>Reps</th><th>Descanso</th></tr>
    ${t.itens.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.exercicio.nome)}</td><td>${it.series}</td><td>${esc(it.repeticoes)}</td><td>${it.descansoSeg}s</td></tr>`).join('')}
    </table><script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
  modalEnviar(t, 'PDF');
};
  } catch (e) {
    document.getElementById('perfil').innerHTML = `<p class="text-red-400 text-sm">Erro: ${esc(e.message)}</p>`;
  }
}

document.getElementById('btn-whatsapp')?.addEventListener('click', async () => {
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const res = await apiFetch(`/usuarios/${id}/whatsapp`, { method: 'PUT', body: JSON.stringify({ whatsapp }) }).catch((e) => ({ error: e.message }));
  showModal(res?.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Salvo', mensagem: 'WhatsApp atualizado.', tipo: 'sucesso' });
  carregar();
});

document.getElementById('form-foto')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('foto').files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('foto', file);
  const token = localStorage.getItem('omni_token');
  const res = await fetch(`http://localhost:3001/api/usuarios/foto?alunoId=${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }).then((r) => r.json()).catch((err) => ({ error: err.message }));
  showModal(res?.error ? { titulo: 'Erro', mensagem: res.error, tipo: 'erro' } : { titulo: 'Foto atualizada', mensagem: 'Foto do aluno atualizada.', tipo: 'sucesso' });
  carregar();
});

carregar();
