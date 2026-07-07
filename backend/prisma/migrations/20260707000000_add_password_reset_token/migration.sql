-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "resetTokenExpiresAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetToken_key" ON "Usuario"("resetToken");
