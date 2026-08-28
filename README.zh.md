# Void++

[English](README.md) · [中文](README.zh.md)

## 安装

[![Install userscript](https://img.shields.io/badge/安装-用户脚本-00d26a?style=for-the-badge)](https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/userscript/Void.user.js)

## 变更

### 新增

#### 插件

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| Cleaner 默认开启 | 开 | 上游已有该插件；Void++ 改为默认打开。隐藏升级提示、首页横幅、输入栏 SuperGrok 标记，以及锁定模型。 |
| InputHistory | 开 | 在输入框用 ↑ / ↓ 翻看历史提示词，类似终端。 |
| NoGrokBot | 开 | 隐藏右上角 Grok Bot 推广按钮。 |
| NoSidebarIdentity | 开 | 分开开关，隐藏侧栏用户名 / 邮箱。头像保留，账号菜单仍可打开。 |
| ChatStateFavicons | 开 | 标签页图标反映会话状态（streaming / done / ready / error），五种叠层样式。 |
| NoShareLink | 开 | 分开开关，隐藏「分享项目」和「创建分享链接」。 |
| NoDictation | 开 | 隐藏输入栏语音按钮。 |
| UsageDisplay | 开 | 聊天栏显示官方 SuperGrok 周用量。可选日统计（`usageStats`，默认关）：悬停先看本周，再看今日；点击打开按日历史。 |
| Placeholder | 关 | 替换输入框轮换占位文案。 |
| ThemedScrollbar | 开 | 工程栏滚动条跟随 Grok 亮色 / 暗色主题。 |
| ComposerOpacity | 开 | 调节输入栏背景透明度和模糊。 |
| RecentTopics | 开 | Ctrl+` 切换最近会话（玻璃卡片、项目名、上轮问答预览）。 |

#### 设置 UI

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| 插件置顶 | — | 把插件卡片钉在当前分类顶部。 |
| 插件收藏 | — | 星标收藏插件；插件页默认进入 Favorites。分类：Favorites / All / Chat / UI / Privacy / Other。 |

### 修复

#### 插件

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| Cleaner | 开 | 模型选择器里再次隐藏不可用 / 锁定模型。 |

#### 设置 UI

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| 设置 / 图标 | — | Grok 设置侧栏中的 Void 标签。头像菜单 Void 行使用 16px V++ 字形；脚本 `@icon` 与应用磁贴为同一标记。插件浮层显示各插件图标。 |
| 聊天栏按钮 | — | Grok 去掉 `ButtonWithTooltipOptimized` 后，聊天栏 Void 按钮已恢复。 |

### 删除

#### 插件

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| RateLimitDisplay | — | Grok 积分规则变更后，旧的按模式速率读数失效，已移除。周用量改由 UsageDisplay 承担。 |
