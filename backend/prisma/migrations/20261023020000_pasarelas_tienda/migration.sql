-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProveedorPago" ADD VALUE 'EPAYCO';
ALTER TYPE "ProveedorPago" ADD VALUE 'BOLD';

-- CreateTable
CREATE TABLE "pasarelas_tienda" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "modoPrueba" BOOLEAN NOT NULL DEFAULT true,
    "llavePublica" TEXT NOT NULL,
    "secretos" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pasarelas_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pasarelas_tienda_tiendaId_proveedor_key" ON "pasarelas_tienda"("tiendaId", "proveedor");

-- AddForeignKey
ALTER TABLE "pasarelas_tienda" ADD CONSTRAINT "pasarelas_tienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

