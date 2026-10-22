-- CreateTable
CREATE TABLE "visitas_diarias" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "visitas" INTEGER NOT NULL DEFAULT 0,
    "visitantes" INTEGER NOT NULL DEFAULT 0,
    "clicsWhatsapp" INTEGER NOT NULL DEFAULT 0,
    "vistasProducto" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "visitas_diarias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitas_diarias_tiendaId_fecha_key" ON "visitas_diarias"("tiendaId", "fecha");

-- AddForeignKey
ALTER TABLE "visitas_diarias" ADD CONSTRAINT "visitas_diarias_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
