import { Text } from 'react-native';
import { Card } from './ui';
import { ScreenScroll, screen } from './screen';
import { useApiList } from '../lib/queries';

type Props<T> = {
  title: string;
  endpoint: string;
  renderItem: (item: T) => { key: string; title: string; subtitle?: string };
  empty?: string;
  /** Otomatik yenileme aralığı (ms). Web ile uyum için varsayılan 30s */
  refetchInterval?: number;
};

export function SimpleListScreen<T>({
  title,
  endpoint,
  renderItem,
  empty = 'Kayıt yok',
  refetchInterval = 30_000,
}: Props<T>) {
  const { data: items = [], isFetching, refetch } = useApiList<T>(endpoint, refetchInterval);

  return (
    <ScreenScroll refreshing={isFetching} onRefresh={refetch}>
      <Text style={screen.title}>{title}</Text>
      {items.map((item) => {
        const row = renderItem(item);
        return (
          <Card key={row.key} style={screen.row}>
            <Text style={{ fontWeight: '600' }}>{row.title}</Text>
            {row.subtitle ? <Text style={screen.muted}>{row.subtitle}</Text> : null}
          </Card>
        );
      })}
      {!items.length && <Text style={screen.empty}>{empty}</Text>}
    </ScreenScroll>
  );
}
