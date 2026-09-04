export const salvarSessao = (token, usuario) => {
  localStorage.setItem('omni_token', token);
  localStorage.setItem('omni_user', JSON.stringify(usuario));
};

export const obterUsuario = () => {
  const user = localStorage.getItem('omni_user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('omni_token');
  localStorage.removeItem('omni_user');
  window.location.href = '../index/index.html';
};
