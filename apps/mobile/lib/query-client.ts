import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

/** Web ile aynı: uygulama ön plana gelince aktif sorguları yenile */
export function invalidateAllQueries() {
  return queryClient.invalidateQueries();
}

export function invalidateNotifications() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
}

export function invalidateMessages() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
}

export function invalidateDashboard() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: queryKeys.liveEmployees }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingLeaves }),
  ]);
}

export function invalidateByNotificationType(type: string) {
  const tasks: Promise<unknown>[] = [invalidateNotifications()];
  if (type === 'MESSAGE' || type === 'GROUP_MESSAGE') tasks.push(invalidateMessages());
  if (
    ['LEAVE_REQUEST', 'LEAVE_REVIEW', 'STAFF_REQUEST', 'STAFF_REQUEST_REVIEW', 'ATTENDANCE_OFF_BRANCH', 'ATTENDANCE_REVIEW'].includes(type)
  ) {
    tasks.push(invalidateDashboard());
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.pendingLeaves }));
  }
  if (type === 'ANNOUNCEMENT') tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.myAnnouncements }));
  if (type === 'SURVEY') tasks.push(queryClient.invalidateQueries({ queryKey: ['surveys'] }));
  if (type === 'TASK_ASSIGNED') tasks.push(queryClient.invalidateQueries({ queryKey: ['tasks'] }));
  return Promise.all(tasks);
}
