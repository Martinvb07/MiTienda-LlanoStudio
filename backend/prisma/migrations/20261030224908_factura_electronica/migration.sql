-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "clienteDocumento" TEXT,
ADD COLUMN     "clienteTipoDocumento" TEXT,
ADD COLUMN     "facturaEn" TIMESTAMP(3),
ADD COLUMN     "facturaError" TEXT,
ADD COLUMN     "facturaEstado" TEXT,
ADD COLUMN     "facturaId" TEXT,
ADD COLUMN     "facturaNumero" TEXT;

-- CreateTable
CREATE TABLE "facturacion_tienda" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'alegra',
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "automatica" BOOLEAN NOT NULL DEFAULT false,
    "usuario" TEXT NOT NULL,
    "secreto" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '{}',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturacion_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturacion_tienda_tiendaId_key" ON "facturacion_tienda"("tiendaId");

-- AddForeignKey
ALTER TABLE "facturacion_tienda" ADD CONSTRAINT "facturacion_tienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
