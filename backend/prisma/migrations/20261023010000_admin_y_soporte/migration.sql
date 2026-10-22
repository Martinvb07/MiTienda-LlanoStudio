-- CreateEnum
CREATE TYPE "RolAdmin" AS ENUM ('DUENO', 'SOPORTE', 'LECTURA');

-- CreateEnum
CREATE TYPE "TipoAnuncio" AS ENUM ('CAMPANA', 'BARRA');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('ABIERTO', 'EN_CURSO', 'RESUELTO');

-- CreateEnum
CREATE TYPE "OrigenTicket" AS ENUM ('LANDING', 'PANEL');

-- CreateEnum
CREATE TYPE "AutorMensaje" AS ENUM ('CLIENTE', 'ASESOR', 'SISTEMA');

-- AlterTable
ALTER TABLE "pagos_suscripcion" ADD COLUMN     "cuponCodigo" TEXT,
ADD COLUMN     "montoOriginal" INTEGER;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "codigoReferido" TEXT,
ADD COLUMN     "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "novedadesVistasEn" TIMESTAMP(3),
ADD COLUMN     "origen" TEXT,
ADD COLUMN     "referidoPorId" TEXT;

-- CreateTable
CREATE TABLE "admins_plataforma" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "rol" "RolAdmin" NOT NULL DEFAULT 'SOPORTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAccesoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad_admin" (
    "id" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "tenantId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividad_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_tienda" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_planes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planAnterior" "PlanTenant" NOT NULL,
    "planNuevo" "PlanTenant" NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalle" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupones_suscripcion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "planes" "PlanTenant"[] DEFAULT ARRAY[]::"PlanTenant"[],
    "usosMaximos" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "venceEn" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupones_suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anuncios" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "tipo" "TipoAnuncio" NOT NULL DEFAULT 'CAMPANA',
    "planes" "PlanTenant"[] DEFAULT ARRAY[]::"PlanTenant"[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedades" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "etiqueta" TEXT,
    "publicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdominios_bloqueados" (
    "subdominio" TEXT NOT NULL,
    "motivo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdominios_bloqueados_pkey" PRIMARY KEY ("subdominio")
);

-- CreateTable
CREATE TABLE "configuracion_plataforma" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_plataforma_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "articulos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "portada" TEXT NOT NULL,
    "minutos" INTEGER NOT NULL DEFAULT 4,
    "secciones" JSONB NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correos_enviados" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correos_enviados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_soporte" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "origen" "OrigenTicket" NOT NULL,
    "tenantId" TEXT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "asunto" TEXT,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'ABIERTO',
    "asignadoA" TEXT,
    "tokenVisitante" TEXT NOT NULL,
    "calificacion" INTEGER,
    "noLeidosAsesor" INTEGER NOT NULL DEFAULT 0,
    "noLeidosCliente" INTEGER NOT NULL DEFAULT 0,
    "ultimoMensajeEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_soporte" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autor" "AutorMensaje" NOT NULL,
    "nombreAutor" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_plataforma_email_key" ON "admins_plataforma"("email");

-- CreateIndex
CREATE INDEX "actividad_admin_creadoEn_idx" ON "actividad_admin"("creadoEn");

-- CreateIndex
CREATE INDEX "actividad_admin_tenantId_idx" ON "actividad_admin"("tenantId");

-- CreateIndex
CREATE INDEX "notas_tienda_tenantId_creadoEn_idx" ON "notas_tienda"("tenantId", "creadoEn");

-- CreateIndex
CREATE INDEX "historial_planes_tenantId_creadoEn_idx" ON "historial_planes"("tenantId", "creadoEn");

-- CreateIndex
CREATE INDEX "historial_planes_creadoEn_idx" ON "historial_planes"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "cupones_suscripcion_codigo_key" ON "cupones_suscripcion"("codigo");

-- CreateIndex
CREATE INDEX "anuncios_activo_desde_idx" ON "anuncios"("activo", "desde");

-- CreateIndex
CREATE INDEX "novedades_publicadaEn_idx" ON "novedades"("publicadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "articulos_slug_key" ON "articulos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "correos_enviados_tenantId_tipo_clave_key" ON "correos_enviados"("tenantId", "tipo", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_soporte_numero_key" ON "tickets_soporte"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_soporte_tokenVisitante_key" ON "tickets_soporte"("tokenVisitante");

-- CreateIndex
CREATE INDEX "tickets_soporte_estado_ultimoMensajeEn_idx" ON "tickets_soporte"("estado", "ultimoMensajeEn");

-- CreateIndex
CREATE INDEX "tickets_soporte_tenantId_idx" ON "tickets_soporte"("tenantId");

-- CreateIndex
CREATE INDEX "mensajes_soporte_ticketId_creadoEn_idx" ON "mensajes_soporte"("ticketId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_codigoReferido_key" ON "tenants"("codigoReferido");

-- AddForeignKey
ALTER TABLE "notas_tienda" ADD CONSTRAINT "notas_tienda_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_planes" ADD CONSTRAINT "historial_planes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_soporte" ADD CONSTRAINT "mensajes_soporte_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets_soporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

