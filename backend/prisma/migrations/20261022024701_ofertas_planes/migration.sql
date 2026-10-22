-- CreateTable
CREATE TABLE "ofertas_planes" (
    "plan" "PlanTenant" NOT NULL,
    "precio" INTEGER NOT NULL,
    "resumen" TEXT NOT NULL,
    "incluye" TEXT[],
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_planes_pkey" PRIMARY KEY ("plan")
);
