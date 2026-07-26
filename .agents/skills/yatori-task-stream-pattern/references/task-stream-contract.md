# 任务流契约

以 `src/hooks/useTaskProgressPolling.ts` 为准；`src/components/TaskInlineItem.tsx` 负责把快照呈现为任务卡。

## 生命周期

1. Dashboard 把任务列表传给 `useTaskProgressPolling`
2. `running` / `stopping` 每 `2500ms` 拉取一次任务详情
3. 每次请求只接受该任务最新请求的结果
4. 终态仍拉一次快照，补齐最终进度和结果
5. effect 清理时清掉 interval

## 数据规则

- 终态优先使用任务列表里的状态；非终态可使用详情快照状态
- 用 `updatedAt` 防止旧包覆盖新包
- 百分比由 `completedUnits`、`failedUnits` 和 `totalUnits` 推导

## 鉴权规则

- 401 或 403 不在子层重复 toast，统一走 `onUnauthorized`

## React 规则

- 请求处理逻辑用 `useEffectEvent` 或稳定回调
- effect 只负责轮询和清理
- 不把每个闭包都塞进依赖数组里导致计时器反复重建

## 维护边界

- 活动态、终态详情快照和轮询间隔由 `src/lib/taskStatus.ts` 与 `useTaskProgressPolling.ts` 统一管理。
- 新调用方复用现有 hook；只有生命周期语义不同且经确认后，才创建新的 hook。
