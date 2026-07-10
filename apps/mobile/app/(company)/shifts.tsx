import { SimpleListScreen } from '../../components/simple-list-screen';

export default function CompanyShiftsScreen() {
  return (
    <SimpleListScreen<{ id: string; name: string; startTime: string; endTime: string }>
      title="Vardiyalar"
      endpoint="/shifts/templates"
      renderItem={(s) => ({ key: s.id, title: s.name, subtitle: `${s.startTime} – ${s.endTime}` })}
    />
  );
}
