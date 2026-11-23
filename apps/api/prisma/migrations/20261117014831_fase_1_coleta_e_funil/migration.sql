-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('NOVO', 'LIGAR', 'DEMO_PRONTA', 'ENVIADO', 'RESPONDEU', 'REUNIAO', 'FECHOU', 'PERDIDO', 'SEM_RESPOSTA', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "presenca_web" AS ENUM ('SEM_SITE', 'SO_REDE_SOCIAL', 'TEM_SITE');

-- CreateEnum
CREATE TYPE "tipo_interacao" AS ENUM ('MENSAGEM_ENVIADA', 'FOLLOW_UP', 'RESPOSTA', 'LIGACAO', 'REUNIAO', 'MUDANCA_STATUS', 'NOTA');

-- CreateTable
CREATE TABLE "regioes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "raio_metros" INTEGER NOT NULL DEFAULT 4000,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "regioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buscas" (
    "id" UUID NOT NULL,
    "nicho" VARCHAR(100) NOT NULL,
    "regiao_id" UUID NOT NULL,
    "total_encontrado" INTEGER NOT NULL,
    "total_novos" INTEGER NOT NULL,
    "chamadas_api" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "buscas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "place_id" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "nicho" VARCHAR(100) NOT NULL,
    "endereco" TEXT,
    "regiao_id" UUID,
    "telefone" VARCHAR(50),
    "eh_celular" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "instagram" TEXT,
    "presenca_web" "presenca_web" NOT NULL,
    "nota" DOUBLE PRECISION,
    "total_avaliacoes" INTEGER,
    "google_maps_uri" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'NOVO',
    "slug" VARCHAR(255),
    "proximo_contato_em" TIMESTAMPTZ,
    "motivo_perda" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacoes" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tipo" "tipo_interacao" NOT NULL,
    "conteudo" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regioes_ativa_idx" ON "regioes"("ativa");

-- CreateIndex
CREATE INDEX "regioes_deleted_at_idx" ON "regioes"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "regioes_nome_cidade_uf_key" ON "regioes"("nome", "cidade", "uf");

-- CreateIndex
CREATE INDEX "buscas_regiao_id_idx" ON "buscas"("regiao_id");

-- CreateIndex
CREATE INDEX "buscas_nicho_idx" ON "buscas"("nicho");

-- CreateIndex
CREATE INDEX "buscas_created_at_idx" ON "buscas"("created_at");

-- CreateIndex
CREATE INDEX "buscas_deleted_at_idx" ON "buscas"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_place_id_key" ON "leads"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_slug_key" ON "leads"("slug");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_nicho_idx" ON "leads"("nicho");

-- CreateIndex
CREATE INDEX "leads_regiao_id_idx" ON "leads"("regiao_id");

-- CreateIndex
CREATE INDEX "leads_presenca_web_idx" ON "leads"("presenca_web");

-- CreateIndex
CREATE INDEX "leads_proximo_contato_em_idx" ON "leads"("proximo_contato_em");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_deleted_at_idx" ON "leads"("deleted_at");

-- CreateIndex
CREATE INDEX "interacoes_lead_id_idx" ON "interacoes"("lead_id");

-- CreateIndex
CREATE INDEX "interacoes_tipo_idx" ON "interacoes"("tipo");

-- CreateIndex
CREATE INDEX "interacoes_created_at_idx" ON "interacoes"("created_at");

-- CreateIndex
CREATE INDEX "interacoes_deleted_at_idx" ON "interacoes"("deleted_at");

-- AddForeignKey
ALTER TABLE "buscas" ADD CONSTRAINT "buscas_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regioes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
