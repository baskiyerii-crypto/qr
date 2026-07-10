import { SimpleListScreen } from '../../components/simple-list-screen';

export default function AdminUsersScreen() {
  return (
    <SimpleListScreen<{ id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean }>
      title="Kullanıcılar"
      endpoint="/admin/users"
      renderItem={(u) => ({
        key: u.id,
        title: `${u.firstName} ${u.lastName}`,
        subtitle: `${u.email} · ${u.role} · ${u.isActive ? 'Aktif' : 'Pasif'}`,
      })}
    />
  );
}
