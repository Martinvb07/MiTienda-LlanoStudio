import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Une clases condicionales resolviendo los conflictos de Tailwind. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas))
}
