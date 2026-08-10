-- AlterTable
-- tokenVersion: incrementado sempre que a senha muda, para invalidar tokens JWT
-- emitidos antes da troca (hoje um token roubado continuava valendo por até 7 dias
-- mesmo depois de trocar a senha).
ALTER TABLE "Usuario" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
-- resetToken -> resetTokenHash: o token de redefinição de senha passa a ser
-- armazenado como hash (sha256), não em texto puro, seguindo o mesmo cuidado já
-- aplicado à senha (bcrypt). O token de 256 bits enviado por e-mail continua sendo
-- o valor original — só o que fica salvo no banco muda.
ALTER TABLE "Usuario" RENAME COLUMN "resetToken" TO "resetTokenHash";
ALTER INDEX "Usuario_resetToken_key" RENAME TO "Usuario_resetTokenHash_key";
