<div align="center">

# Mi Tienda — Frontend

**Todo lo que se ve: el panel del dueño y la tienda que visita el comprador**

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![dnd kit](https://img.shields.io/badge/dnd_kit-6C47FF?style=for-the-badge&logoColor=white)](https://dndkit.com/)

</div>

---

## ¿Qué es esta parte?

El Frontend son las dos caras visibles de la plataforma:

- **El panel**, donde el dueño arma su tienda, carga productos y revisa sus ventas.
- **Las tiendas públicas**, que es lo que ve cualquiera que entre a comprar.

Las dos viven en el mismo lugar, y lo que decide cuál mostrar es la dirección por la que entra cada visitante.

---

## Una misma aplicación, dos caras

Al llegar una visita, lo primero que ocurre es reconocer por dónde entró:

| Entra por | Ve |
| --- | --- |
| `mitienda.llanostudio.co` | El panel de administración |
| `tunegocio.llanostudio.co` | La tienda de ese cliente |
| `www.tudominio.com` | La misma tienda, en su dominio propio |

El comprador nunca nota nada de esto: escribe la dirección de la tienda y ve la tienda. La dirección que aparece en el navegador es siempre la suya, limpia.

---

## Por qué las tiendas aparecen en Google

Las páginas de cada tienda **se arman en el servidor antes de enviarse**, no en el navegador del visitante. Cuando Google entra a una tienda, recibe el contenido completo: los productos, los precios, las descripciones.

Además, cada página ya llega armada y guardada, así que carga de inmediato aunque el visitante tenga mala señal. Se refresca sola cuando hay cambios.

Cada tienda declara su dirección oficial, para que Google no la indexe dos veces por caminos distintos. El panel, en cambio, pide explícitamente no ser indexado: no tiene nada que hacer en los buscadores.

---

## El editor de diseño

El corazón del panel. El dueño arma su página moviendo bloques con el mouse:

| Bloque | Qué muestra |
| --- | --- |
| **Portada** | Título grande, subtítulo, imagen de fondo y botón |
| **Grilla de productos** | El catálogo, en 2, 3 o 4 columnas |
| **Texto** | Un párrafo libre: sobre el negocio, envíos, lo que sea |
| **Pie de página** | Cierre de la tienda y enlaces a redes |

Sobre cada bloque se puede: **reordenar** arrastrándolo, **ocultar** sin borrarlo y **quitar** definitivamente.

Lo que se guarda es la lista de bloques y su orden, no una página terminada. Por eso cambiar de plantilla no borra el contenido.

El editor también funciona con teclado, no sólo con el mouse.

---

## Pantallas del panel

| Pantalla | Qué hace |
| --- | --- |
| **Resumen** | Vista general del negocio: ventas, pedidos y visitas |
| **Productos** | Catálogo: agregar, editar y dar de baja |
| **Diseño** | El editor de bloques de la tienda |
| **Configuración** | Datos del negocio, dominio, colores y pagos |
| **Ingresar** | Acceso del dueño y su equipo |

---

## Pantallas de la tienda

| Pantalla | Qué muestra |
| --- | --- |
| **Portada** | Los bloques que el dueño armó en el editor |
| **Ficha de producto** | Foto, precio, descripción y botón de compra |
| **Tienda no encontrada** | Aviso para dominios sin tienda publicada |

---

## Cada tienda con su propia cara

Los colores y la tipografía que el dueño elige se aplican a toda su tienda: botones, títulos, bordes.

No hay una hoja de estilos por cliente ni una versión distinta de la aplicación: el mismo código sirve a todas las tiendas y se adapta a la identidad de cada una al momento de mostrarla.

Los precios se muestran siempre en formato colombiano —`$ 45.900`—, sin decimales, como se leen acá.

---

## Tecnologías

| Tecnología | Para qué se usa |
| --- | --- |
| **Next.js 15** | Arma las páginas en el servidor y las mantiene listas para cargar rápido |
| **React 19** | Construcción de toda la interfaz |
| **Tailwind CSS 4** | Estilos y adaptación visual a la marca de cada tienda |
| **dnd kit** | El arrastrar y soltar del editor de diseño |
| **TypeScript** | Tipado estático y seguridad en el código |

---

## Estructura de carpetas

```
frontend/
├── public/                          → Imágenes y archivos públicos
│
└── src/
    ├── middleware.ts                → Decide qué mostrar según el dominio
    │
    ├── app/
    │   ├── layout.tsx               → Marco común de toda la aplicación
    │   ├── panel/                   → Sección del dueño de la tienda
    │   │   ├── page.tsx             → Resumen del negocio
    │   │   ├── productos/           → Catálogo
    │   │   ├── plantillas/          → Editor de diseño
    │   │   ├── configuracion/       → Ajustes de la tienda
    │   │   └── ingresar/            → Acceso al panel
    │   │
    │   ├── (tienda)/                → La tienda que ve el comprador
    │   │   └── [subdominio]/
    │   │       ├── page.tsx         → Portada armada con los bloques
    │   │       └── productos/       → Ficha de cada producto
    │   │
    │   └── tienda-no-encontrada/    → Aviso para dominios sin tienda
    │
    ├── componentes/
    │   ├── panel/                   → Editor de bloques y navegación
    │   ├── tienda/                  → Los bloques que ve el comprador
    │   │   └── bloques/             → Portada, grilla, texto y pie
    │   └── comunes/                 → Piezas compartidas
    │
    ├── hooks/                       → Comportamiento reutilizable del editor
    ├── servicios/                   → Comunicación con el servidor
    ├── tipos/                       → Definición de los bloques y entidades
    └── utilidades/                  → Formato de precios y direcciones
```
