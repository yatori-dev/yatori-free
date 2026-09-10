import { Activity, BookOpen, ClipboardList, GraduationCap, MapPin, Settings } from 'lucide-react';

export type DashboardViewId = 'courses' | 'works' | 'exams' | 'sign' | 'settings';
export type MobileDashboardTabId = DashboardViewId | 'tasks';

export const desktopItems: Array<{ id: DashboardViewId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '章节任务', icon: BookOpen },
  { id: 'works', label: '课程作业', icon: ClipboardList },
  { id: 'exams', label: '课程考试', icon: GraduationCap },
  { id: 'sign', label: '自动签到', icon: MapPin },
  { id: 'settings', label: '设置', icon: Settings },
];

export const mobileItems: Array<{ id: MobileDashboardTabId; label: string; icon: typeof BookOpen }> = [
  { id: 'courses', label: '学习', icon: BookOpen },
  { id: 'sign', label: '签到', icon: MapPin },
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
  'works',
  'exams',
  'sign',
  'tasks',
  'settings',
];
