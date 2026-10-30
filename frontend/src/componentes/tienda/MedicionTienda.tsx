import Script from 'next/script'

interface Props {
  pixelMeta?: string
  googleAnalytics?: string
}

/**
 * Carga el pixel de Meta y Google Analytics que la tienda configuró en su panel.
 * Los IDs llegan validados por la API (sólo números / G-XXXX), así que se
 * pueden meter en el script sin riesgo de inyección.
 */
export function MedicionTienda({ pixelMeta, googleAnalytics }: Props) {
  const pixel = pixelMeta && /^\d{5,20}$/.test(pixelMeta) ? pixelMeta : null
  const analytics = googleAnalytics && /^G-[A-Z0-9]{4,16}$/.test(googleAnalytics) ? googleAnalytics : null

  return (
    <>
      {pixel && (
        <Script id="pixel-meta" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
      {analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${analytics}');`}
          </Script>
        </>
      )}
    </>
  )
}
