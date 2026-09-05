// frontend/configuracoes/configuracoes.js
import { apiFetch } from '../js/storage.js';
import { showModal } from '../js/ui.js';
document.getElementById('form-mp')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const mpAccessToken=document.getElementById('mp-token').value;
  const faixa=document.getElementById('faixa').value;
  const res=await apiFetch('/usuarios/config',{method:'PUT',body:JSON.stringify({mpAccessToken,faixa})});
  showModal({titulo:'Salvo',mensagem:'Configurações salvas!',tipo:'sucesso'});
});