-- CreateEnum
CREATE TYPE "EstadoResena" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "resenas" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ciudad" TEXT,
    "estrellas" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoResena" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resenas_tiendaId_estado_idx" ON "resenas"("tiendaId", "estado");

-- CreateIndex
CREATE INDEX "resenas_productoId_estado_idx" ON "resenas"("productoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "resenas_productoId_email_key" ON "resenas"("productoId", "email");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
