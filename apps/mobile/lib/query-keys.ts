export const queryKeys = {
  notifications: ['notifications'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  dashboard: ['dashboard'] as const,
  payrollSummary: (year: number, month: number) => ['payroll-summary', year, month] as const,
  myAnnouncements: ['my-announcements'] as const,
  liveEmployees: ['employees-live'] as const,
  pendingLeaves: ['leaves-pending'] as const,
  employees: ['employees'] as const,
  list: (endpoint: string) => ['list', endpoint] as const,
};
