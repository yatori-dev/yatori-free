# yatori-free

一个在线 Web 服务的前端面板仓库，**仅含学习通**的相关功能

> **服务地址：https://yatori.hungrym0.com**

![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white)
![React](https://img.shields.io/badge/React-19.3.0-61DAFB.svg?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3.1-646CFF.svg?style=flat-square&logo=vite&logoColor=white)

[![部署状态](https://github.com/yatori-dev/yatori-free/actions/workflows/deploy.yml/badge.svg)](https://github.com/yatori-dev/yatori-free/actions/workflows/deploy.yml)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange.svg?style=flat-square&logo=cloudflare&logoColor=white)

## 功能

> [!TIP]
>
> 💡 **仅需在该网页服务中提交任务，可在云端无人值守自动完成。**
>

### 1. 自动完成章节任务点

受支持的任务点类型包括：
- 视频任务
- 章节测试
- 直播观看任务
- 文档阅读任务
- 带锁的“闯关型”任务

### 2. 自动完成作业/考试

每个课程可设置以下提交策略：
- 直接提交
- 仅保存不提交

### 3. 邮件通知

当出现新动态时，网页服务会通过邮件通知用户，包括：
- 任务成功/失败
- 未完成的作业/考试即将截止
- 含有未完成任务点的课程即将结课

> （默认不启用该功能）

### 4. 课程文档资源下载

该网页服务提供课程章节中的 PDF 文档、PPT 演示文稿等资源的下载功能，用于整理相关学习资料以便查阅。

## 服务端

- ![Go 1.27.2](https://img.shields.io/badge/Go&nbsp;1.27.2-net/http-blue.svg?style=flat-square&logo=go&logoColor=white)
- ![SQLite](https://img.shields.io/badge/SQLite-3-yellow.svg?style=flat-square&logo=sqlite&logoColor=white)
- ![systemd](https://img.shields.io/badge/systemd-257-red.svg?style=flat-square&logo=systemd&logoColor=white)
- ![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare%20Tunnel-2026.10.0-orange.svg?style=flat-square&logo=cloudflare&logoColor=white)

**后端以闭源方式提供网络服务，该仓库仅提供网页服务的前端面板**

## 参考项目

| 项目 | 用途 | 许可证 |
| --- | --- | --- |
| [yatori-go-core](https://github.com/yatori-dev/yatori-go-core) | 学习通任务处理核心 | MIT |
| [chaoxing_tool](https://github.com/liuyunfz/chaoxing_tool) | 学习通课程文档资源下载参考实现 | GPL-3.0 |
| [CxKitty](https://github.com/MMitsuha/CxKitty) | 学习通扫码登录协议参考 | GPL-3.0 |
| [shadcn-admin](https://github.com/satnaing/shadcn-admin) | UI 视觉效果参考 | MIT |
| [N1搜题](https://tk.n1t.cn/) | **由社区赞助的题库！** | ❤️ |

## 声明

本服务仅提供辅助功能，您需要自行承担在学习通平台上的所有学术相关行为的责任。我们不参与任何课程内容的评估或成绩认定。

我们授予您有限的、非独占的、可撤销的许可来访问和使用本服务。您必须：

- 仅将此服务用于个人、非商业目的
- 遵守所有适用的法律法规
- 不对本服务进行网络攻击或逆向工程
- 不进行任何可能损害服务功能或其他用户体验的行为

本服务按"现状"提供，不提供任何明示或暗示的担保。我们不保证服务的中断、错误、或第三方平台的政策变化不会影响本服务的功能。