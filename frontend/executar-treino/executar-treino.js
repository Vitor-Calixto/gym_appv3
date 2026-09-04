// executar-treino - estilo circuito PRINCIPAL + cronômetro + gifs duplos
import { apiFetch } from '../js/storage.js';
import { obterUsuario } from '../js/auth.js';
import { showModal } from '../js/ui.js';
if (!obterUsuario()) window.location.href = '../index/index.html';

const treinoId = new URLSearchParams(location.search).get('id');
let treinoAtual = null, intervaloTimer, globalTimer, globalSegundos = 0, globalRodando = false;
let vozAtiva = localStorage.getItem('omni_voz') !== 'off';
const STORAGE_KEY = 'omni_offline_logs';

function falar(t){ if(!vozAtiva||!('speechSynthesis' in window))return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='pt-BR'; speechSynthesis.speak(u); }
document.getElementById('toggle-voz')?.addEventListener('click', ()=>{ vozAtiva=!vozAtiva; localStorage.setItem('omni_voz', vozAtiva?'on':'off'); document.getElementById('toggle-voz').textContent=vozAtiva?'🔊 Voz: ON':'🔇 Voz: OFF'; if(vozAtiva) falar('Voz ativada'); });

// Modal inicio
document.getElementById('btn-sim').onclick = ()=>{ document.getElementById('modal-inicio').classList.add('hidden'); iniciarGlobal(); falar('Vamos começar!'); };
document.getElementById('btn-nao').onclick = ()=> window.location.href='../home/home.html';

function iniciarGlobal(){
  if(globalRodando) return; globalRodando=true;
  document.getElementById('cronometro-global').classList.remove('hidden');
  globalTimer=setInterval(()=>{ globalSegundos+=0.01; const m=String(Math.floor(globalSegundos/60)).padStart(2,'0'); const s=(globalSegundos%60).toFixed(2).padStart(5,'0'); document.getElementById('tempo-global').textContent=`${m}:${s}`; },10);
}
document.getElementById('btn-pause')?.addEventListener('click', ()=>{ globalRodando=!globalRodando; if(!globalRodando) clearInterval(globalTimer); else iniciarGlobal(); });
document.getElementById('btn-stop')?.addEventListener('click', ()=>{ clearInterval(globalTimer); globalRodando=false; document.getElementById('tempo-global').textContent='00:00.00'; });
document.getElementById('btn-intervalo')?.addEventListener('click', ()=>{ falar('Intervalo de descanso'); iniciarDescansoGlobal(60); });
function iniciarDescansoGlobal(s){ let r=s; const d=document.getElementById('cronometro'); clearInterval(intervaloTimer); intervaloTimer=setInterval(()=>{ const m=String(Math.floor(r/60)).padStart(2,'0'); const sec=String(r%60).padStart(2,'0'); d.textContent=`${m}:${sec}`; if(r<=0){clearInterval(intervaloTimer); d.textContent='00:00'; falar('Descanso finalizado');} r--; },1000); }

async function carregarTreino(){
  const container=document.getElementById('lista-exercicios');
  let treino=null;
  try{ treino=await apiFetch(`/treinos/${treinoId}`); if(treino&&treino.id) treinoAtual=treino; }catch(e){}
  if(!treinoAtual){
    const treinos=await apiFetch('/treinos/aluno').catch(()=>null);
    if(treinos) treinoAtual=treinos.find(t=>t.id===treinoId);
  }
  if(!treinoAtual){
    document.getElementById('treino-titulo').textContent='Treino não encontrado';
    container.innerHTML='<p class="text-red-400 bg-red-500/10 p-4 rounded-xl text-sm">Não foi possível carregar a ficha.</p>'; return;
  }
  document.getElementById('treino-titulo').textContent=treinoAtual.nome;
  container.innerHTML=treinoAtual.itens.map((it,i)=>`
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div class="text-center text-xs tracking-widest text-zinc-400 pt-2">PRINCIPAL</div>
      <div class="flex gap-3 p-3">
        <div class="w-28 h-28 bg-black rounded-xl overflow-hidden flex-shrink-0 relative">
          <img src="${it.exercicio.gifInicioUrl||it.exercicio.gifUrl||''}" class="w-full h-full object-cover" onerror="this.style.display='none'">
          <img src="${it.exercicio.gifFimUrl||''}" class="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition" onerror="this.style.display='none'">
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-sm">${it.exercicio.nome}</h3>
          <p class="text-xs text-zinc-400">Repetições ${it.repeticoes} • ${it.series} séries</p>
          <div class="flex gap-4 mt-2 text-xs">
            <span>⏱ ${it.descansoSeg}''</span>
            <span>🔥 ${Math.round(it.repeticoes*2)} kcal</span>
            <button onclick="this.closest('.bg-zinc-900').querySelector('.detalhes').classList.toggle('hidden')" class="ml-auto text-zinc-500">▾</button>
          </div>
        </div>
      </div>
      <div class="detalhes hidden border-t border-zinc-800 p-3 space-y-2">
        <div class="bg-black rounded-xl overflow-hidden h-48 flex items-center justify-center relative">
          <img src="${it.exercicio.gifInicioUrl||''}" class="w-full h-full object-contain">
          <button class="absolute w-16 h-16 bg-white/80 rounded-full flex items-center justify-center text-2xl">▶</button>
        </div>
        <p class="text-xs">Nº de séries: ${it.series}<br>Nº de repetições: ${it.repeticoes}<br>Cadência: Normal</p>
        <input placeholder="Carga utilizada" class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm">
        <div class="flex gap-2">
          ${Array.from({length: it.series}).map((_,s)=>`<button onclick="window.iniciarDescanso(${it.descansoSeg},this,'${it.exercicio.nome}')" class="flex-1 bg-zinc-800 hover:bg-emerald-600 py-2 rounded-lg text-xs font-bold">Série ${s+1}</button>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

window.iniciarDescanso=(seg,btn,nome)=>{
  btn.classList.add('bg-emerald-500','text-zinc-950'); btn.textContent='Concluída'; btn.disabled=true;
  falar(`Série concluída. Descanse ${seg} segundos`);
  let r=seg; const d=document.getElementById('cronometro'); clearInterval(intervaloTimer); intervaloTimer=setInterval(()=>{ const m=String(Math.floor(r/60)).padStart(2,'0'); const s=String(r%60).padStart(2,'0'); d.textContent=`${m}:${s}`; if(r<=0){clearInterval(intervaloTimer); d.textContent='00:00'; falar('Próxima série');} r--;},1000);
};

carregarTreino();
