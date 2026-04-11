/**
 * pnpm prepare：仅在已存在 Git 仓库时安装 Husky 钩子，避免无 .git 时刷屏报错。
 */
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

if (!existsSync(path.join(root, '.git'))) {
  console.warn(
    '[prepare] 跳过 Husky：未检测到 .git。请在仓库根目录执行 `git init` 后重新运行 `pnpm install`。',
  );
  process.exit(0);
}

try {
  execSync('pnpm exec husky', { stdio: 'inherit', cwd: root, shell: true });
} catch {
  process.exit(1);
}
