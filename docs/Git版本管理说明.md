# Git 版本管理说明（性格星球 Monorepo）

## 1. 安装 Git（若尚未安装）

- Windows：安装 [Git for Windows](https://git-scm.com/download/win)，安装时勾选 **「Add Git to PATH」**，以便在 PowerShell / Cursor 终端使用 `git`。
- 安装后新开终端，执行 `git --version` 确认可用。

## 2. 在本仓库初始化并做首次提交

在仓库根目录 `Personality_Awakening` 执行：

```powershell
cd d:\zhangjie\tech\projects\Personality_Awakening
git init
git add -A
git status
```

首次提交前建议配置身份（全局或仅本仓库）：

```powershell
git config user.name "你的名字或昵称"
git config user.email "你的邮箱@example.com"
```

提交：

```powershell
git commit -m "chore: initial commit — monorepo scaffold (web + api)"
```

然后重新安装依赖，让 **Husky** 在已有 `.git` 的情况下安装钩子：

```powershell
pnpm install
```

之后每次 `git commit`，`.husky/pre-commit` 会运行 **lint-staged**（当前主要为 Prettier）。

## 3. 推荐分支习惯（MVP）

| 分支     | 用途                   |
| :------- | :--------------------- |
| `main`   | 可集成、可演示的稳定线 |
| `feat/*` | 功能开发               |
| `fix/*`  | 缺陷修复               |

示例：

```powershell
git checkout -b feat/t1-2-prisma-schema
# …开发…
git add -A
git commit -m "feat(db): add prisma schema and migration"
```

## 4. 关联远程仓库（可选）

在 GitHub / GitLab 等平台新建空仓库后：

```powershell
git remote add origin https://github.com/<org>/<repo>.git
git branch -M main
git push -u origin main
```

## 5. 与本项目相关的约定文件

| 文件                        | 作用                                                    |
| :-------------------------- | :------------------------------------------------------ |
| `.gitignore`                | 忽略 `node_modules`、`.next`、`dist`、`.env` 等         |
| `.gitattributes`            | 统一文本换行，减少无意义 diff                           |
| `.husky/pre-commit`         | 提交前自动格式化（需先 `git init` + `pnpm install`）    |
| `scripts/prepare-husky.cjs` | `pnpm install` 时仅在存在 `.git` 时安装 Husky，避免误报 |

## 6. 常见问题

**Q：`pnpm install` 仍提示与 Husky 有关？**  
A：确认已在**本仓库根目录**执行过 `git init`，且当前目录下存在 `.git` 文件夹，然后再执行 `pnpm install`。

**Q：提交时 Prettier 改了很多文件？**  
A：属正常情况；可先 `pnpm format` 再提交，减少一次 commit 内改动面。
