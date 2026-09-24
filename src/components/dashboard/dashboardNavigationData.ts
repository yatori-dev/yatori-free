import { Activity, BookOpen, ClipboardList, Clock3, GraduationCap, Settings } from 'lucide-react';

export type DashboardViewId = 'courses' | 'works' | 'exams' | 'study' | 'settings';
export type MobileDashboardTabId = DashboardViewId | 'tasks';

export const desktopItems: Array<{ id: DashboardViewId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '章节任务', icon: BookOpen },
  { id: 'works', label: '作业', icon: ClipboardList },
  { id: 'exams', label: '考试', icon: GraduationCap },
  { id: 'study', label: '学习目标', icon: Clock3 },
  { id: 'settings', label: '设置', icon: Settings },
];

export const mobileItems: Array<{ id: MobileDashboardTabId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '学习', icon: BookOpen },
  { id: 'study', label: '目标', icon: Clock3 },
  { id: 'tasks', label: '任务', icon: Activity },
  { id: 'settings', label: '设置', icon: Settings },
];

export const mobileLearningTabs: Array<{ id: 'courses' | 'works' | 'exams'; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '章节任务', icon: BookOpen },
  { id: 'works', label: '作业', icon: ClipboardList },
  { id: 'exams', label: '考试', icon: GraduationCap },
];

export const mobileDashboardTabOrder: MobileDashboardTabId[] = [
  'courses',
  'study',
  'works',
  'exams',
  'tasks',
  'settings',
];
