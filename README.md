# yatori-free

基于 [yatori-go-core](https://github.com/yatori-dev/yatori-go-core) 二改的在线 Web 服务前端面板，**仅含学习通**的相关功能

服务地址：https://yatori.hungrym0.com

![React](https://img.shields.io/badge/React-19.2.6-61DAFB.svg?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.0-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-4.11.0-000000.svg?style=flat-square&logo=shadcnui&logoColor=white)

[![部署状态](https://github.com/yatori-dev/yatori-free/actions/workflows/deploy.yml/badge.svg)](https://github.com/yatori-dev/yatori-free/actions/workflows/deploy.yml)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange.svg?style=flat-square&logo=cloudflare&logoColor=white)
![Google Style](https://img.shields.io/badge/Google-Style-red.svg?style=flat-square&logo=google&logoColor=white)
![Material Design](https://img.shields.io/badge/Material_Design-3-blue.svg?style=flat-square&logo=materialdesign&logoColor=white)

## 功能

该网页服务仅需提交自身所需的任务，可无人值守在后台自动完成。提交完之后，可以关闭网页

### 1. 自动完成章节任务点

包括：
- 视频任务
- 章节测试
- 直播观看任务
- 文档阅读任务

### 2. 自动完成作业/考试

每个课程可设置以下提交策略：
- 直接提交
- 仅保存不提交

### 3. 自动监听并执行签到

受支持的签到类型：
- 普通签到
- 位置签到
- 手势签到
- 签到码签到

> [!WARNING]
>
> - 暂不支持**二维码签到、拍照签到**
> - 需要在签到任务发起前开始监听，否则无法执行

### 4. 增量获取学习次数/学习时长

该网页服务提供读取、提交学习次数与学习时长。

你可以在 `学习通客户端 APP` - `课程` - `学习记录` 中查看到自己在该课程的学习次数与学习时长数据

## 服务端技术选型

- ![Go 1.26.5](https://img.shields.io/badge/Go-1.26.5-blue.svg?style=flat-square&logo=go&logoColor=white)
- ![net/http](https://img.shields.io/badge/net/http-1.26.5-blue.svg?style=flat-square&logo=go&logoColor=white)
- ![SQLite](https://img.shields.io/badge/SQLite-3-yellow.svg?style=flat-square&logo=sqlite&logoColor=white)
- ![systemd](https://img.shields.io/badge/systemd-257-red.svg?style=flat-square&logo=systemd&logoColor=white)
- ![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare%20Tunnel-2026.7.1-orange.svg?style=flat-square&logo=cloudflare&logoColor=white)
- ![yatori-go-core](https://img.shields.io/badge/yatori--go--core-2.0.4.9-green.svg?style=flat-square&logoColor=white)

> 服务端遵循 [yatori-go-core](https://github.com/yatori-dev/yatori-go-core) 的 MIT 协议、以闭源方式提供网络服务

## 社区群组

**本网页服务群组仅限群成员邀请加入。** 以下是上游项目的官方QQ群组，与本网页服务内容无关：
- [932447008](https://qm.qq.com/q/KREkme4rYc)（一群，未满）（推荐）
- [1044155704](https://qm.qq.com/q/ZmBAjtFJi6)（二群，已满）
- [1101685348](https://qm.qq.com/q/3MOiFau9pY)（三群，未满）（推荐）
