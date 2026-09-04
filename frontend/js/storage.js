const API_URL = 'http://localhost:3001/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('omni_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('omni_token');
    localStorage.removeItem('omni_user');
    window.location.href = '../index/index.html';
    return;
  }

  return response.json();
};
