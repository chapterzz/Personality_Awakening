import { config } from 'dotenv';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../../..');
config({ path: path.join(repoRoot, 'prisma', '.env'), quiet: true });
config({ path: path.join(repoRoot, '.env'), quiet: true });
