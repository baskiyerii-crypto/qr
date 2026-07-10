import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { api } from './api';
import { queryKeys } from './query-keys';

/** Ekran odaklandığında sorguyu yenile (web'deki window focus gibi) */
export function useRefetchOnFocus(refetch: () => void) {
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
}

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
};

export function useNotifications() {
  const q = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.get<NotificationItem[]>('/notifications'),
    refetchInterval: 15_000,
  });
  useRefetchOnFocus(q.refetch);
  const unread = (q.data ?? []).filter((n) => !n.isRead).length;
  return { ...q, unread };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export type Conversation = {
  id: string;
  type: string;
  name?: string;
  subject?: string;
  participants?: Array<{ employee?: { user: { firstName: string; lastName: string } } }>;
  messages: Array<{ body: string }>;
};

export function useConversations() {
  const q = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => api.get<Conversation[]>('/messages/conversations'),
    refetchInterval: 8_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderUser?: { firstName: string; lastName: string };
  senderEmployee?: { user: { firstName: string; lastName: string } };
};

export function useConversationMessages(conversationId: string | null) {
  const q = useQuery({
    queryKey: queryKeys.messages(conversationId ?? ''),
    queryFn: () => api.get<Message[]>(`/messages/conversations/${conversationId}`),
    enabled: !!conversationId,
    refetchInterval: conversationId ? 5_000 : false,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function useDashboard() {
  const q = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () =>
      api.get<{
        totalEmployees: number;
        checkedInNow: number;
        pendingLeaves: number;
        pendingDevices: number;
      }>('/dashboard'),
    refetchInterval: 30_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function useLiveEmployees() {
  const q = useQuery({
    queryKey: queryKeys.liveEmployees,
    queryFn: () =>
      api.get<
        Array<{
          employee: { user: { firstName: string; lastName: string } };
          branch: { name: string };
        }>
      >('/employees/live'),
    refetchInterval: 15_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function usePendingLeaves() {
  const q = useQuery({
    queryKey: queryKeys.pendingLeaves,
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          type: string;
          startDate: string;
          endDate: string;
          employee: { user: { firstName: string; lastName: string } };
        }>
      >('/leaves?status=PENDING'),
    refetchInterval: 30_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => api.get<Array<{ id: string; user: { firstName: string; lastName: string } }>>('/employees'),
    staleTime: 60_000,
  });
}

export function usePayrollSummary(year: number, month: number, enabled: boolean) {
  const q = useQuery({
    queryKey: queryKeys.payrollSummary(year, month),
    queryFn: () =>
      api.get<{
        summary: { totalWorkedMinutes: number; totalOvertimeMinutes: number; totalMissingMinutes: number; absentDays: number };
        payroll: { baseSalary: number; overtimePay: number; deductions: number; estimatedNet: number };
      }>(`/payroll/my-summary?year=${year}&month=${month}`),
    enabled,
    refetchInterval: 60_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function useMyAnnouncements(enabled: boolean) {
  const q = useQuery({
    queryKey: queryKeys.myAnnouncements,
    queryFn: () =>
      api.get<Array<{ readAt: string | null; announcement: { requiresAck: boolean }; acknowledgedAt: string | null }>>(
        '/announcements/my',
      ),
    enabled,
    refetchInterval: 30_000,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}

export function useApiList<T>(endpoint: string, refetchInterval = 30_000) {
  const q = useQuery({
    queryKey: queryKeys.list(endpoint),
    queryFn: async () => {
      const data = await api.get<T[]>(endpoint);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval,
  });
  useRefetchOnFocus(q.refetch);
  return q;
}
