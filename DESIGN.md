---
name: Yatori Study Control
purpose: 学习通课程任务与签到管理界面的统一设计契约
product: 学习管理型后台
stack: React + TypeScript + Tailwind CSS + shadcn/ui + Radix UI
breakpoints:
  mobile: '< 640px'
  tablet: '640px - 1023px'
  desktop: '>= 1024px'
colors:
  background: '#F8FAFC'
  surface: '#FFFFFF'
  surface-muted: '#F1F5F9'
  text: '#0F172A'
  text-muted: '#475569'
  border: '#CBD5E1'
  primary: '#1A73E8'
  primary-hover: '#1557B0'
  primary-container: '#E8F0FE'
  brand-blue: '#4285F4'
  brand-red: '#EA4335'
  brand-yellow: '#FBBC05'
  brand-green: '#34A853'
  success: '#15803D'
  success-container: '#DCFCE7'
  warning: '#B45309'
  warning-container: '#FEF3C7'
  danger: '#B42318'
  danger-container: '#FEE4E2'
  info: '#1A73E8'
  info-container: '#E8F0FE'
typography:
  family: 'Geist Variable, system-ui, sans-serif'
  heading-weight: 650
  body-weight: 400
  label-weight: 550
  body-size: 14px
  body-line-height: 22px
rounded:
  control: 8px
  card: 12px
  dialog: 16px
  pill: 9999px
spacing:
  base: 4px
  control: 44px
  mobile-gutter: 16px
  tablet-gutter: 24px
  desktop-gutter: 32px
  section: 24px
---

# Yatori Study Control

## 设计定位

这是一个任务控制台，不是营销页，也不是信息展示墙。

界面优先回答四个问题：

1. 当前有哪些课程可以处理？
2. 当前选择和配置是什么？
3. 任务是否已经提交、正在运行或失败？
4. 用户下一步应该做什么？

视觉方向是克制、稳定、可扫描。颜色服务于状态和操作，不承担装饰任务。

## 设计原则

### 1. 操作优先

课程选择、任务提交、停止任务、刷新状态是一级操作。设置、日志、下载文档是二级操作。

一级操作必须有明确文字。只使用图标的按钮只适用于刷新、关闭、下载、切换主题等低歧义动作。

### 2. 状态可见

任务状态必须同时使用文字、图标或结构变化表达。不能只靠红绿颜色区分成功和失败。

加载、空状态、失败、权限失效和已完成必须有独立文案。

### 3. 信息分层

课程列表展示课程名、任务点进度和当前处理状态。章节、文档和详细配置默认收起。

任务卡展示当前进度和下一步动作。完整配置快照属于展开内容。

### 4. 触控友好

移动端可点击区域最小为 `44px × 44px`。桌面端紧凑按钮也保留足够的点击间距。

### 5. 单一来源

品牌色、操作色、状态色、字体、圆角、阴影和动效必须来自本文件定义的 Token。业务组件禁止直接写入新的十六进制颜色。

## 颜色 Token

### 基础 Token

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `background` | `#F8FAFC` | `#0F172A` | 页面背景 |
| `surface` | `#FFFFFF` | `#111827` | 卡片、面板、输入框 |
| `surface-muted` | `#F1F5F9` | `#1E293B` | 次级区域、禁用区域背景 |
| `text` | `#0F172A` | `#F8FAFC` | 主标题、正文、关键数值 |
| `text-muted` | `#475569` | `#CBD5E1` | 描述、辅助信息、时间 |
| `border` | `#CBD5E1` | `#334155` | 边框、分隔线 |
| `primary` | `#1A73E8` | `#8AB4F8` | 主按钮、当前导航、链接、焦点 |
| `primary-hover` | `#1557B0` | `#AECBFA` | 主操作悬停 |
| `primary-container` | `#E8F0FE` | `#1E3A5F` | 选中背景、轻量提示 |

操作层只保留一个主色系：`primary`。Google 品牌四色属于品牌 Token，不参与业务状态表达，也不在每个组件中随意混用。

### Google 品牌色

| Token | Hex | 用途 |
| --- | --- | --- |
| `brand-blue` | `#4285F4` | Yatori 标识、品牌横条、品牌插图 |
| `brand-red` | `#EA4335` | Yatori 标识、品牌横条、品牌插图 |
| `brand-yellow` | `#FBBC05` | Yatori 标识、品牌横条、品牌插图 |
| `brand-green` | `#34A853` | Yatori 标识、品牌横条、品牌插图 |

品牌四色允许出现在登录页、恢复会话页和品牌标识中。登录后的 Dashboard 以 `primary` 为主，避免每个业务卡片都出现彩色装饰。

### 语义状态 Token

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `success` | `#15803D` | `#86EFAC` | 成功、已完成、已签到 |
| `success-container` | `#DCFCE7` | `#14532D` | 成功背景 |
| `warning` | `#B45309` | `#FCD34D` | 等待、处理中、风险提示 |
| `warning-container` | `#FEF3C7` | `#78350F` | 警告背景 |
| `danger` | `#B42318` | `#FDA4AF` | 失败、停止、不可恢复错误 |
| `danger-container` | `#FEE4E2` | `#4C0519` | 错误背景 |
| `info` | `#1A73E8` | `#8AB4F8` | 信息、进行中、普通提示 |
| `info-container` | `#E8F0FE` | `#1E3A5F` | 信息背景 |

状态 Badge 使用语义变体：`success`、`warning`、`danger`、`info`、`neutral`。品牌绿只用于品牌标识，不能代替 `success`；品牌红不能代替 `danger`。

### 品牌使用

Yatori 使用 Google 风格四色文字标识或四色 SVG 标识。登录页和恢复会话页可以使用四色横条，作为明确的品牌锚点。

品牌色只表达品牌，不表达任务状态。任务状态始终使用语义 Token。

## 字体与文字

主字体使用 `Geist Variable`，中文使用系统 UI 字体回退。字体依赖必须在入口文件显式引入，不能只在 CSS 中声明字体名。

### 字号层级

| 层级 | 字号 / 行高 | 用途 |
| --- | --- | --- |
| `display` | `32px / 40px` | 登录页品牌标题、少量页面级标题 |
| `heading-lg` | `24px / 32px` | 页面标题 |
| `heading-md` | `18px / 26px` | 卡片标题、任务名称 |
| `body` | `14px / 22px` | 默认正文 |
| `body-sm` | `13px / 20px` | 辅助说明、时间、次要信息 |
| `label` | `14px / 20px` | 表单标签、按钮文字 |
| `caption` | `12px / 18px` | Badge、极次要元信息 |

移动端不使用低于 `12px` 的可见文字。任务结果、课程名和错误信息不能使用 `10px` 字号。

标题使用 `600` 或 `650` 字重。正文避免使用过细字重。数字和计时器使用 `tabular-nums`。

## 布局规则

### 页面容器

- 页面最大宽度：`1280px`。
- 手机端水平边距：`16px`。
- 平板端水平边距：`24px`。
- 桌面端水平边距：`32px`。
- 页面区块间距：`24px`。
- 卡片内部默认间距：`20px`，紧凑列表使用 `16px`。

### PC 端 Dashboard

桌面端使用两列控制台：

- 左侧占 `8` 列，负责课程、签到和设置。
- 右侧占 `4` 列，固定展示任务状态。
- 任务面板顶部必须和左侧内容标题对齐。
- 右侧面板可以吸附，但不能依赖固定的顶部空白值对齐。
- 课程列表支持搜索、状态筛选和批量选择。

任务状态保持可见，但不能抢过当前左侧主流程的标题和一级操作。

### 移动端 Dashboard

- 使用底部四项导航：课程、签到、任务、设置。
- 页面本身承担主滚动，卡片默认不设置固定高度。
- 仅超长日志允许内部滚动。
- 底部导航必须考虑安全区高度。
- 选择课程后出现底部操作栏，操作栏位于底部导航之上。
- 操作栏必须显示已选数量和明确动作，例如“提交任务”。
- 课程行的操作按钮在小屏下分组排列，不能出现多个低辨识度图标挤在同一行。

### 登录流程

- 登录使用两步流程：账号、密码。
- 当前步骤必须有明确的步骤提示或进度标识。
- 两步内容保持稳定的垂直锚点，避免卡片因固定高度产生大面积空白。
- 输入框高度不低于 `48px`。
- 错误信息显示在对应字段附近，并通过 `aria-live` 或 `role="alert"` 通知辅助技术。

## 组件规则

### Button

- 主按钮使用 `primary` 背景和白色文字。
- 危险操作使用 `danger` 语义，不使用红色文字加透明背景作为唯一提示。
- 移动端高度不低于 `44px`，桌面端高度不低于 `40px`。
- 图标按钮必须有 `aria-label` 或可见文字。
- 按钮悬停只改变颜色、边框或阴影，不使用会造成布局位移的缩放。

### Input

- 标签始终可见，Placeholder 不能替代标签。
- 输入框高度为 `48px`，紧凑列表中的输入框不低于 `40px`。
- 焦点使用 `focus-visible` 表达，颜色使用 `primary`。
- 错误状态同时使用边框、图标和错误文字。

### Card

- 默认使用 `surface` 背景、`border` 边框和轻阴影。
- 普通卡片圆角 `12px`。
- 卡片不承载过多互不相关的设置。
- 列表卡片的主标题、状态和主操作必须在首屏可见。

### Badge

- 只表达状态、数量或类别。
- 可见文字最低 `12px`。
- 使用 `success`、`warning`、`danger`、`info`、`neutral` 五种语义变体。
- 不用颜色单独表达任务状态。

### Tabs 与底部导航

- 当前项同时使用文字颜色、背景或下划线表达。
- 所有原生按钮保留 `focus-visible` 样式。
- 移动端底部导航图标尺寸统一为 `20px`，文字尺寸为 `12px`。
- 导航切换动画只做轻微位移或淡入，不使用明显弹跳。

### Dialog

- 移动端宽度使用视口减去 `32px`。
- 内容区域最大高度为视口高度的 `80%`。
- 操作按钮固定在底部，主操作放在右侧或底部最后一个位置。
- 关闭按钮必须有可访问名称。

## 任务流

### 课程选择

课程行默认展示：

- 课程名称。
- 任务点进度。
- 处理中、未开放等状态。
- 选择控件。
- “查看章节”和“设置学习目标”入口。

选择课程后，底部操作栏展示：

- 已选课程数量。
- 查看配置入口。
- 清除选择。
- 提交任务。

### 任务状态

任务状态统一使用以下状态模型：

| 状态 | 颜色 | 必须展示 |
| --- | --- | --- |
| `pending` | `warning` | 等待原因、开始时间 |
| `running` | `info` | 当前课程、进度、停止操作 |
| `stopping` | `warning` | 停止请求已发送 |
| `success` | `success` | 完成结果、结束时间 |
| `partial_success` | `warning` | 已完成项、失败项、后续建议 |
| `failed` | `danger` | 错误原因、重试或退出操作 |
| `night_resting` | `warning` | 当前休息原因、预计恢复时间 |

进度条旁必须有数字或文字结果。状态卡不能只展示一条颜色线。

### 自动签到

签到监测页分为两个区块：

- 顶部：当前监测状态、支持的签到类型、启动或停止操作。
- 下方：签到历史、刷新、分页和空状态。

签到类型使用统一的 `info`、`success`、`warning`、`neutral` 语义，不为每种类型分配独立品牌色。

## 动效

- 微交互时长：`150ms - 250ms`。
- 页面切换时长：不超过 `300ms`。
- 使用 `ease-out` 或统一的标准缓动曲线。
- 加载状态使用旋转图标或骨架屏，避免多个动效同时抢注意力。
- 任务状态变化可以使用一次性淡入提示，不持续闪烁。
- 必须实现 `prefers-reduced-motion: reduce`，减少位移、旋转和脉冲动画。

## 可访问性

- 所有可交互元素都必须支持键盘操作。
- 保留 `focus-visible` 焦点样式，不用 `focus:outline-none` 直接移除反馈。
- 图标按钮必须有 `aria-label`。
- 错误、成功和登录失效提示使用 `role="alert"` 或 `aria-live`。
- 文本与背景达到 WCAG AA 对比度。
- 不把按钮嵌套在 `label` 内，也不把可点击 `span` 当作按钮使用。
- 不用颜色作为唯一状态信号。
- 图片提供准确的 `alt` 文本；装饰图片使用空 `alt`。

## 实施约束

- 业务组件不直接写十六进制颜色。
- 业务组件不创建新的字体、圆角和阴影体系。
- 共用状态样式放入 `src/components/ui/` 的变体定义。
- 页面级布局放在业务组件，跨页面 Token 放在 `src/index.css`。
- 新增交互必须同时定义默认、加载、成功、失败、禁用和键盘焦点状态。
- 新增移动端固定元素必须验证安全区、键盘弹出和页面滚动行为。
