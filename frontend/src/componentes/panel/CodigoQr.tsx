'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Printer } from 'lucide-react'
import { BotonPanel } from './ui/basicos'
import { ModalPanel } from './ui/flotantes'

/**
 * Código QR de la tienda, para el mostrador, las bolsas o una tarjeta. Se
 * dibuja aquí mismo (sin servicios externos) y se descarga en PNG grande.
 */
export function ModalCodigoQr({ url, nombre, alCerrar }: { url: string; nombre: string; alCerrar: () => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const [png, setPng] = useState('')

  useEffect(() => {
    if (!lienzo.current) return
    const opciones = { margin: 2, errorCorrectionLevel: 'M' as const, color: { dark: '#000000', light: '#ffffff' } }
    void QRCode.toCanvas(lienzo.current, url, { ...opciones, width: 240 })
    void QRCode.toDataURL(url, { ...opciones, width: 1200 }).then(setPng)
  }, [url])

  function imprimir() {
    const ventana = window.open('', '_blank', 'width=600,height=700')
    if (!ventana) return
    ventana.document.write(
      `<title>${nombre}</title><body style="font-family:system-ui;text-align:center;padding:48px">` +
        `<h1 style="font-weight:600;margin:0 0 8px">${nombre}</h1><p style="color:#555;margin:0 0 24px">Escanea y compra en línea</p>` +
        `<img src="${png}" style="width:320px;height:320px"/><p style="font-family:monospace;margin-top:16px">${url.replace(/^https?:\/\//, '')}</p>` +
        `<script>onload=()=>{print()}</script></body>`,
    )
    ventana.document.close()
  }

  return (
    <ModalPanel titulo="Código QR de tu tienda" descripcion="Al escanearlo con la cámara del celular abre tu tienda." alCerrar={alCerrar}>
      <div className="flex flex-col items-center gap-5">
        <div className="rounded-2xl bg-white p-3">
          <canvas ref={lienzo} className="block h-[240px] w-[240px]" />
        </div>
        <p className="font-mono text-[12.5px] text-sitio-suave">{url.replace(/^https?:\/\//, '')}</p>
        <div className="grid w-full grid-cols-2 gap-2">
          <a
            href={png || undefined}
            download={`qr-${nombre.toLowerCase().replace(/\s+/g, '-')}.png`}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-medium text-black transition-colors hover:bg-[#d9d9d9]"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Descargar PNG
          </a>
          <BotonPanel onClick={imprimir} disabled={!png} className="h-10">
            <Printer aria-hidden="true" className="h-4 w-4" />
            Imprimir
          </BotonPanel>
        </div>
      </div>
    </ModalPanel>
  )
}
