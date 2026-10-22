-- CreateEnum
CREATE TYPE "TipoCupon" AS ENUM ('PORCENTAJE', 'FIJO', 'ENVIO_GRATIS');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "destacado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opciones" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "variantes" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "cupones" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoCupon" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minimo" DECIMAL(12,2),
    "usosMaximos" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "venceEn" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cupones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cupones_tiendaId_codigo_key" ON "cupones"("tiendaId", "codigo");

-- AddForeignKey
ALTER TABLE "cupones" ADD CONSTRAINT "cupones_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
