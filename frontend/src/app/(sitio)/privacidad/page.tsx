import type { Metadata } from 'next'
import Link from 'next/link'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Articulo, ProsaLegal } from '@/componentes/sitio/ProsaLegal'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo Mi Sitio trata los datos personales, conforme a la Ley 1581 de 2012 de Colombia.',
  robots: { index: false, follow: true },
}

export default function PaginaPrivacidad() {
  return (
    <>
      <CabeceraPagina
        rotulo="Legal"
        titulo="Política de privacidad"
        descripcion="Qué datos recogemos, para qué los usamos y qué puedes exigirnos sobre ellos."
      />

      <ProsaLegal actualizado="26 de julio de 2026">
        <Articulo numero="1." titulo="Responsable del tratamiento">
          <p>
            Llano Studio, domiciliado en Colombia, es el responsable del tratamiento de los datos
            recogidos a través de Mi Sitio. Esta política se rige por la Ley 1581 de 2012 y sus
            normas reglamentarias.
          </p>
        </Articulo>

        <Articulo numero="2." titulo="Qué datos recogemos">
          <p>De quien abre una cuenta:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>nombre y correo electrónico;</li>
            <li>contraseña, siempre guardada cifrada y nunca legible para nosotros;</li>
            <li>datos de la tienda: nombre, dominio, productos y configuración;</li>
            <li>datos de facturación, si contratas un plan pago.</li>
          </ul>
          <p>
            También registramos datos técnicos de uso —dirección IP, navegador, páginas
            visitadas— para operar y proteger el servicio.
          </p>
        </Articulo>

        <Articulo numero="3." titulo="Para qué los usamos">
          <ul className="ml-5 list-disc space-y-1.5">
            <li>prestarte el servicio y mantener tu tienda en línea;</li>
            <li>cobrarte el plan que hayas contratado;</li>
            <li>responderte cuando nos escribes;</li>
            <li>detectar fraudes y abusos;</li>
            <li>cumplir obligaciones legales.</li>
          </ul>
          <p>No vendemos datos personales a terceros. Nunca.</p>
        </Articulo>

        <Articulo numero="4." titulo="Los datos de tus compradores">
          <p>
            Cuando alguien compra en una tienda de la plataforma, sus datos son responsabilidad
            de quien administra esa tienda. Nosotros actuamos como encargados: los almacenamos y
            los procesamos por cuenta suya, siguiendo sus instrucciones.
          </p>
          <p>
            Si eres dueño de una tienda, eres tú quien debe informar a tus clientes cómo tratas
            sus datos y obtener su autorización.
          </p>
        </Articulo>

        <Articulo numero="5." titulo="Con quién los compartimos">
          <p>
            Sólo con proveedores necesarios para operar, y únicamente con lo que cada uno
            necesita: el proveedor de la infraestructura donde corre la plataforma, el
            almacenamiento de imágenes y las pasarelas de pago que proceses.
          </p>
          <p>
            Cada uno trata los datos bajo sus propias condiciones, que te recomendamos revisar.
          </p>
        </Articulo>

        <Articulo numero="6." titulo="Cuánto tiempo los guardamos">
          <p>
            Mientras tengas la cuenta activa y, después de cerrarla, el tiempo que exijan las
            obligaciones legales y contables. Pasado ese plazo se eliminan o se anonimizan.
          </p>
        </Articulo>

        <Articulo numero="7." titulo="Tus derechos">
          <p>Como titular de tus datos puedes en cualquier momento:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>saber qué datos tuyos tenemos y de dónde salieron;</li>
            <li>corregirlos si están mal o incompletos;</li>
            <li>pedir que los eliminemos, cuando no exista un deber legal de conservarlos;</li>
            <li>revocar la autorización que nos diste;</li>
            <li>presentar una queja ante la Superintendencia de Industria y Comercio.</li>
          </ul>
          <p>
            Para ejercerlos, escríbenos desde la{' '}
            <Link href="/contacto" className="text-sitio-azul underline underline-offset-4">
              página de contacto
            </Link>
            . Respondemos dentro de los plazos que fija la ley.
          </p>
        </Articulo>

        <Articulo numero="8." titulo="Cookies">
          <p>
            Usamos las cookies imprescindibles para mantener tu sesión abierta en el panel. No
            usamos cookies publicitarias ni de seguimiento entre sitios.
          </p>
        </Articulo>

        <Articulo numero="9." titulo="Seguridad">
          <p>
            Las contraseñas se guardan cifradas, el tráfico viaja por conexión segura y los datos
            de cada tienda están aislados de los de las demás. Ningún sistema es infalible, pero
            trabajamos para que el riesgo sea el mínimo razonable.
          </p>
        </Articulo>

        <Articulo numero="10." titulo="Cambios en esta política">
          <p>
            Si la modificamos, publicamos la nueva versión aquí con su fecha. Si el cambio es
            relevante, te avisamos por correo.
          </p>
        </Articulo>
      </ProsaLegal>
    </>
  )
}
