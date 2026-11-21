import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

type DateLike = Date | Timestamp;

export function toDate(value: DateLike): Date {
  return value instanceof Date ? value : value.toDate();
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatShortDate(value: DateLike): string {
  return format(toDate(value), 'dd MMM yyyy');
}

export function formatListDate(value: DateLike): string {
  return format(toDate(value), 'EEE, dd MMM');
}
