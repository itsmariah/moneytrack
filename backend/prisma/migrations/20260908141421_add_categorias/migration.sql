-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icone" TEXT NOT NULL DEFAULT '💰',
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_usuarioId_nome_tipo_key" ON "Categoria"("usuarioId", "nome", "tipo");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
