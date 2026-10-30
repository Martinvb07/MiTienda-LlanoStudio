-- CreateTable
CREATE TABLE "avisos_disponible" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avisadoEn" TIMESTAMP(3),

    CONSTRAINT "avisos_disponible_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avisos_disponible_productoId_avisadoEn_idx" ON "avisos_disponible"("productoId", "avisadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "avisos_disponible_productoId_email_key" ON "avisos_disponible"("productoId", "email");

-- AddForeignKey
ALTER TABLE "avisos_disponible" ADD CONSTRAINT "avisos_disponible_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos_disponible" ADD CONSTRAINT "avisos_disponible_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
