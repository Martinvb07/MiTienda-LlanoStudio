<div align="center">

# Mi Tienda — Backend

**El servidor que atiende al panel y sirve el contenido de todas las tiendas**

[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-8-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

</div>

---

## ¿Qué es esta parte?

El Backend es el cerebro de la plataforma. Recibe las peticiones —tanto del panel del dueño como de cada tienda pública—, decide de qué cliente son, consulta la base de datos y devuelve la información.

Aquí vive todo lo que no se ve: quién es dueño de qué, cómo se guardan los productos, qué pasa cuando alguien hace un pedido y cómo se procesan las tareas que tardan.

Está construido con **Express** y **TypeScript**, sobre una base de datos **PostgreSQL** administrada con **Prisma**.

---

## Lo primero que hace con cada petición: saber de quién es

Antes de responder nada, el servidor mira por qué dirección entró la petición y decide a qué cliente pertenece:

| Entra por | El servidor entiende |
| --- | --- |
| `mitienda.llanostudio.co` | Es el panel de administración |
| `tunegocio.llanostudio.co` | Es la tienda del cliente con esa etiqueta |
| Cualquier otro dominio | Busca a qué cliente pertenece ese dominio propio |

Si la dirección no corresponde a ninguna tienda, responde que no existe y ahí termina. A partir de ese punto, **toda consulta queda limitada al cliente identificado**: es lo que garantiza que un negocio nunca vea los datos de otro.

Los dominios propios sólo se atienden cuando están verificados. Sin ese paso, cualquiera podría apuntar su dominio a la plataforma y quedarse con la vitrina de otro.

---

## Qué guarda la base de datos

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f3e2.svg" width="20" align="top"> Cliente

La cuenta de quien contrata la plataforma. De aquí cuelga absolutamente todo lo demás. Guarda su nombre, su etiqueta de dirección, el plan contratado y si está activo.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f310.svg" width="20" align="top"> Dominios propios

Los dominios que un cliente conecta a su tienda. Cada uno lleva una marca de verificación, y sólo los verificados reciben tráfico.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f511.svg" width="20" align="top"> Usuarios

Las personas que entran al panel: el dueño y quienes él autorice. Cada una pertenece a un solo cliente y tiene un rol que define qué puede tocar.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f3ea.svg" width="20" align="top"> Tienda

La vitrina pública. Guarda el nombre, el logo, la plantilla elegida, los colores de la marca y —lo más importante— **el diseño armado en el editor**, conservado como la lista ordenada de bloques que el dueño eligió.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f4e6.svg" width="20" align="top"> Productos

El catálogo: nombre, descripción, precio, stock y fotos. Los precios se guardan con precisión exacta, nunca como números aproximados, para que nunca aparezca un centavo de más o de menos.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f4cb.svg" width="20" align="top"> Pedidos

Cada compra, con los datos del comprador, la dirección de envío, el estado y el total. Los pedidos llevan numeración propia por tienda, así que cada negocio ve su pedido #1, #2, #3.

Cada línea del pedido guarda **una copia del nombre y el precio** que tenía el producto en el momento de la venta. Gracias a eso, cambiar el precio mañana o borrar el producto el año que viene no altera lo que ya se vendió.

### <img src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f4b3.svg" width="20" align="top"> Pagos

El registro de cada transacción: con qué pasarela se pagó, en qué estado quedó y con qué referencia. Guarda también la respuesta completa de la pasarela, para poder revisar cualquier reclamo más adelante.

---

## Tareas que no hacen esperar al comprador

Hay trabajo que tarda: optimizar las fotos de un producto, confirmar un pago, generar una factura. Si eso se hiciera mientras alguien espera una respuesta, la tienda se sentiría lenta.

En vez de eso, el servidor **anota la tarea en una fila y responde de inmediato**. Un proceso aparte va tomando las tareas pendientes y resolviéndolas por su cuenta.

| Fila | Para qué |
| --- | --- |
| Imágenes | Optimizar las fotos de producto tras cada carga |
| Pagos | Procesar las confirmaciones que envían las pasarelas |
| Facturas | Generar la facturación electrónica |

Si una tarea falla, se reintenta sola varias veces antes de darse por vencida.

---

## Almacenamiento de fotos

Las fotos y logos no se guardan en el disco del servidor: van a **Cloudflare R2**, un almacenamiento pensado para archivos que se descargan mucho.

Los archivos de cada cliente quedan separados en su propia carpeta, lo que permite borrar todo su contenido de una sola vez si algún día cancela.

---

## Seguridad

- Acceso al panel protegido con credenciales verificadas en cada petición
- Contraseñas guardadas cifradas, nunca en texto legible
- Toda consulta filtrada por el cliente identificado, sin excepción
- Sólo se aceptan peticiones desde direcciones autorizadas
- Los mensajes de error internos nunca se muestran al visitante

---

## Estructura de carpetas

```
backend/
├── src/
│   ├── servidor.ts              → Arranque y apagado ordenado
│   ├── app.ts                   → Ensamblaje de la aplicación
│   │
│   ├── middlewares/
│   │   ├── resolverTenant.ts    → Identifica de qué cliente es la petición
│   │   ├── autenticacion.ts     → Verifica sesión y permisos del panel
│   │   ├── validacion.ts        → Revisa que los datos entrantes sean válidos
│   │   └── manejadorErrores.ts  → Respuesta uniforme ante cualquier fallo
│   │
│   ├── rutas/                   → Direcciones que expone la API
│   ├── controladores/           → Qué responder en cada una
│   ├── servicios/               → Reglas de negocio
│   │
│   ├── colas/                   → Filas de tareas pendientes
│   │   └── trabajadores/        → Proceso que las va resolviendo
│   │
│   ├── almacenamiento/          → Fotos y logos en Cloudflare R2
│   ├── utilidades/              → Herramientas compartidas
│   └── config/                  → Conexiones a base de datos y colas
│
└── prisma/
    ├── schema.prisma            → Definición del modelo de datos
    └── migrations/              → Histórico de cambios del modelo
```

---

## Cambios en el modelo de datos

Los cambios sobre la estructura de la base de datos **no se aplican solos al publicar**. Se revisan y se aplican a mano, con respaldo previo.

Es una decisión deliberada: un cambio mal probado sobre la información de clientes reales no se arregla deshaciendo la publicación.
