/**
 * Jest 集成测试前置：从仓库根 `prisma/.env` 与 `.env` 加载环境变量。
 */
import { config } from 'dotenv';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../../..');
config({ path: path.join(repoRoot, 'prisma', '.env'), quiet: true });
config({ path: path.join(repoRoot, '.env'), quiet: true });
