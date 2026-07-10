import { SimpleListScreen } from '../../components/simple-list-screen';

export default function CompanyAttendanceScreen() {
  return (
    <SimpleListScreen<{ id: string; type: string; serverTimestamp: string; employee: { user: { firstName: string; lastName: string } }; branch: { name: string } }>
      title="Devam Kayıtları"
      endpoint="/attendance"
      renderItem={(a) => ({
        key: a.id,
        title: `${a.employee.user.firstName} ${a.employee.user.lastName}`,
        subtitle: `${a.type} · ${a.branch.name} · ${new Date(a.serverTimestamp).toLocaleString('tr-TR')}`,
      })}
    />
  );
}
