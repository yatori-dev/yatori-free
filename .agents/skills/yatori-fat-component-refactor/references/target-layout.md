# 推荐目录落点

## Dashboard 类页面

推荐结构：

```text
src/components/
  Dashboard.tsx
  dashboard/
    CourseListSection.tsx
    CourseRow.tsx
    DashboardNavigation.tsx
    TaskStatusContent.tsx
    TaskStatusDrawer.tsx
    TaskStatusTrigger.tsx
    TaskSettingsPanel.tsx
  hooks/
    useTaskProgressPolling.ts
```

## SignMonitor 类页面

推荐结构：

```text
src/components/
  SignMonitor.tsx
  sign-monitor/
    SignMonitorHeader.tsx
    SignMonitorConfigForm.tsx
    SignLogList.tsx
```

## 可以进 src/lib 的内容

- 请求参数整形
- 响应数据映射
- 日期和状态格式化
- 课程筛选和选择集计算

## 可以进 src/hooks 的内容

- 本地存储同步
- 任务详情轮询与定时刷新
- 定时刷新
- 分页状态管理
