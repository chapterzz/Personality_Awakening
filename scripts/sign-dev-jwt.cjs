/**
 * 本地联调：签发与 apps/api JwtUserModule 一致的 HS256 JWT（载荷 sub + role）。
 * 用法（在仓库根目录）：
 *   node scripts/sign-dev-jwt.cjs <user-uuid>
 * 可选环境变量 JWT_SECRET（与 API 进程一致；未设置则用代码内开发默认密钥）。
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  const root = path.resolve(__dirname, '..');
  for (const rel of ['.env', path.join('prisma', '.env')]) {
    const p = path.join(root, rel);
    try {
      const raw = fs.readFileSync(p, 'utf8');
      const m = raw.match(/^\s*JWT_SECRET\s*=\s*("?)([^"\n]+)\1\s*$/m);
      if (m) {
        return m[2].trim();
      }
    } catch {
      /* ignore */
    }
  }
  return 'ppa-dev-jwt-secret-change-in-production';
}

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

function signHs256(secret, payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const sub = process.argv[2]?.trim();
if (!sub) {
  console.error('用法: node scripts/sign-dev-jwt.cjs <user-uuid>');
  process.exit(1);
}

const secret = loadJwtSecret();
const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
const token = signHs256(secret, { sub, role: 'STUDENT', exp });
console.log(token);
