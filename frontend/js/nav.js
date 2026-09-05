// frontend/js/nav.js
import { obterUsuario } from './auth.js';
export function renderNav(ativo='Dashboard'){
  const u=obterUsuario(); if(!u) return;
  const links=[
    ['Dashboard','../home/home.html'],
    ['Meus Treinos','../meus-treinos/meus-treinos.html'],
    ['Montar','../montar-treino/montar-treino.html','prof'],
    ['Alunos','../gerenciar-alunos/gerenciar-alunos.html','prof'],
    ['Anamnese','../anamnese/anamnese.html'],
    ['Agenda','../agenda/agenda.html'],
    ['Financeiro','../financeiro/financeiro.html'],
    ['Lutas','../portal-lutas/portal-lutas.html'],
    ['Config','../configuracoes/configuracoes.html'],
  ];
  const nav=document.createElement('nav');
  nav.className='nav-calixto';
  nav.innerHTML=`<div class="nav-inner"><a href="../home/home.html" class="logo">CALIXTO<span>OMNI</span></a><div class="links">${links.filter(([t,h,p])=>!p||u.role!=='ALUNO').map(([t,h])=>`<a href="${h}" class="${t===ativo?'ativo':''}">${t}</a>`).join('')}</div><div class="user"><span>Olá, ${u.nome}</span><button id="nav-sair">Sair</button></div></div>`;
  document.body.prepend(nav);
  document.getElementById('nav-sair').onclick=()=>{localStorage.clear(); location.href='../index/index.html';};
}