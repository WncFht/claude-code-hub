# 2026-03-25 现网部署与观测记录

## 部署确认

- 仓库路径：`/home/fanghaotian/Desktop/src/cch/claude-code-hub`
- live base URL：`http://127.0.0.1:23000`
- live app 容器：`claude-code-hub-app-s6gz`
- 数据库容器：`claude-code-hub-db-s6gz`

## 健康检查

时间：`2026-03-25 15:16:39 +08:00`

```json
{"status":"ok","timestamp":"2026-03-25T07:16:39.528Z","version":"1.0.0"}
```

## Admin 回填执行

用途：为历史 `499 CLIENT_ABORTED` 请求补齐 `client_abort_outcome`、`client_abort_long_running`、`client_abort_continued_*`，让 GUI 可以展示分类结果。

认证方式：

- `POST /api/auth/login`
- JSON body：`{"key":"hP29pGlTuF578OmCYrGNZ8lUMbqrh67N"}`

回填接口：

- `POST /api/admin/client-abort-observability/backfill`

首批返回：

```json
{"success":true,"since":"2026-03-18T06:52:12.809Z","batchSize":200,"scanned":200,"updated":200,"reconciled":27,"nextAfterId":14648,"hasMore":true}
```

持续执行直到 `hasMore=false`，最终一批：

```json
{"success":true,"since":"2026-03-18T07:03:52.541Z","batchSize":200,"scanned":35,"updated":35,"reconciled":9,"nextAfterId":27744,"hasMore":false}
```

## 数据库实测结果

统计窗口：最近 7 天，条件为 `status_code = 499` 且 `error_message = 'CLIENT_ABORTED'`。

### outcome 计数

```text
outcome,count
after_stream_start,1451
session_continued,272
```

说明：

- 本次统计窗口内未观察到 `before_stream_start`
- 这不代表代码不支持，只代表最近 7 天没有落到该分类的记录

### long-running 计数

```text
long_running_count
145
```

### session continued 样例

```text
id,client_abort_outcome,client_abort_continued_by_request_id,client_abort_continued_at
27779,session_continued,27783,2026-03-25 14:59:06.295+08
27770,session_continued,27773,2026-03-25 14:57:09.273+08
27765,session_continued,27768,2026-03-25 14:56:05.452+08
```

这些记录对应日志详情中的“由请求 #... 继续”“继续时间 ...”可视化信息。

## GUI 截图文件

- `figures/logs-session-continued-page.png`
- `figures/client-abort-section-session-continued.png`
- `figures/client-abort-section-after-stream.png`
- `figures/availability-overview.png`

截图元数据见：`capture-metadata.json`
