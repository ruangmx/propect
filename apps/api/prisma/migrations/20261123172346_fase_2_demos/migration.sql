-- CreateTable
CREATE TABLE "demos" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "template" VARCHAR(50) NOT NULL,
    "dados" JSONB NOT NULL,
    "logo_url" TEXT,
    "publicada_em" TIMESTAMPTZ,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "demos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demos_lead_id_key" ON "demos"("lead_id");

-- CreateIndex
CREATE INDEX "demos_deleted_at_idx" ON "demos"("deleted_at");

-- AddForeignKey
ALTER TABLE "demos" ADD CONSTRAINT "demos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
