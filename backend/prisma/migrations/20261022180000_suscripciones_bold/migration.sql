-- CreateEnum
CREATE TYPE "PeriodoSuscripcion" AS ENUM ('MENSUAL', 'ANUAL');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "planVenceEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ofertas_planes" ADD COLUMN "precioAnual" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pagos_suscripcion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "PlanTenant" NOT NULL,
    "periodo" "PeriodoSuscripcion" NOT NULL,
    "monto" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "idBold" TEXT,
    "datosBold" JSONB,
    "cubreHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagos_suscripcion_referencia_key" ON "pagos_suscripcion"("referencia");

-- CreateIndex
CREATE INDEX "pagos_suscripcion_tenantId_creadoEn_idx" ON "pagos_suscripcion"("tenantId", "creadoEn");

-- AddForeignKey
ALTER TABLE "pagos_suscripcion" ADD CONSTRAINT "pagos_suscripcion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
