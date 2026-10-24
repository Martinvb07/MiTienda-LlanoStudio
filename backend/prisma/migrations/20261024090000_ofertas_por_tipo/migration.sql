-- Precios propios para la página de negocio. Las ofertas guardadas quedan como de tienda.
ALTER TABLE "ofertas_planes" ADD COLUMN "tipo" "TipoSitio" NOT NULL DEFAULT 'tienda';
ALTER TABLE "ofertas_planes" DROP CONSTRAINT "ofertas_planes_pkey";
ALTER TABLE "ofertas_planes" ADD CONSTRAINT "ofertas_planes_pkey" PRIMARY KEY ("plan", "tipo");
