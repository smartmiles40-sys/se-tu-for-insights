ALTER TABLE negocios
  ALTER COLUMN data_mql TYPE text USING data_mql::text,
  ALTER COLUMN data_sql TYPE text USING data_sql::text,
  ALTER COLUMN data_venda TYPE text USING data_venda::text,
  ALTER COLUMN data_reuniao_realizada TYPE text USING data_reuniao_realizada::text,
  ALTER COLUMN data_noshow TYPE text USING data_noshow::text,
  ALTER COLUMN primeiro_contato TYPE text USING primeiro_contato::text,
  ALTER COLUMN data_agendamento TYPE text USING data_agendamento::text,
  ALTER COLUMN data_inicio TYPE text USING data_inicio::text,
  ALTER COLUMN data_prevista TYPE text USING data_prevista::text,
  ALTER COLUMN data_movimentacao TYPE text USING data_movimentacao::text;