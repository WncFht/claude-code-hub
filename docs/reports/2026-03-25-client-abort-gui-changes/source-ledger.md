# Source Ledger

| source_id | modality | title | author_or_org | url_or_path | published_at | accessed_at | credibility_class | research_role | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | code | legacy route redirect | claude-code-hub repo | `src/lib/console/legacy-route-redirect.ts` | repo current | 2026-03-25 | primary | 解释为什么 `/dashboard/*` 最终跳到 console 路由 | 与 `runtime-route-map.ts`、`logs/page.tsx`、`availability/page.tsx` 联合使用 |
| S2 | code | runtime route map | claude-code-hub repo | `src/lib/console/runtime-route-map.ts` | repo current | 2026-03-25 | primary | 定位日志页和 availability 页的真实 GUI 路由 | `traffic-logs` 对应 `/console/traffic/logs`，`overview-availability` 对应 `/console/overview/availability` |
| S3 | code | logs filter/query plumbing | claude-code-hub repo | `src/app/[locale]/dashboard/logs/_components/filters/status-filters.tsx` 等 | repo current | 2026-03-25 | primary | 解释日志页新增的筛选器、URL 参数、active chip | 搭配 `active-filters-display.tsx`、`usage-logs-view-virtualized.tsx`、`logs-query.ts` |
| S4 | code | logs row/detail rendering | claude-code-hub repo | `src/app/[locale]/dashboard/logs/_components/virtualized-logs-table.tsx`、`SummaryTab.tsx`、`types.ts` | repo current | 2026-03-25 | primary | 解释日志表格 badge 与详情抽屉“客户端中断分类”区块 | 同时依赖 `usage-logs.ts` 取回字段 |
| S5 | code | availability aggregation and overview UI | claude-code-hub repo | `src/lib/availability/availability-service.ts`、`src/app/[locale]/dashboard/availability/_components/overview/overview-section.tsx` | repo current | 2026-03-25 | primary | 解释 availability 页新增 counters 卡片及已有 KPI 的语义变化 | `client abort` 不再计入 provider failure |
| S6 | code | client abort data model | claude-code-hub repo | `src/drizzle/schema.ts`、`src/lib/client-abort-observability.ts` | repo current | 2026-03-25 | primary | 解释 GUI 背后的分类字段和计算规则 | 包含 continuation window 和 long-running threshold |
| S7 | code | admin backfill route | claude-code-hub repo | `src/app/api/admin/client-abort-observability/backfill/route.ts` | repo current | 2026-03-25 | primary | 解释历史数据如何补齐，为什么部署后界面能立刻有内容 | 需要 admin session |
| S8 | image | 日志页整体截图 | live CCH UI | `figures/logs-session-continued-page.png` | 2026-03-25 | 2026-03-25 | illustrative | 证明日志页筛选面板与 499 记录列表中的可见改动 | URL 见 `capture-metadata.json` |
| S9 | image | session continued 详情裁剪图 | live CCH UI | `figures/client-abort-section-session-continued.png` | 2026-03-25 | 2026-03-25 | illustrative | 证明详情抽屉展示 continuation request id 与时间 | 与 DB 样例 `27779 -> 27783` 对应 |
| S10 | image | after stream start 详情裁剪图 | live CCH UI | `figures/client-abort-section-after-stream.png` | 2026-03-25 | 2026-03-25 | illustrative | 证明详情抽屉可区分“已开始流式输出后中断” | 用于说明 streamStarted badge |
| S11 | image | availability overview 截图 | live CCH UI | `figures/availability-overview.png` | 2026-03-25 | 2026-03-25 | illustrative | 证明 overview 新增 client abort counters 卡片 | 同时展示 KPI 布局未大改但语义已变 |
| S12 | data | live deployment observations | local observation note | `live-observations.md` | 2026-03-25 | 2026-03-25 | primary | 记录 health、backfill 执行和当前数据库计数 | 用于支撑“界面为何已出现分类数据” |
| S13 | data | capture metadata | local capture artifact | `capture-metadata.json` | 2026-03-25 | 2026-03-25 | primary | 记录截图对应的 live URL 与用途 | 可回溯到具体 console 页面 |
| S14 | code | i18n strings | claude-code-hub repo | `messages/zh-CN/dashboard.json` 及其他 4 个 locale 文件 | repo current | 2026-03-25 | primary | 解释新 GUI 文案来自哪里 | 说明该改动不是仅中文可见 |
