-- CreateEnum
CREATE TYPE "StatusAvaliacao" AS ENUM ('NA_FILA', 'ANALISANDO', 'CONCLUIDA', 'ERRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "StatusAvaliacao" NOT NULL DEFAULT 'NA_FILA',
    "nota" INTEGER,
    "mensagemErro" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidaEm" TIMESTAMP(3),

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falhas" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "requisitoEmag" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL,
    "seletor" TEXT NOT NULL,
    "trecho" TEXT,
    "revisaoHumana" BOOLEAN NOT NULL DEFAULT false,
    "orientacaoIa" TEXT,
    "orientacaoFinal" TEXT,
    "orientacaoAprovada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "falhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "avaliacoes_usuarioId_criadaEm_idx" ON "avaliacoes"("usuarioId", "criadaEm");

-- CreateIndex
CREATE INDEX "falhas_avaliacaoId_idx" ON "falhas"("avaliacaoId");

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falhas" ADD CONSTRAINT "falhas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
