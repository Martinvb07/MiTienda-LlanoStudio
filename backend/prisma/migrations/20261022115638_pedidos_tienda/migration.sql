-- AlterTable
ALTER TABLE "items_pedido" ADD COLUMN     "foto" TEXT,
ADD COLUMN     "variante" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "canal" TEXT NOT NULL DEFAULT 'web',
ADD COLUMN     "cupon" TEXT,
ADD COLUMN     "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "metodoPago" TEXT NOT NULL DEFAULT 'acordar',
ADD COLUMN     "notaInterna" TEXT,
ADD COLUMN     "notas" TEXT;

-- CreateIndex
CREATE INDEX "pedidos_tiendaId_creadoEn_idx" ON "pedidos"("tiendaId", "creadoEn");
