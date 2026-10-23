-- Tipo de sitio: tienda en línea, página informativa o enlaces.
-- Aditiva: toda tienda que ya existe queda como 'tienda'.
CREATE TYPE "TipoSitio" AS ENUM ('tienda', 'pagina', 'enlaces');

ALTER TABLE "tiendas" ADD COLUMN "tipo" "TipoSitio" NOT NULL DEFAULT 'tienda';
