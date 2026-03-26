# console-doc-access Specification

## Purpose

定义当前 console 前端如何为已登录且允许访问 Web UI 的用户提供稳定、可发现的文档访问入口。该 spec 约束文档入口必须在迁移后的主工作区中可见，并且继续复用现有 `/usage-doc` 页面承载内容，而不是要求用户手动记忆隐藏路径或引入重复的文档实现。

## Requirements
### Requirement: Console 为已登录 Web UI 用户提供文档入口
系统 SHALL 为已登录且允许访问 Web UI 的用户在当前 console 前端中提供明确的文档访问入口，用户不应依赖手动输入 `/usage-doc` 路径才能找到文档页面。

#### Scenario: 管理员在 console 中看到文档入口
- **WHEN** 管理员用户进入 `/console` 下的任意可访问页面
- **THEN** 当前前端 SHALL 显示一个可见的文档入口
- **THEN** 该入口 SHALL 可直接用于访问产品文档

#### Scenario: 普通 Web UI 用户在 console 中看到文档入口
- **WHEN** 允许登录 Web UI 的普通用户进入 `/console` 下的任意可访问页面
- **THEN** 当前前端 SHALL 显示一个可见的文档入口
- **THEN** 该入口 SHALL 不依赖管理员专属页面才可访问

### Requirement: Console 文档入口复用现有使用文档页面
系统 SHALL 让 console 中的文档入口跳转到现有的 `/usage-doc` 文档页面或其等价的本地化路径，并继续复用现有文档内容，而不是引入一套新的独立文档实现。

#### Scenario: 从 console 进入现有文档页面
- **WHEN** 已登录用户从当前 console 前端点击文档入口
- **THEN** 系统 SHALL 导航到现有的使用文档页面
- **THEN** 用户 SHALL 看到当前仓库已存在的文档内容

#### Scenario: 文档入口恢复后无需记忆隐藏路径
- **WHEN** 已登录用户首次进入迁移后的前端
- **THEN** 用户 SHALL 可以仅通过界面导航发现文档页面
- **THEN** 系统 SHALL 不要求用户手动猜测或记忆 `/usage-doc` 路径
