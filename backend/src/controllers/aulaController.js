// backend/src/controllers/aulaController.js
import { prisma } from '../config/prisma.js';
import crypto from 'crypto';
function criptografar(t){ const a=crypto.createCipheriv('aes-256-gcm', Buffer.from(process.env.CRYPTO_KEY||'0123456789abcdef0123456789abcdef','utf-8'), Buffer.alloc(12,0)); let e=a.update(t,'utf8','hex'); e+=a.final('hex'); return e; }
export const criarAula=async(req,res)=>{ const {titulo,embedUrl,preco,categoria,faixaMinima}=req.body; const aula=await prisma.aulaGravada.create({data:{titulo,embedUrl,preco:parseFloat(preco),categoria,faixaMinima,professorId:req.user.id}}); res.status(201).json(aula); };
export const listarAulas=async(req,res)=>{ const aulas=await prisma.aulaGravada.findMany({orderBy:{createdAt:'desc'}}); res.json(aulas); };
export const comprarAula=async(req,res)=>{
  const aula=await prisma.aulaGravada.findUnique({where:{id:req.params.id},include:{professor:true}});
  const professorToken=aula.professor.mpAccessToken ? crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.CRYPTO_KEY||'0123456789abcdef0123456789abcdef','utf-8'), Buffer.alloc(12,0)).update(aula.professor.mpAccessToken,'hex','utf8') : process.env.MP_ACCESS_TOKEN;
  // Gera PIX mock - em prod chama Mercado Pago com professorToken
  const acesso=await prisma.acessoAula.create({data:{alunoId:req.user.id,aulaId:aula.id,status:'PENDENTE'}});
  return res.json({qrCode: Buffer.from('PIX'+acesso.id).toString('base64'), copiaCola: '000201...'+acesso.id, acesso});
};