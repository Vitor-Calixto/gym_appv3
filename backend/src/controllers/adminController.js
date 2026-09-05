import { prisma } from '../config/prisma.js';

const DURACAO_PLANO_DIAS = { MENSAL: 30, TRIMESTRAL: 90, ANUAL: 365 };

function calcularPrazo(faturasPagas) {
  if (!faturasPagas || faturasPagas.length === 0) return { planoAtual: null, expiraEm: null, diasRestantes: 0, statusAssinatura: 'SEM_PLANO' };
  const ultima = faturasPagas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const dias = DURACAO_PLANO_DIAS[ultima.plano] || 30;
  const expira = new Date(new Date(ultima.createdAt).getTime() + dias * 86400000);
  const diasRestantes = Math.ceil((expira - new Date()) / 86400000);
  return {
    planoAtual: ultima.plano,
    expiraEm: expira,
    diasRestantes,
    statusAssinatura: diasRestantes < 0 ? 'VENCIDO' : diasRestantes <= 7 ? 'VENCE_EM_BREVE' : 'ATIVO',
    ultimaFaturaId: ultima.id,
  };
}

// GET /api/admin/usuarios?search=&role=ALUNO
export const listarTodosUsuarios = async (req, res) => {
  try {
    const { search = '', role } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true, nome: true, email: true, role: true, professorId: true,
        telefone: true, whatsapp: true, fotoUrl: true, faixa: true,
        createdAt: true, updatedAt: true,
        professor: { select: { id: true, nome: true, email: true } },
        faturas: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { treinos: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const enriquecidos = usuarios.map((u) => {
      const pagas = u.faturas.filter((f) => f.status === 'PAGO');
      return { ...u, senha: undefined, qtdTreinos: u._count.treinos, ...calcularPrazo(pagas) };
    });
    return res.json(enriquecidos);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};

// PUT /api/admin/usuarios/:id
export const atualizarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, role, professorId, telefone, whatsapp, faixa } = req.body;
    if (role && !['ADMIN', 'PROFESSOR', 'ALUNO'].includes(role)) return res.status(400).json({ error: 'Role inválida.' });
    // impede rebaixar o próprio admin sem querer
    if (id === req.user.id && role && role !== 'ADMIN') return res.status(400).json({ error: 'Você não pode rebaixar a si mesmo.' });
    const data = {};
    if (nome !== undefined) data.nome = nome;
    if (role !== undefined) data.role = role;
    if (professorId !== undefined) data.professorId = professorId || null;
    if (telefone !== undefined) data.telefone = telefone || null;
    if (whatsapp !== undefined) data.whatsapp = whatsapp || null;
    if (faixa !== undefined) data.faixa = faixa || null;
    const atualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, role: true, professorId: true },
    });
    return res.json(atualizado);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

// GET /api/admin/faturas?status=
export const listarTodasFaturas = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const faturas = await prisma.fatura.findMany({
      where,
      include: { aluno: { select: { id: true, nome: true, email: true, professorId: true, professor: { select: { nome: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json(faturas);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar faturas.' });
  }
};

// PUT /api/admin/faturas/:id {plano, valor, status}
export const atualizarFaturaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { plano, valor, status } = req.body;
    const data = {};
    if (plano !== undefined) data.plano = plano;
    if (valor !== undefined) data.valor = Number(valor);
    if (status !== undefined) data.status = status;
    const fatura = await prisma.fatura.update({ where: { id }, data });
    return res.json(fatura);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao atualizar fatura.' });
  }
};

// GET /api/admin/resumo
export const resumoAdmin = async (req, res) => {
  try {
    const [totalAlunos, totalProfessores, faturasPagas] = await Promise.all([
      prisma.usuario.count({ where: { role: 'ALUNO' } }),
      prisma.usuario.count({ where: { role: 'PROFESSOR' } }),
      prisma.fatura.findMany({ where: { status: 'PAGO' }, select: { valor: true, createdAt: true } }),
    ]);
    const receitaTotal = faturasPagas.reduce((a, f) => a + (f.valor || 0), 0);
    return res.json({ totalAlunos, totalProfessores, totalFaturasPagas: faturasPagas.length, receitaTotal });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no resumo.' });
  }
};
