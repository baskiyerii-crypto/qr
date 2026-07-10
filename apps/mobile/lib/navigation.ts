import { Router } from 'expo-router';

export function navigateFromNotification(
  router: Pick<Router, 'push'>,
  type: string,
  data?: Record<string, unknown>,
) {
  if (type === 'SURVEY' && data?.surveyId) {
    router.push('/(tabs)/surveys');
    return;
  }
  if ((type === 'MESSAGE' || type === 'GROUP_MESSAGE') && data?.conversationId) {
    router.push(`/(tabs)/messages?conversationId=${data.conversationId}`);
    return;
  }
  if (type === 'ANNOUNCEMENT') {
    router.push('/(tabs)/announcements');
    return;
  }
  if (type === 'TASK_ASSIGNED') {
    router.push('/(tabs)/tasks');
    return;
  }
  if (type === 'LEAVE_REQUEST' || type === 'LEAVE_REVIEW') {
    router.push('/(tabs)/leaves');
    return;
  }
  if (type === 'STAFF_REQUEST' || type === 'STAFF_REQUEST_REVIEW') {
    router.push('/(tabs)/requests');
    return;
  }
  router.push('/(tabs)/notifications');
}
