-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "presentacion" TEXT;

-- AlterTable
ALTER TABLE "tiendas" ADD COLUMN     "ajustes" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "productos_tiendaId_categoria_idx" ON "productos"("tiendaId", "categoria");
