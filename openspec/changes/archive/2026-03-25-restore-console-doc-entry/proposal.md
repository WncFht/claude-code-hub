## Why

当前登录后的主入口已经迁移到 `/console`，但 console 运行时路由和导航中没有文档入口，导致用户进入新前端后无法再从主界面发现和访问现有的 `/usage-doc` 页面。文档内容仍然存在，但在实际使用路径里已经变得不可达，需要恢复可发现性。

## What Changes

- 在当前 console 前端中补回一个明确的文档访问入口
- 让登录后的用户可以从新前端重新进入现有 `/usage-doc` 页面
- 复用现有文档页面内容，而不是重新实现一套文档系统
- 补充相关导航或路由测试，避免后续 console 迁移再次丢失文档入口

## Capabilities

### New Capabilities

- `console-doc-access`: 为登录后的 console 提供稳定的文档访问入口，并复用现有 `/usage-doc` 页面承载内容

### Modified Capabilities

<!-- 当前仓库尚无主 specs，留空 -->

## Impact

- `src/lib/console/runtime-route-map.ts`: 接入文档入口相关的运行时路由或导航定义
- `src/components/console-app/*`: 让 console 导航能够展示文档入口
- `src/app/[locale]/usage-doc/*`: 复用现有文档页面，作为登录后可访问的目标页
- `messages/*`: 复用或补充文档入口文案
- 相关测试文件：覆盖文档入口的可见性与路由行为
