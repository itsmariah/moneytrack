-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "ConexaoBancaria" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Conta" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Meta" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Orcamento" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Recorrencia" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Transferencia" ADD COLUMN     "familiaId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "familiaId" INTEGER,
ADD COLUMN     "papelFamilia" TEXT NOT NULL DEFAULT 'dono';

-- CreateTable
CREATE TABLE "Familia" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Familia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Familia_codigo_key" ON "Familia"("codigo");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConexaoBancaria" ADD CONSTRAINT "ConexaoBancaria_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
