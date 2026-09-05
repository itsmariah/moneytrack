-- AlterTable
ALTER TABLE "Recorrencia" ADD COLUMN     "contaId" INTEGER;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
