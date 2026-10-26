-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "precio" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "notas" TEXT,
    "notaInterna" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PENDIENTE',
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "codigo" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citas_codigo_key" ON "citas"("codigo");

-- CreateIndex
CREATE INDEX "citas_tiendaId_inicio_idx" ON "citas"("tiendaId", "inicio");

-- CreateIndex
CREATE INDEX "citas_tiendaId_estado_idx" ON "citas"("tiendaId", "estado");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
