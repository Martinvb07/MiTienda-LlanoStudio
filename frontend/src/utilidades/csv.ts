/**
 * Descarga una tabla como CSV que Excel abre bien en español: con BOM para
 * que respete tildes y eñes, y cada celda entre comillas.
 */
export function descargarCsv(nombre: string, filas: (string | number)[][]): void {
  const csv = filas.map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(',')).join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
