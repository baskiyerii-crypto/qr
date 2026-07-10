import { SimpleListScreen } from '../../components/simple-list-screen';

export default function AdminLogsScreen() {
  return (
    <SimpleListScreen<{ id: string; action: string; entityType: string; createdAt: string; eventType?: string; application?: { companyName: string; email: string } }>
      title="Sistem Kayıtları"
      endpoint="/admin/activity-log"
      renderItem={(l) => ({
        key: l.id,
        title: l.eventType ?? l.action ?? 'Kayıt',
        subtitle: `${l.application?.companyName ?? l.application?.email ?? '—'} · ${new Date(l.createdAt).toLocaleString('tr-TR')}`,
      })}
    />
  );
}
