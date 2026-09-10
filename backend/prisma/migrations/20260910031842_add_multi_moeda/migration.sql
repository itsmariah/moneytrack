-- AlterTable
ALTER TABLE "Conta" ADD COLUMN     "moeda" TEXT NOT NULL DEFAULT 'BRL';

-- CreateTable
CREATE TABLE "TaxaCambio" (
    "id" SERIAL NOT NULL,
    "moeda" TEXT NOT NULL,
    "taxaParaBRL" DECIMAL(12,6) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxaCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxaCambio_moeda_key" ON "TaxaCambio"("moeda");
