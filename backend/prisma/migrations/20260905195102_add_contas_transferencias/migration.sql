-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "contaId" INTEGER;

-- CreateTable
CREATE TABLE "Conta" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "saldoInicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "contaOrigemId" INTEGER NOT NULL,
    "contaDestinoId" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_contaOrigemId_fkey" FOREIGN KEY ("contaOrigemId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_contaDestinoId_fkey" FOREIGN KEY ("contaDestinoId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
