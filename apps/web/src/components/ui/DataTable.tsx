import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  loading?: boolean;
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  className?: string;
  skeletonRows?: number;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  data,
  loading,
  rowKey,
  onRowClick,
  emptyTitle = 'Kayıt yok',
  emptyDescription = 'Görüntülenecek veri bulunamadı.',
  emptyIcon,
  className,
  skeletonRows = 6,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="skeleton h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      {emptyIcon ?? <Inbox className="h-6 w-6" />}
                    </div>
                    <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/60',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-4 py-3.5 text-foreground/80',
                        alignClass[col.align ?? 'left'],
                        col.className,
                      )}
                    >
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
