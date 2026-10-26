-- CreateEnum
CREATE TYPE "EstadoCarrito" AS ENUM ('ABIERTO', 'RECUPERADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "carritos_abandonados" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "nombre" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCarrito" NOT NULL DEFAULT 'ABIERTO',
    "contactadoEn" TIMESTAMP(3),
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carritos_abandonados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carritos_abandonados_tiendaId_estado_actualizadoEn_idx" ON "carritos_abandonados"("tiendaId", "estado", "actualizadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "carritos_abandonados_tiendaId_token_key" ON "carritos_abandonados"("tiendaId", "token");

-- AddForeignKey
ALTER TABLE "carritos_abandonados" ADD CONSTRAINT "carritos_abandonados_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
