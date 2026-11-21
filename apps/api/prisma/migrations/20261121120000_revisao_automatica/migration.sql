-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "indicios" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "requisitosNaoAplicaveis" TEXT[] DEFAULT ARRAY[]::TEXT[];
