import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-gray-900 dark:text-gray-100', className)}
      {...props}
    />
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function TableEmpty({ icon, title, description }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={100} className="h-32 text-center">
        <div className="flex flex-col items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <p className="font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {description && (
            <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
