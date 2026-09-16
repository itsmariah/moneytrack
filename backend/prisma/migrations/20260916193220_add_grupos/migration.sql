-- CreateTable
CREATE TABLE "Grupo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "criadorUsuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoMembro" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "nomeConvidado" TEXT,
    "papel" TEXT NOT NULL DEFAULT 'membro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrupoMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaGrupo" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "data" TEXT NOT NULL,
    "pagoPorMembroId" INTEGER NOT NULL,
    "criadoPorUsuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DespesaGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisaoDespesa" (
    "id" SERIAL NOT NULL,
    "despesaGrupoId" INTEGER NOT NULL,
    "membroId" INTEGER NOT NULL,
    "valorDevido" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "DivisaoDespesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_codigo_key" ON "Grupo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoMembro_grupoId_usuarioId_key" ON "GrupoMembro"("grupoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "DivisaoDespesa_despesaGrupoId_membroId_key" ON "DivisaoDespesa"("despesaGrupoId", "membroId");

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_criadorUsuarioId_fkey" FOREIGN KEY ("criadorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoMembro" ADD CONSTRAINT "GrupoMembro_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoMembro" ADD CONSTRAINT "GrupoMembro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaGrupo" ADD CONSTRAINT "DespesaGrupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaGrupo" ADD CONSTRAINT "DespesaGrupo_pagoPorMembroId_fkey" FOREIGN KEY ("pagoPorMembroId") REFERENCES "GrupoMembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaGrupo" ADD CONSTRAINT "DespesaGrupo_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisaoDespesa" ADD CONSTRAINT "DivisaoDespesa_despesaGrupoId_fkey" FOREIGN KEY ("despesaGrupoId") REFERENCES "DespesaGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisaoDespesa" ADD CONSTRAINT "DivisaoDespesa_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "GrupoMembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
