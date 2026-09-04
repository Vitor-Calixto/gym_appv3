import { prisma } from '../config/prisma.js';

export const listarExercicios = async (req, res) => {
  try {
    const { grupo, grupoMuscular, equipamento, nivel } = req.query;
    const where = { ativo: true };
    const grupoFiltro = grupo || grupoMuscular;
    if (grupoFiltro) where.grupoMuscular = grupoFiltro;
    if (equipamento) where.equipamento = equipamento;
    if (nivel) where.nivel = nivel;

    const exercicios = await prisma.exercicio.findMany({ 
      where,
      orderBy: [{ grupoMuscular: 'asc' }, { nome: 'asc' }] 
    });
    return res.json({ sucesso: true, total: exercicios.length, exercicios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar exercícios.' });
  }
};

export const criarExercicio = async (req, res) => {
  try {
    const { nome, grupoMuscular, gifUrl, gifInicioUrl, gifFimUrl, descricao, equipamento, nivel, categoria } = req.body;
    if (!nome || !grupoMuscular) return res.status(400).json({ error: 'Nome e grupoMuscular obrigatórios.' });
    
    const novo = await prisma.exercicio.create({
      data: { 
        nome, grupoMuscular, 
        gifUrl: gifUrl || gifInicioUrl, 
        gifInicioUrl: gifInicioUrl || gifUrl, 
        gifFimUrl: gifFimUrl || gifUrl,
        descricao, equipamento, nivel, categoria: categoria || grupoMuscular
      },
    });
    return res.status(201).json(novo);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Exercício já existe.' });
    return res.status(500).json({ error: 'Erro ao cadastrar exercício.' });
  }
};

export const atualizarExercicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, grupoMuscular, gifUrl, gifInicioUrl, gifFimUrl, descricao, equipamento, nivel, categoria, ativo } = req.body;
    
    // Suporte a upload via multer - se enviou arquivo, usa o path
    let dados = { nome, grupoMuscular, descricao, equipamento, nivel, categoria, ativo };
    if (gifUrl !== undefined) dados.gifUrl = gifUrl;
    if (gifInicioUrl !== undefined) dados.gifInicioUrl = gifInicioUrl;
    if (gifFimUrl !== undefined) dados.gifFimUrl = gifFimUrl;
    // Arquivos via multer
    if (req.files?.gifInicio) dados.gifInicioUrl = `/uploads/${req.files.gifInicio[0].filename}`;
    if (req.files?.gifFim) dados.gifFimUrl = `/uploads/${req.files.gifFim[0].filename}`;
    if (req.file) dados.gifInicioUrl = `/uploads/${req.file.filename}`;

    // Remove undefined
    Object.keys(dados).forEach(k => dados[k] === undefined && delete dados[k]);

    const atualizado = await prisma.exercicio.update({ where: { id }, data: dados });
    return res.json(atualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar exercício.' });
  }
};

export const deletarExercicio = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete
    await prisma.exercicio.update({ where: { id }, data: { ativo: false } });
    return res.json({ sucesso: true, mensagem: 'Exercício desativado.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desativar.' });
  }
};
