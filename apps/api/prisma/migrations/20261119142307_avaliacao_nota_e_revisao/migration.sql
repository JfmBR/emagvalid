-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "requisitosAplicaveis" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requisitosEmDuvida" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revisados" TEXT[] DEFAULT ARRAY[]::TEXT[];
