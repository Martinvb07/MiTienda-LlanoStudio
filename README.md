# MiTienda — Llano Studio

Plataforma SaaS multi-tenant de e-commerce. Cada cliente crea su tienda en línea
sin escribir código, la diseña arrastrando bloques y la publica en su propio
subdominio o dominio propio.

> Estado: **estructura base**. Está el esqueleto, el modelo de datos, la
> resolución de tenant por dominio, las colas y los pipelines de CI/CD.
> No hay todavía pagos, facturación ni autenticación.

---

## Stack

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router) | SSR/ISR real, para que las tiendas indexen en Google |
| Estilos | Tailwind CSS 4 | Tematización por tienda con variables CSS y un solo build |
| Drag & drop | dnd-kit | Editor visual de bloques del panel |
| Backend | Node.js 22 + Express 5 | API REST separada del frontend |
| ORM | Prisma 7 | Tipado fuerte y migraciones controladas |
| Base de datos | PostgreSQL | Integridad referencial y aislamiento por fila |
| Colas | Redis + BullMQ | Trabajo pesado fuera del request del usuario |
| Archivos | Cloudflare R2 | Compatible con S3, sin costo de egreso |
| Despliegue | GitHub Actions + SSH + PM2 | Sin Docker, directo al VPS |

Pagos con **Wompi y PSE** están modelados en la base de datos pero sin
implementar: llegan en una fase posterior.

---

## Estructura

```
mitienda/
├── frontend/                  Next.js 15
│   └── src/
│       ├── app/
│       │   ├── panel/          panel de administración
│       │   └── (tienda)/       tiendas públicas de los clientes
│       ├── componentes/        panel · tienda · comunes
│       ├── hooks/
│       ├── servicios/          llamadas a la API
│       ├── tipos/              contrato de bloques y entidades
│       ├── utilidades/
│       └── middleware.ts       resolución de tenant por Host
│
├── backend/                   Express + Prisma
│   ├── src/
│   │   ├── rutas/
│   │   ├── controladores/
│   │   ├── servicios/
│   │   ├── colas/              BullMQ + trabajadores
│   │   ├── almacenamiento/     Cloudflare R2
│   │   ├── middlewares/        auth · tenant · validación · errores
│   │   ├── utilidades/
│   │   └── config/
│   └── prisma/schema.prisma
│
├── .github/workflows/         ci.yml · deploy.yml
└── ecosystem.config.cjs       procesos de PM2
```

---

## Puesta en marcha

Necesitas Node 22+, PostgreSQL y Redis corriendo en local.

```bash
# Backend
cd backend
cp .env.ejemplo .env          # completa DATABASE_URL, REDIS_URL y los secretos
npm install
npx prisma migrate dev --name inicial
npm run dev                   # API en http://localhost:4000

# Trabajadores de las colas (otra terminal)
npm run dev:trabajadores

# Frontend (otra terminal)
cd frontend
cp .env.ejemplo .env.local
npm install
npm run dev                   # http://localhost:3000
```

`JWT_SECRETO` y `TOKEN_INTERNO` deben tener valores reales; el arranque falla si
no. Genera uno con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`TOKEN_INTERNO` (backend) y `MITIENDA_TOKEN_INTERNO` (frontend) tienen que
coincidir.

### Probar el multi-tenant en local

Los navegadores resuelven `*.localhost` sin tocar el archivo hosts:

| URL | Qué sale |
| --- | --- |
| `http://localhost:3000` | panel |
| `http://mitienda.localhost:3000` | panel |
| `http://ropa.localhost:3000` | tienda con subdominio `ropa` |

---

## Cómo funciona el multi-tenant

Un solo despliegue sirve a todos los clientes. Lo que cambia es el dominio de
entrada.

```
mitienda.llanostudio.co   → panel de administración
ropa.llanostudio.co       → se busca la Tienda con subdominio "ropa"
www.miropa.com            → se busca en la tabla de dominios propios
```

La lógica vive dos veces, a propósito:

- **Backend** — [`src/middlewares/resolverTenant.ts`](backend/src/middlewares/resolverTenant.ts)
  deja el tenant en `req.tenant`.
- **Frontend** — [`src/middleware.ts`](frontend/src/middleware.ts) reescribe la
  ruta según el dominio.

Las reglas puras están en `utilidades/dominios.ts` de cada lado. **Si cambias
una, cambia la otra**; hay tests en el backend que las fijan. No se comparten
porque el middleware de Next corre en el runtime edge y no puede importar del
paquete del backend.

### Por qué el frontend reescribe la ruta

El middleware convierte `ropa.llanostudio.co/productos/x` en
`/ropa/productos/x` internamente. La URL que ve el visitante no cambia.

Se hace así, y no resolviendo el tenant por header, porque leer `headers()` en
un layout vuelve dinámica toda la rama y se pierde el ISR — justo lo que hace
que las tiendas carguen rápido e indexen bien. Con el identificador en la ruta,
cada tienda tiene su propia entrada en la caché.

Para dominios propios el identificador es el host completo (`www.miropa.com`);
como lleva puntos, se distingue de una etiqueta de subdominio.

### Aislamiento

Base de datos y esquema únicos, separación por fila. Todo cuelga de un `Tenant`,
directamente o vía su `Tienda`. **Toda consulta debe filtrar por el tenant
resuelto**, nunca por un id que venga del cliente — para eso está
`exigirMismoTenant` en el middleware de autenticación.

---

## Modelo de datos

```
Tenant ──1:1── Tienda ──1:N── Producto
  │                │
  ├──1:N── Usuario └──1:N── Pedido ──1:N── ItemPedido
  │                              └──1:1── Pago
  └──1:N── DominioPropio
```

Dos decisiones que se apartan de lo escrito en el planteamiento inicial:

- **`DominioPropio` es una tabla, no un campo de `Tenant`.** El middleware
  necesita buscar por dominio, y así un tenant puede tener varios y marcarlos
  como verificados. Sólo se sirve tráfico de dominios verificados: si no,
  cualquiera podría apuntar su DNS a la plataforma y quedarse con un escaparate
  ajeno.
- **`Pedido.productos[]` es `ItemPedido`.** Una tabla intermedia guarda cantidad
  y una instantánea de nombre y precio, para que editar o borrar un producto no
  altere el histórico de ventas.

Los importes son `Decimal(12,2)` y viajan por la API como texto, nunca como
número en coma flotante.

---

## Constructor de bloques

El diseño de cada tienda se guarda como JSON en `Tienda.configuracionBloques`,
**nunca como HTML generado**. Así cambiar de plantilla no pierde el contenido.

```jsonc
[
  { "id": "hero-1", "tipo": "hero", "props": { "titulo": "Mi tienda" } },
  { "id": "grid-1", "tipo": "grilla-productos", "props": { "columnas": 3 } },
  { "id": "pie-1",  "tipo": "pie",  "props": { "mostrarRedes": true } }
]
```

- Contrato: [`frontend/src/tipos/bloques.ts`](frontend/src/tipos/bloques.ts)
- Editor (dnd-kit): [`componentes/panel/EditorBloques.tsx`](frontend/src/componentes/panel/EditorBloques.tsx)
- Render público: [`componentes/tienda/RenderizadorBloques.tsx`](frontend/src/componentes/tienda/RenderizadorBloques.tsx)

Para añadir un tipo de bloque: define sus props en `tipos/bloques.ts`, crea el
componente en `componentes/tienda/bloques/` y añádelo al `switch` del
renderizador.

---

## Colas

La API encola y responde enseguida; el trabajo pesado lo hace un proceso aparte
(`mitienda-trabajadores` en PM2), para que una tanda de imágenes no bloquee a
los compradores.

```
backend/src/colas/
├── definiciones.ts             nombres y contratos de los trabajos
├── index.ts                    productores
└── trabajadores/
    ├── index.ts                entrada del proceso de workers
    └── imagenes.trabajador.ts  optimización de fotos
```

El trabajador de imágenes está **cableado pero vacío**: consume la cola,
reintenta y apaga limpio, pero no procesa todavía. Para terminarlo:
`npm i sharp`, descargar de R2, generar variantes, subirlas y actualizar
`Producto.fotos`. Los pasos están comentados en el archivo.

---

## Almacenamiento (Cloudflare R2)

Cliente y configuración listos en
[`backend/src/almacenamiento/r2.ts`](backend/src/almacenamiento/r2.ts); las
operaciones (`crearUrlSubidaFirmada`, `subirObjeto`, `eliminarObjeto`) están
declaradas pero **sin implementar** — rechazan con un error explícito.

El plan es no proxear archivos por la API: el panel pide una URL firmada, el
navegador sube directo a R2 y luego avisa al backend, que encola la
optimización. Las claves van siempre prefijadas por tenant
(`tenants/<id>/tiendas/<id>/…`).

---

## CI/CD

**`ci.yml`** — en cada push y PR, para backend y frontend: instalar, lint,
verificación de tipos, tests y build.

**`deploy.yml`** — al hacer merge a `main`: construye en el runner, sincroniza
con `rsync`, instala dependencias de producción en el VPS y hace `pm2 reload`
(cero downtime). Termina comprobando que la API responde.

### Migraciones: paso manual, a propósito

El despliegue **no** ejecuta `prisma migrate deploy`. Una migración mal probada
sobre datos de tenants reales no se arregla revirtiendo el despliegue. Cuando
una migración esté revisada:

```bash
ssh usuario@vps
cd /ruta/despliegue/backend
npx prisma migrate status
pg_dump ... > respaldo.sql
npx prisma migrate deploy
```

Para cambios que rompen compatibilidad: primero desplegar código que tolere
ambos esquemas, luego migrar, y al final limpiar.

### Secretos y variables del repositorio

En *Settings → Secrets and variables → Actions*:

| Secreto | Para qué |
| --- | --- |
| `SSH_HOST` | IP o dominio del VPS |
| `SSH_USUARIO` | usuario de despliegue |
| `SSH_LLAVE_PRIVADA` | clave privada (formato OpenSSH completo) |
| `SSH_PUERTO` | opcional, por defecto 22 |
| `RUTA_DESPLIEGUE` | ruta absoluta en el VPS |

| Variable | Para qué |
| --- | --- |
| `DOMINIO_BASE` | `llanostudio.co` |
| `SUBDOMINIO_PANEL` | `mitienda` |
| `URL_API` | URL interna de la API, p. ej. `http://127.0.0.1:4000` |

Los `.env` viven sólo en el VPS; `rsync` los excluye explícitamente.

---

## Comandos

```bash
# backend
npm run dev                 # API con recarga
npm run dev:trabajadores    # proceso de colas
npm run lint
npm run typecheck
npm test
npm run build
npm run prisma:migrar
npm run prisma:estudio

# frontend
npm run dev
npm run lint
npm run typecheck
npm run build
```

---

## Notas del código

- **Todo en español** salvo lo que impone una API externa: los hooks de React
  llevan prefijo `use` (`useEditorBloques`) porque la regla `rules-of-hooks` lo
  exige, y los campos de librerías (`params`, `props`) conservan su nombre.
- **Prisma 7** ya no admite `url` en `schema.prisma`: la cadena de conexión está
  en [`prisma.config.ts`](backend/prisma.config.ts) para el CLI y llega al
  runtime por driver adapter en [`config/prisma.ts`](backend/src/config/prisma.ts).
- El cliente de Prisma se genera en `backend/src/generado/` y **no se versiona**;
  el despliegue lo regenera en el servidor.
- La API resuelve el tenant por `Host`. Como en SSR la llamada es servidor a
  servidor, Next manda el Host original en `x-mitienda-host`, y el backend sólo
  le hace caso si viene acompañado del token interno.

---

## Siguientes pasos

1. Autenticación del panel con NextAuth/Auth.js sobre el modelo `Usuario`
2. CRUD de productos y subida de fotos a R2 (cerrando el trabajador de imágenes)
3. Guardado del editor de bloques contra la API
4. Carrito y checkout
5. Pagos con Wompi y PSE, y facturación DIAN por cola
