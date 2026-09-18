-- CreateTable
CREATE TABLE "PagamentoGrupo" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "deMembroId" INTEGER NOT NULL,
    "paraMembroId" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TEXT NOT NULL,
    "criadoPorUsuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagamentoGrupo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagamentoGrupo" ADD CONSTRAINT "PagamentoGrupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoGrupo" ADD CONSTRAINT "PagamentoGrupo_deMembroId_fkey" FOREIGN KEY ("deMembroId") REFERENCES "GrupoMembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoGrupo" ADD CONSTRAINT "PagamentoGrupo_paraMembroId_fkey" FOREIGN KEY ("paraMembroId") REFERENCES "GrupoMembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoGrupo" ADD CONSTRAINT "PagamentoGrupo_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
