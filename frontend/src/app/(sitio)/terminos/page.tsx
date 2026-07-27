import type { Metadata } from 'next'
import Link from 'next/link'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Articulo, ProsaLegal } from '@/componentes/sitio/ProsaLegal'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso de la plataforma Mi Tienda, de Llano Studio.',
  robots: { index: false, follow: true },
}

export default function PaginaTerminos() {
  return (
    <>
      <CabeceraPagina
        rotulo="Legal"
        titulo="Términos y condiciones"
        descripcion="Las reglas de uso de Mi Tienda. Escritas para que se entiendan sin ser abogado."
      />

      <ProsaLegal actualizado="26 de julio de 2026">
        <Articulo numero="1." titulo="Quiénes somos">
          <p>
            Mi Tienda es una plataforma operada por Llano Studio, con domicilio en Colombia. Al
            crear una cuenta aceptás estas condiciones.
          </p>
        </Articulo>

        <Articulo numero="2." titulo="Qué ofrecemos">
          <p>
            Un servicio para crear, publicar y administrar tiendas en línea. Damos las
            herramientas y la infraestructura; el negocio que se monte encima es tuyo y lo
            gestionás vos.
          </p>
        </Articulo>

        <Articulo numero="3." titulo="Tu cuenta">
          <p>
            Sos responsable de la información que registrás y de mantener tu contraseña a salvo.
            Todo lo que ocurra desde tu cuenta se considera hecho por vos.
          </p>
          <p>Para abrir una cuenta tenés que ser mayor de edad o contar con autorización.</p>
        </Articulo>

        <Articulo numero="4." titulo="Lo que publicás es tuyo">
          <p>
            Los productos, textos, fotos y datos que cargues siguen siendo de tu propiedad. No
            los usamos para nada distinto de prestarte el servicio.
          </p>
          <p>
            A la vez, sos responsable de tener derecho sobre lo que publicás y de que cumpla la
            ley colombiana.
          </p>
        </Articulo>

        <Articulo numero="5." titulo="Uso aceptable">
          <p>No se puede usar la plataforma para:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>vender productos o servicios prohibidos por la ley;</li>
            <li>suplantar a otra persona, marca o empresa;</li>
            <li>publicar contenido que infrinja derechos de terceros;</li>
            <li>intentar vulnerar la seguridad de la plataforma o de otras tiendas;</li>
            <li>enviar comunicaciones masivas no solicitadas.</li>
          </ul>
        </Articulo>

        <Articulo numero="6." titulo="Planes y pagos">
          <p>
            El plan Gratis no tiene costo ni vencimiento. Los planes pagos se cobran por
            adelantado en el periodo contratado y podés cambiarlos o cancelarlos cuando quieras;
            la cancelación surte efecto al terminar el periodo ya pagado.
          </p>
          <p>
            No cobramos comisión sobre tus ventas. Las tarifas de las pasarelas de pago las cobra
            cada proveedor directamente y no forman parte de nuestros planes.
          </p>
        </Articulo>

        <Articulo numero="7." titulo="Suspensión y cierre">
          <p>
            Podemos suspender una cuenta que incumpla estas condiciones, avisando salvo que la
            gravedad del caso lo impida. Vos podés cerrar la tuya en cualquier momento.
          </p>
          <p>
            Al cerrarse una cuenta conservamos los datos un tiempo prudencial por si querés
            recuperarlos, y después los eliminamos.
          </p>
        </Articulo>

        <Articulo numero="8." titulo="Disponibilidad">
          <p>
            Trabajamos para que el servicio esté siempre en línea, pero no podemos garantizar que
            nunca se interrumpa. Puede haber mantenimientos programados y fallas ajenas a
            nosotros.
          </p>
          <p>
            No respondemos por lucro cesante ni por daños indirectos derivados de una
            interrupción del servicio.
          </p>
        </Articulo>

        <Articulo numero="9." titulo="Cambios en estas condiciones">
          <p>
            Si cambiamos algo relevante te avisamos con antelación razonable. Seguir usando la
            plataforma después de un cambio significa que lo aceptás.
          </p>
        </Articulo>

        <Articulo numero="10." titulo="Ley aplicable">
          <p>
            Estas condiciones se rigen por la ley colombiana. Cualquier controversia se somete a
            los jueces competentes de Colombia.
          </p>
        </Articulo>

        <Articulo numero="11." titulo="Contacto">
          <p>
            Para cualquier duda sobre estos términos, escribinos desde la{' '}
            <Link href="/contacto" className="text-sitio-azul underline underline-offset-4">
              página de contacto
            </Link>
            .
          </p>
        </Articulo>
      </ProsaLegal>
    </>
  )
}
