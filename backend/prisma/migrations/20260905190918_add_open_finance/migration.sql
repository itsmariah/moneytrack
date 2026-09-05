-- AlterTable
ALTER TABLE "Conta" ADD COLUMN     "conexaoId" INTEGER,
ADD COLUMN     "pluggyAccountId" TEXT;

-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "pluggyTransactionId" TEXT;

-- CreateTable
CREATE TABLE "ConexaoBancaria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "nomeConector" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "erro" TEXT,
    "ultimaSincronizacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConexaoBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConexaoBancaria_pluggyItemId_key" ON "ConexaoBancaria"("pluggyItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Conta_pluggyAccountId_key" ON "Conta"("pluggyAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Transacao_pluggyTransactionId_key" ON "Transacao"("pluggyTransactionId");

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "ConexaoBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConexaoBancaria" ADD CONSTRAINT "ConexaoBancaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

