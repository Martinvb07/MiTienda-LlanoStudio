interface Props {
  rotulo: string
  titulo: string
  descripcion?: string
  children?: React.ReactNode
}

/**
 * Encabezado de las páginas interiores, como en llanostudio.co: titular
 * centrado y enorme sobre negro, que entra con la animación lenta de subida.
 */
export function CabeceraPagina({ rotulo, titulo, descripcion, children }: Props) {
  return (
    <section className="relative px-5 pt-[140px] text-center md:pt-[190px]">
      <div className="entrada mx-auto flex max-w-4xl flex-col items-center">
        <span className="antetitulo mb-[22px]">{rotulo}</span>
        <h1 className="titulo-1 !text-[clamp(40px,6vw,84px)]">{titulo}</h1>
        {descripcion && <p className="bajada mx-auto mt-[18px] !text-base">{descripcion}</p>}
        {children && <div className="mt-[34px] flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  )
}
