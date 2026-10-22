import type { PropsEspaciador } from '@/tipos/bloques'

const ALTOS = { chico: 'py-4', medio: 'py-10', grande: 'py-20' } as const

export function Espaciador({ alto = 'medio', linea = false }: PropsEspaciador) {
  return (
    <div aria-hidden="true" className={`mx-auto max-w-6xl px-6 ${ALTOS[alto]}`}>
      {linea && <hr className="border-tinta/15" />}
    </div>
  )
}
