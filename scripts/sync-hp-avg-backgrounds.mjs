/**
 * 将 docs/avg-scripts/hp-chamber-of-secrets-48.json 的 nodesJson 同步到数据库。
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { validateAvgNodesJson } from '../apps/api/dist/avg-script/avg-script-validation.js';

const SCRIPT_ID = 'hp-chamber-of-secrets-48';
const jsonPath = new URL('../docs/avg-scripts/hp-chamber-of-secrets-48.json', import.meta.url);
const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const nodesJson = {
  start_node_id: j.start_node_id,
  backgrounds: j.backgrounds,
  nodes: j.nodes,
};
validateAvgNodesJson(nodesJson);

const prisma = new PrismaClient();
const row = await prisma.avgScript.update({
  where: { id: SCRIPT_ID },
  data: { nodesJson, title: j.title },
});
console.log('synced', row.id, 'published=', row.isPublished);
await prisma.$disconnect();
