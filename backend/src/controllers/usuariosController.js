import { prisma } from '../config/prisma.js';
import { criptografar } from '../config/crypto.js';

// GET /api/usuarios/me - nunca devolve token cru (Write-Only)
export const meCompleto = async (req, res) => {
  const u = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, nome: true, email: true, role: true, faixa: true, whatsapp: true, fotoUrl: true, mpAccessToken: true }
  });
  if (!u) return res.status(404).json({ error: 'Não encontrado.' });
  const temChave = !!u.mpAccessToken;
  // máscara: últimos 4 chars não dá pra mostrar sem descriptografar, então só flag
  return res.json({ ...u, mpAccessToken: undefined, temChaveMP: temChave });
};

// PUT /api/usuarios/config - professor/admin salva chave + faixa
export const salvarConfig = async (req, res) => {
  try {
    const { mpAccessToken, faixa, whatsapp, fotoUrl } = req.body;
    const data = {};
    if (typeof faixa === 'string') data.faixa = faixa || null;
    if (typeof whatsapp === 'string') data.whatsapp = whatsapp || null;
    if (typeof fotoUrl === 'string') data.fotoUrl = fotoUrl || null;
    if (typeof mpAccessToken === 'string' && mpAccessToken.trim() !== '') {
      data.mpAccessToken = criptografar(mpAccessToken.trim());
    }
    // se mpAccessToken vazio, não apaga - mantém anterior. Para apagar, usar DELETE /config/mp
    const atualizado = await prisma.usuario.update({ where: { id: req.user.id }, data });
    return res.json({ sucesso: true, temChaveMP: !!atualizado.mpAccessToken, faixa: atualizado.faixa });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar config.' });
  }
};

// DELETE /api/usuarios/config/mp - remove chave
export const removerChave = async (req, res) => {
  await prisma.usuario.update({ where: { id: req.user.id }, data: { mpAccessToken: null } });
  return res.json({ sucesso: true });
};
