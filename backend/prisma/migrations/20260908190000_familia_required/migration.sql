-- DropIndex
DROP INDEX "Categoria_usuarioId_nome_tipo_key";

-- DropIndex
DROP INDEX "Orcamento_usuarioId_categoria_key";

-- AlterTable
ALTER TABLE "Categoria" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ConexaoBancaria" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Conta" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Meta" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Orcamento" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Recorrencia" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transacao" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transferencia" ALTER COLUMN "familiaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "familiaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_familiaId_nome_tipo_key" ON "Categoria"("familiaId", "nome", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_familiaId_categoria_key" ON "Orcamento"("familiaId", "categoria");

