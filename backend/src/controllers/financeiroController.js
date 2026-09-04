import { prisma } from '../config/prisma.js';

const PLANOS = { MENSAL: 120, TRIMESTRAL: 300, ANUAL: 1000 };

export const listarFaturas = async (req, res) => {
  try {
    const alunoId = req.query.alunoId || req.user.id;
    // Aluno só vê suas, professor/admin vê de seus alunos
    if (alunoId !== req.user.id && req.user.role === 'ALUNO') return res.status(403).json({ error: 'Acesso negado.' });
    const faturas = await prisma.fatura.findMany({ where: { alunoId }, orderBy: { createdAt: 'desc' } });
    // Se não tem fatura, gera mock para demo
    if (faturas.length === 0) {
      const mock = [
        { id: 'mock1', alunoId, valor: 120, plano: 'MENSAL', status: 'PAGO', createdAt: new Date('2026-10-10') },
        { id: 'mock2', alunoId, valor: 120, plano: 'MENSAL', status: 'PAGO', createdAt: new Date('2026-11-10') },
        { id: 'mock3', alunoId, valor: 120, plano: 'MENSAL', status: 'PENDENTE', createdAt: new Date('2026-12-10') },
      ];
      return res.json(mock);
    }
    return res.json(faturas);
  } catch (e) { return res.status(500).json({ error: 'Erro ao listar faturas.' }); }
};

export const criarCheckout = async (req, res) => {
  try {
    const { plano, alunoId } = req.body;
    const alvoId = alunoId || req.user.id;
    const valor = PLANOS[plano] || PLANOS.MENSAL;
    // 100% backend-driven: consulta preço oficial, não confia no frontend (Cap.3.3)
    const fatura = await prisma.fatura.create({ data: { alunoId: alvoId, valor, plano: plano || 'MENSAL', status: 'PENDENTE' } });
    // Em produção: gerar preferência Mercado Pago com MP_ACCESS_TOKEN
    // Aqui retorna fatura + link mock
    const linkMock = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${fatura.id}`;
    return res.json({ fatura, checkoutUrl: linkMock });
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Erro ao criar checkout.' }); }
};

export const webhookMercadoPago = async (req, res) => {
  try {
    const { id, status, mercadoPagoId } = req.body;
    // Valida assinatura em produção
    if (id) {
      await prisma.fatura.update({ where: { id }, data: { status: status || 'PAGO', mercadoPagoId: mercadoPagoId || null } });
    }
    return res.json({ recebido: true });
  } catch (e) { return res.status(500).json({ error: 'Erro webhook.' }); }
};

export const atualizarFatura = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const fatura = await prisma.fatura.update({ where: { id }, data: { status } });
    return res.json(fatura);
  } catch (e) { return res.status(500).json({ error: 'Erro ao atualizar.' }); }
};
