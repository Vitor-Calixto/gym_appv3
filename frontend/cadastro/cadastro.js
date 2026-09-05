// frontend/cadastro/cadastro.js
// Cadastro com afiliação automática via link de convite ?convite=TOKEN
import { apiFetch } from '../js/storage.js';
import { salvarSessao } from '../js/auth.js';

// 1. Se veio de um link de convite do professor (ex: cadastro.html?convite=abc123), guarda o token
const tokenConvite = new URLSearchParams(location.search).get('convite');
if (tokenConvite) {
  localStorage.setItem('convite_token', tokenConvite);
  console.log('[Convite] token salvo:', tokenConvite);
}

document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const role = document.getElementById('role').value;
  const erroDiv = document.getElementById('erro');
  const btn = document.getElementById('btn-cadastrar');

  erroDiv.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  try {
    // 2. Cria a conta (backend já bloqueia role ADMIN se não for ADMIN)
    const res = await apiFetch('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, role })
    });

    if (res && res.token) {
      // 3. Salva sessão (localStorage + JWT)
      salvarSessao(res.token, res.usuario);

      // 4. Se tinha convite, afilia automaticamente ao professor que gerou o link
      const t = localStorage.getItem('convite_token');
      if (t) {
        try {
          await apiFetch(`/convites/aceitar/${t}`, { method: 'POST' });
          console.log('[Convite] aceito com sucesso');
        } catch (err) {
          console.warn('[Convite] falha ao aceitar:', err.message);
        }
        localStorage.removeItem('convite_token');
      }

      // 5. Vai para a home (aluno já afiliado)
      window.location.href = '../home/home.html';
    } else if (res && res.error) {
      erroDiv.textContent = res.error;
      erroDiv.classList.remove('hidden');
    } else {
      erroDiv.textContent = 'Erro inesperado ao cadastrar.';
      erroDiv.classList.remove('hidden');
    }
  } catch (err) {
    erroDiv.textContent = 'Falha de conexão com o servidor.';
    erroDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar';
  }
});