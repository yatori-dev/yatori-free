import type { CourseSummary, Task } from './api';
import { isActiveTaskStatus } from './taskStatus';
import { courseHasTaskPoints } from './coursePresentation';

export function getTaskCounts(tasks: Task[]) {
  return tasks.reduce((counts, task) => {
    counts[isActiveTaskStatus(task.status) ? 'active' : 'completed'] += 1;
    return counts;
  }, { active: 0, completed: 0 });
}

export function getCourseNameMap(courses: CourseSummary[]) {
  return courses.reduce<Record<string, string>>((map, course) => {
    const name = course.courseName?.trim();
    if (!name) return map;
    map[course.key] = name;
    if (course.courseId) map[course.courseId] = name;
    return map;
  }, {});
}

export function getVisibleCourses(courses: CourseSummary[], hideEmpty: boolean) {
  return hideEmpty ? courses.filter(courseHasTaskPoints) : courses;
}
