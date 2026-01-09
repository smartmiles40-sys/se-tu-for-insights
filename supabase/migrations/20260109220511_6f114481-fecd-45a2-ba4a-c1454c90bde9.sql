-- Add new columns to staging_negocios table
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS crm_id text;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS fase text;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS quem_vendeu text;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS responsavel_reuniao text;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS info_etapa text;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_agendamento date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_reuniao_realizada date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_mql date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_sql date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_venda date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_noshow date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_prevista date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS primeiro_contato date;
ALTER TABLE staging_negocios ADD COLUMN IF NOT EXISTS data_movimentacao date;

-- Add same columns to negocios (production) table
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS crm_id text;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS fase text;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS quem_vendeu text;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS responsavel_reuniao text;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS info_etapa text;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_agendamento date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_reuniao_realizada date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_mql date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_sql date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_venda date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_noshow date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_prevista date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS primeiro_contato date;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS data_movimentacao date;