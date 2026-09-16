-- AlterTable
ALTER TABLE "Transacao" ADD COLUMN     "eventoId" INTEGER;

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "familiaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TEXT NOT NULL,
    "dataFim" TEXT,
    "orcamento" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificacaoEnviada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
