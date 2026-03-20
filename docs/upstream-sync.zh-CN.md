# 上游同步维护指南

这份文档用于维护当前 fork 仓库与原始仓库 `ding113/claude-code-hub` 的同步关系。

## 当前约定

- `origin`：你的 fork，例如 `git@github.com:WncFht/claude-code-hub.git`
- `upstream`：原始仓库，例如 `git@github.com:ding113/claude-code-hub.git`
- `main`：你的实际开发/部署主分支
- `sync/upstream-*`：每次接上游更新时临时创建的同步分支

## 一次性初始化

如果仓库还没有配置 `upstream`，执行：

```bash
pnpm run sync:upstream:setup
```

脚本会：

- 检查 `upstream` remote 是否存在
- 不存在时自动添加
- 存在但 URL 不一致时直接报错，避免误同步到错误仓库
- 自动执行一次 `git fetch upstream --tags`

## 平时查看同步状态

执行：

```bash
pnpm run sync:upstream:status
```

它会显示：

- 当前所在分支
- `origin` 和 `upstream` 的 remote URL
- 本地 `main` 相对 `origin/main` 的 ahead/behind
- 本地 `main` 相对 `upstream/main` 的 ahead/behind

## 推荐同步流程

执行：

```bash
pnpm run sync:upstream
```

默认流程：

1. 要求当前工作区干净
2. 自动 `fetch origin --tags`
3. 自动 `fetch upstream --tags`
4. 从本地 `main` 创建一个新分支，例如 `sync/upstream-20260320-201530`
5. 先尝试 merge `origin/main`
6. 再尝试 merge `upstream/main`

这样做的原因：

- 你的 fork 远端可能已经在别的机器上推进过
- 上游也可能已经有新提交
- 先把 `origin/main` 接进来，再接 `upstream/main`，冲突来源更清晰

## 指定同步分支名

如果你想自己命名同步分支：

```bash
bash scripts/sync-upstream.sh sync sync/upstream-v0.6.7
```

## 遇到冲突怎么办

脚本不会帮你自动乱改冲突，它会停在当前同步分支上。

处理方式：

```bash
git status
git add <resolved-files>
git commit
```

然后手动继续验证：

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm test
```

验证通过后，再合并回 `main`：

```bash
git switch main
git merge --no-ff <your-sync-branch>
git push origin main
```

## 什么时候不应该直接同步

以下情况不要直接跑 `sync`：

- 当前工作区还有未提交修改
- 你还在一个未完成的功能分支上
- 本地 `main` 不是你想作为同步基线的分支

这种情况下，先把当前工作收尾，再同步。

## 脚本入口

- `pnpm run sync:upstream:setup`
- `pnpm run sync:upstream:status`
- `pnpm run sync:upstream`

也可以直接运行：

```bash
bash scripts/sync-upstream.sh --help
```
