-- CreateTable
CREATE TABLE "mensajes_contacto" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "motivo" TEXT,
    "mensaje" TEXT NOT NULL,
    "pagina" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensajes_contacto_tiendaId_archivado_creadoEn_idx" ON "mensajes_contacto"("tiendaId", "archivado", "creadoEn");

-- AddForeignKey
ALTER TABLE "mensajes_contacto" ADD CONSTRAINT "mensajes_contacto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
