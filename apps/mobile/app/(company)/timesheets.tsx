import { SimpleListScreen } from '../../components/simple-list-screen';

export default function CompanyTimesheetsScreen() {
  return (
    <SimpleListScreen<{ id: string; periodStart: string; periodEnd: string; status: string; employee: { user: { firstName: string; lastName: string } } }>
      title="Zaman Çizelgeleri"
      endpoint="/timesheets"
      renderItem={(t) => ({
        key: t.id,
        title: `${t.employee.user.firstName} ${t.employee.user.lastName}`,
        subtitle: `${new Date(t.periodStart).toLocaleDateString('tr-TR')} – ${new Date(t.periodEnd).toLocaleDateString('tr-TR')} · ${t.status}`,
      })}
    />
  );
}
