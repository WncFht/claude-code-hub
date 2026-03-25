# CLIENT_ABORTED 可观测性说明

## 背景

在 CCH 的流式代理里，`499 CLIENT_ABORTED` 表示本地客户端已经断开连接，Hub 在内部结算时把这条请求记为客户端中断。

这类请求里有不少其实已经拿到首包，甚至已经产出了一部分 token。过去如果只看原始 `499`，很容易把它们误读成：

- 供应商异常
- 代理中途打断
- 真实的零输出失败

这次改动的目标不是改写原始状态码，而是给本地 `499 CLIENT_ABORTED` 增加一层派生归因，让日志页和 availability 页能更准确地区分：

- 正常的客户端取消/切换/续跑
- 已经开始流式输出后才断开
- 还没开始流式输出就断开

## 新增字段

`message_request` 新增以下字段：

- `client_abort_outcome`
- `client_abort_long_running`
- `client_abort_continued_by_request_id`
- `client_abort_continued_at`

其中 `client_abort_outcome` 目前有三类：

- `session_continued`
  - 同一 `session_id` 下，后续请求在 continuation window 内接上，说明更像是“收掉旧流后继续当前会话”。
- `after_stream_start`
  - 本地 `499` 发生时，已经拿到 `ttfb`、输出 token 或 cost，说明流已经开始。
- `before_stream_start`
  - 本地 `499` 发生时，还没有任何流启动证据，更像首包前断开。

另外：

- `client_abort_long_running = true`
  - 表示这条本地 `499` 已经运行较长时间后才断开，默认阈值是 `60s`。

## 运行时行为

### 1. 本地 `499 CLIENT_ABORTED` 落库时

CCH 会先写入一个“临时结论”：

- 已开始流式输出 -> `after_stream_start`
- 未开始流式输出 -> `before_stream_start`

原始 `status_code = 499` 和 `error_message = CLIENT_ABORTED` 不变。

### 2. 会话继续补账

CCH 会在两个时机做幂等补账：

- 本地中断结算完成后，向后看同会话下一条请求
- 新请求创建后，向前看同会话上一条请求

只要满足：

- 同一 `session_id`
- 相邻 `request_sequence`
- 后续请求发生在 continuation window 内

则上一条本地 `499` 会被升级为：

- `client_abort_outcome = session_continued`
- 并记录 `continued_by_request_id` / `continued_at`

这样可以覆盖“先中断后建新请求”和“先建新请求后旧流才结算”这两种竞态顺序。

## 回填

为避免只有新数据带分类，CCH 提供了一个有界回填入口：

- `POST /api/admin/client-abort-observability/backfill`

请求体：

```json
{
  "sinceHours": 168,
  "batchSize": 200,
  "afterId": 0
}
```

说明：

- `sinceHours`
  - 最近多少小时内的本地 `499 CLIENT_ABORTED` 参与回填，默认 `168` 小时。
- `batchSize`
  - 单批处理条数，默认 `200`。
- `afterId`
  - 用于游标式续跑。

返回值会告诉你：

- 本批扫描了多少条
- 写入了多少条派生字段
- 其中多少条被升级成 `session_continued`
- 是否还有下一批

推荐 rollout 方式：

1. 先上线代码和迁移
2. 对最近 7 天跑一次 backfill
3. 根据 `nextAfterId` 继续滚动到 `hasMore = false`

## 日志页怎么看

日志页现在会在原始 `499` 下面补一个中性标签，显示派生 outcome。

推荐排查顺序：

1. 先看原始状态是否为 `499 CLIENT_ABORTED`
2. 再看派生 outcome
3. 最后看 continuation 与是否已有输出

一般可以这样理解：

- `session_continued`
  - 大概率不是供应商故障，更像客户端收掉旧流后继续对话。
- `after_stream_start`
  - 请求已经开始产出，用户体验上更像“回答写到一半停住”。
- `before_stream_start`
  - 更接近首包前取消、页面切换、连接短断或宿主重载。

详情弹窗里还会补充：

- 是否已开始流式输出
- 是否为长时请求中断
- 由哪条后续请求继续
- 继续发生的时间

## Availability 页怎么看

本地 `499 CLIENT_ABORTED` 且已经拿到派生 outcome 的请求：

- 不再计入 provider failure
- 不再推高 error rate
- 会进入单独的 client-abort counters

因此 availability 页里：

- `systemAvailability` / provider availability 更接近真实供应商健康度
- client-abort 面板只作为补充上下文，不与供应商失败混算

如果某个时间段出现：

- availability 很健康
- 但 client abort counters 很高

优先怀疑：

- 客户端主动停止
- 会话切换/审批后续跑
- IDE 宿主重载
- 网络抖动导致本地断开

而不是直接怀疑供应商故障。

## 运维排查建议

### 更像客户端行为

满足以下特征时，优先按客户端行为排查：

- `client_abort_outcome = session_continued`
- 或 `after_stream_start` 且同会话很快有下一条请求
- availability 没有同步恶化
- 同时段 `200` 和正常 token 输出依旧稳定

### 更值得继续深挖

满足以下特征时，更值得继续深挖端侧或代理链路：

- `before_stream_start` 突然激增
- `0 output / 0 cost / 0 ttfb` 的本地 `499` 突然增多
- 没有 `session_continued`，也没有后续请求接上
- 同时伴随 availability 恶化或真实 `5xx` 上升

## 兼容性说明

- 只有本地 `499 CLIENT_ABORTED` 会使用这套派生分类。
- 非本地 `499`，例如上游真实返回的 `499`，不会被混入这套逻辑。
- 原始传输状态和错误信息保留，方便继续做底层排查和历史兼容。
