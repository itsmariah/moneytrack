-- AlterTable
-- Muda "valor" de DOUBLE PRECISION (ponto flutuante binário) para DECIMAL(12,2)
-- (armazenamento exato de moeda). O cast ::DECIMAL(12,2) arredonda para 2 casas
-- decimais qualquer valor existente que tenha ruído de ponto flutuante.
ALTER TABLE "Transacao" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(12,2) USING "valor"::DECIMAL(12,2);
