# 任务流契约

以 `src/components/TaskInlineItem.tsx` 为准。

## 生命周期

1. 组件先根据当前状态判断要不要拉快照
2. `running` / `stopping` 进入 SSE
3. SSE 没打开，切轮询
4. SSE 打开后出错，延迟后切轮询
5. 卸载时关闭 EventSource、清掉 interval 和 timeout

## 数据规则

- `progress.status ?? task.status` 作为有效状态
- 用 `updatedAt` 防止旧包覆盖新包
- `percent` 优先由 `completedUnits / totalUnits` 推导

## 鉴权规则

- 401 不在子层重复 toast
- 统一走 `onUnauthorized`

## React 规则

- 事件处理逻辑用 `useEffectEvent`
- effect 只负责订阅和清理
- 不把每个闭包都塞进依赖数组里乱抖

## 适合抽成 hook 的时机

- 两个以上组件都要接任务流
- 同样的 SSE + polling fallback 重复两次以上
- 组件本身已经被流逻辑压得看不清
