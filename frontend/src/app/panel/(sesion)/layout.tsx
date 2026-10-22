import { MarcoSesion } from '@/componentes/panel/MarcoSesion'

/**
 * Marco de las pantallas de sesión: pantalla partida, con una tienda real a
 * un lado y el formulario al otro, como las pantallas de entrada de los
 * productos grandes. Siempre con salida de vuelta al inicio.
 */
export default function LayoutSesion({ children }: { children: React.ReactNode }) {
  return <MarcoSesion>{children}</MarcoSesion>
}
