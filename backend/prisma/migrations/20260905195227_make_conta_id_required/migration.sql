/*
  Warnings:

  - Made the column `contaId` on table `Transacao` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transacao" ALTER COLUMN "contaId" SET NOT NULL;
