import crypto from 'crypto';

export function getKey() {
  const raw = process.env.CRYPTO_KEY || '0123456789abcdef0123456789abcdef';
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32), 'utf-8');
}

export function criptografar(texto) {
  if (!texto) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  let enc = cipher.update(texto, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

// Aceita formato novo iv:tag:enc e legado (hex com IV zerado)
export function descriptografar(payload) {
  if (!payload) return null;
  try {
    if (payload.includes(':')) {
      const [ivHex, tagHex, enc] = payload.split(':');
      const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let dec = decipher.update(enc, 'hex', 'utf8');
      dec += decipher.final('utf8');
      return dec;
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.alloc(12, 0));
    let dec = decipher.update(payload, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch {
    return null;
  }
}
