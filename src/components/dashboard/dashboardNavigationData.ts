import { Activity, BookOpen, MapPin, Settings } from 'lucide-react';

export type DashboardViewId = 'courses' | 'sign' | 'tasks' | 'settings';
export type MobileDashboardTabId = DashboardViewId;

export const desktopItems: Array<{ id: DashboardViewId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '课程列表', icon: BookOpen },
  { id: 'sign', label: '自动签到', icon: MapPin },
  { id: 'tasks', label: '任务', icon: Activity },
  { id: 'settings', label: '提交设置', icon: Settings },
];

export const mobileItems: Array<{ id: MobileDashboardTabId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '课程', icon: BookOpen },
  { id: 'sign', label: '签到', icon: MapPin },
  { id: 'tasks', label: '任务', icon: Activity },
  { id: 'settings', label: '设置', icon: Settings },
];

export const mobileDashboardTabOrder = mobileItems.map((item) => item.id);
