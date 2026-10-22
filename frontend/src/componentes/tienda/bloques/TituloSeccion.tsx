/** Título y bajada comunes a las secciones nuevas. */
export function TituloSeccion({
  titulo,
  subtitulo,
  centrado = true,
}: {
  titulo?: string
  subtitulo?: string
  centrado?: boolean
}) {
  if (!titulo && !subtitulo) return null
  return (
    <div className={`mb-10 ${centrado ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {titulo && <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">{titulo}</h2>}
      {subtitulo && <p className="mt-3 text-lg text-pretty text-tinta/70">{subtitulo}</p>}
    </div>
  )
}
