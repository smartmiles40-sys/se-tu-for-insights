-- First, drop the INSERT trigger temporarily to allow syncing existing data
DROP TRIGGER IF EXISTS trigger_staging_insert ON staging_negocios;

-- Delete duplicate records from negocios (keeping the oldest ones by created_at)
DELETE FROM negocios n1
USING negocios n2
WHERE n1.crm_id = n2.crm_id 
  AND n1.crm_id IS NOT NULL
  AND n1.created_at > n2.created_at;

-- Delete records without crm_id that were just duplicated (inserted today)
DELETE FROM negocios 
WHERE crm_id IS NULL 
  AND created_at::date = CURRENT_DATE
  AND id NOT IN (
    SELECT DISTINCT ON (nome, data_inicio, total) id 
    FROM negocios 
    WHERE crm_id IS NULL AND created_at::date = CURRENT_DATE
    ORDER BY nome, data_inicio, total, created_at ASC
  );

-- Now recreate the trigger with better duplicate handling
CREATE OR REPLACE FUNCTION sync_staging_to_negocios()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync from negocios (source = 'import_inicial')
  IF NEW.source = 'import_inicial' THEN
    RETURN NEW;
  END IF;

  -- Check if record with same crm_id already exists (for updates from n8n)
  IF NEW.crm_id IS NOT NULL AND EXISTS (SELECT 1 FROM negocios WHERE crm_id = NEW.crm_id) THEN
    -- Update existing record
    UPDATE negocios SET
      nome = NEW.nome,
      pipeline = NEW.pipeline,
      vendedor = NEW.vendedor,
      sdr = NEW.sdr,
      contato_fonte = NEW.contato_fonte,
      lead_fonte = NEW.lead_fonte,
      data_inicio = NEW.data_inicio,
      total = NEW.total,
      custo = NEW.custo,
      tipo_venda = NEW.tipo_venda,
      motivo_perda = NEW.motivo_perda,
      fase = NEW.fase,
      quem_vendeu = NEW.quem_vendeu,
      responsavel_reuniao = NEW.responsavel_reuniao,
      info_etapa = NEW.info_etapa,
      mql = NEW.mql,
      sql_qualificado = NEW.sql_qualificado,
      reuniao_agendada = NEW.reuniao_agendada,
      reuniao_realizada = NEW.reuniao_realizada,
      no_show = NEW.no_show,
      venda_aprovada = NEW.venda_aprovada,
      data_mql = NEW.data_mql,
      data_sql = NEW.data_sql,
      data_agendamento = NEW.data_agendamento,
      data_reuniao_realizada = NEW.data_reuniao_realizada,
      data_venda = NEW.data_venda,
      data_noshow = NEW.data_noshow,
      data_prevista = NEW.data_prevista,
      primeiro_contato = NEW.primeiro_contato,
      data_movimentacao = NEW.data_movimentacao,
      utm_source = NEW.utm_source,
      utm_medium = NEW.utm_medium,
      utm_campaign = NEW.utm_campaign,
      utm_content = NEW.utm_content,
      utm_term = NEW.utm_term,
      updated_at = now()
    WHERE crm_id = NEW.crm_id;
  ELSE
    -- Insert new record
    INSERT INTO negocios (
      crm_id, nome, pipeline, vendedor, sdr, contato_fonte, lead_fonte,
      data_inicio, total, custo, tipo_venda, motivo_perda, fase,
      quem_vendeu, responsavel_reuniao, info_etapa,
      mql, sql_qualificado, reuniao_agendada, reuniao_realizada,
      no_show, venda_aprovada,
      data_mql, data_sql, data_agendamento, data_reuniao_realizada,
      data_venda, data_noshow, data_prevista, primeiro_contato, data_movimentacao,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) VALUES (
      NEW.crm_id, NEW.nome, NEW.pipeline, NEW.vendedor, NEW.sdr, 
      NEW.contato_fonte, NEW.lead_fonte, NEW.data_inicio, NEW.total, 
      NEW.custo, NEW.tipo_venda, NEW.motivo_perda, NEW.fase,
      NEW.quem_vendeu, NEW.responsavel_reuniao, NEW.info_etapa,
      NEW.mql, NEW.sql_qualificado, NEW.reuniao_agendada, NEW.reuniao_realizada,
      NEW.no_show, NEW.venda_aprovada,
      NEW.data_mql, NEW.data_sql, NEW.data_agendamento, NEW.data_reuniao_realizada,
      NEW.data_venda, NEW.data_noshow, NEW.data_prevista, NEW.primeiro_contato, 
      NEW.data_movimentacao,
      NEW.utm_source, NEW.utm_medium, NEW.utm_campaign, NEW.utm_content, NEW.utm_term
    );
  END IF;
  
  -- Mark as approved automatically
  NEW.status := 'aprovado';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER trigger_staging_insert
BEFORE INSERT ON staging_negocios
FOR EACH ROW
EXECUTE FUNCTION sync_staging_to_negocios();