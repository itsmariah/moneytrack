/*
  Warnings:

  - Made the column `contaId` on table `Recorrencia` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Recorrencia" ALTER COLUMN "contaId" SET NOT NULL;
