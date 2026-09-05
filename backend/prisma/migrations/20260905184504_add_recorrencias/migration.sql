-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "recorrenciaId" INTEGER;

-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "diaDoMes" INTEGER NOT NULL,
    "dataInicio" TEXT NOT NULL,
    "dataFim" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recorrencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
