-- Update sync_staging_to_negocios to use COALESCE for partial updates
CREATE OR REPLACE FUNCTION sync_staging_to_negocios()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync from negocios (source = 'import_inicial')
  IF NEW.source = 'import_inicial' THEN
    RETURN NEW;
  END IF;

  -- Check if record with same crm_id already exists (for updates from n8n)
  IF NEW.crm_id IS NOT NULL AND EXISTS (SELECT 1 FROM negocios WHERE crm_id = NEW.crm_id) THEN
    -- Update existing record - preserve existing values when new value is empty/null
    UPDATE negocios SET
      nome = COALESCE(NULLIF(TRIM(NEW.nome), ''), negocios.nome),
      pipeline = COALESCE(NULLIF(TRIM(NEW.pipeline), ''), negocios.pipeline),
      vendedor = COALESCE(NULLIF(TRIM(NEW.vendedor), ''), negocios.vendedor),
      sdr = COALESCE(NULLIF(TRIM(NEW.sdr), ''), negocios.sdr),
      contato_fonte = COALESCE(NULLIF(TRIM(NEW.contato_fonte), ''), negocios.contato_fonte),
      lead_fonte = COALESCE(NULLIF(TRIM(NEW.lead_fonte), ''), negocios.lead_fonte),
      data_inicio = COALESCE(NEW.data_inicio, negocios.data_inicio),
      total = CASE WHEN NEW.total IS NOT NULL AND NEW.total > 0 THEN NEW.total ELSE negocios.total END,
      custo = CASE WHEN NEW.custo IS NOT NULL AND NEW.custo > 0 THEN NEW.custo ELSE negocios.custo END,
      tipo_venda = COALESCE(NULLIF(TRIM(NEW.tipo_venda), ''), negocios.tipo_venda),
      motivo_perda = COALESCE(NULLIF(TRIM(NEW.motivo_perda), ''), negocios.motivo_perda),
      fase = COALESCE(NULLIF(TRIM(NEW.fase), ''), negocios.fase),
      quem_vendeu = COALESCE(NULLIF(TRIM(NEW.quem_vendeu), ''), negocios.quem_vendeu),
      responsavel_reuniao = COALESCE(NULLIF(TRIM(NEW.responsavel_reuniao), ''), negocios.responsavel_reuniao),
      info_etapa = COALESCE(NULLIF(TRIM(NEW.info_etapa), ''), negocios.info_etapa),
      -- Boolean fields: only update to true, never back to false (preserve existing true values)
      mql = negocios.mql OR COALESCE(NEW.mql, false),
      sql_qualificado = negocios.sql_qualificado OR COALESCE(NEW.sql_qualificado, false),
      reuniao_agendada = negocios.reuniao_agendada OR COALESCE(NEW.reuniao_agendada, false),
      reuniao_realizada = negocios.reuniao_realizada OR COALESCE(NEW.reuniao_realizada, false),
      no_show = negocios.no_show OR COALESCE(NEW.no_show, false),
      venda_aprovada = negocios.venda_aprovada OR COALESCE(NEW.venda_aprovada, false),
      -- Date fields: preserve existing dates
      data_mql = COALESCE(NEW.data_mql, negocios.data_mql),
      data_sql = COALESCE(NEW.data_sql, negocios.data_sql),
      data_agendamento = COALESCE(NEW.data_agendamento, negocios.data_agendamento),
      data_reuniao_realizada = COALESCE(NEW.data_reuniao_realizada, negocios.data_reuniao_realizada),
      data_venda = COALESCE(NEW.data_venda, negocios.data_venda),
      data_noshow = COALESCE(NEW.data_noshow, negocios.data_noshow),
      data_prevista = COALESCE(NEW.data_prevista, negocios.data_prevista),
      primeiro_contato = COALESCE(NEW.primeiro_contato, negocios.primeiro_contato),
      data_movimentacao = COALESCE(NEW.data_movimentacao, negocios.data_movimentacao),
      -- UTM fields
      utm_source = COALESCE(NULLIF(TRIM(NEW.utm_source), ''), negocios.utm_source),
      utm_medium = COALESCE(NULLIF(TRIM(NEW.utm_medium), ''), negocios.utm_medium),
      utm_campaign = COALESCE(NULLIF(TRIM(NEW.utm_campaign), ''), negocios.utm_campaign),
      utm_content = COALESCE(NULLIF(TRIM(NEW.utm_content), ''), negocios.utm_content),
      utm_term = COALESCE(NULLIF(TRIM(NEW.utm_term), ''), negocios.utm_term),
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

-- Update sync_staging_update trigger function with same COALESCE logic
CREATE OR REPLACE FUNCTION sync_staging_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.crm_id IS NOT NULL THEN
    UPDATE negocios SET
      nome = COALESCE(NULLIF(TRIM(NEW.nome), ''), negocios.nome),
      pipeline = COALESCE(NULLIF(TRIM(NEW.pipeline), ''), negocios.pipeline),
      vendedor = COALESCE(NULLIF(TRIM(NEW.vendedor), ''), negocios.vendedor),
      sdr = COALESCE(NULLIF(TRIM(NEW.sdr), ''), negocios.sdr),
      contato_fonte = COALESCE(NULLIF(TRIM(NEW.contato_fonte), ''), negocios.contato_fonte),
      lead_fonte = COALESCE(NULLIF(TRIM(NEW.lead_fonte), ''), negocios.lead_fonte),
      data_inicio = COALESCE(NEW.data_inicio, negocios.data_inicio),
      total = CASE WHEN NEW.total IS NOT NULL AND NEW.total > 0 THEN NEW.total ELSE negocios.total END,
      custo = CASE WHEN NEW.custo IS NOT NULL AND NEW.custo > 0 THEN NEW.custo ELSE negocios.custo END,
      tipo_venda = COALESCE(NULLIF(TRIM(NEW.tipo_venda), ''), negocios.tipo_venda),
      motivo_perda = COALESCE(NULLIF(TRIM(NEW.motivo_perda), ''), negocios.motivo_perda),
      fase = COALESCE(NULLIF(TRIM(NEW.fase), ''), negocios.fase),
      quem_vendeu = COALESCE(NULLIF(TRIM(NEW.quem_vendeu), ''), negocios.quem_vendeu),
      responsavel_reuniao = COALESCE(NULLIF(TRIM(NEW.responsavel_reuniao), ''), negocios.responsavel_reuniao),
      info_etapa = COALESCE(NULLIF(TRIM(NEW.info_etapa), ''), negocios.info_etapa),
      mql = negocios.mql OR COALESCE(NEW.mql, false),
      sql_qualificado = negocios.sql_qualificado OR COALESCE(NEW.sql_qualificado, false),
      reuniao_agendada = negocios.reuniao_agendada OR COALESCE(NEW.reuniao_agendada, false),
      reuniao_realizada = negocios.reuniao_realizada OR COALESCE(NEW.reuniao_realizada, false),
      no_show = negocios.no_show OR COALESCE(NEW.no_show, false),
      venda_aprovada = negocios.venda_aprovada OR COALESCE(NEW.venda_aprovada, false),
      data_mql = COALESCE(NEW.data_mql, negocios.data_mql),
      data_sql = COALESCE(NEW.data_sql, negocios.data_sql),
      data_agendamento = COALESCE(NEW.data_agendamento, negocios.data_agendamento),
      data_reuniao_realizada = COALESCE(NEW.data_reuniao_realizada, negocios.data_reuniao_realizada),
      data_venda = COALESCE(NEW.data_venda, negocios.data_venda),
      data_noshow = COALESCE(NEW.data_noshow, negocios.data_noshow),
      data_prevista = COALESCE(NEW.data_prevista, negocios.data_prevista),
      primeiro_contato = COALESCE(NEW.primeiro_contato, negocios.primeiro_contato),
      data_movimentacao = COALESCE(NEW.data_movimentacao, negocios.data_movimentacao),
      utm_source = COALESCE(NULLIF(TRIM(NEW.utm_source), ''), negocios.utm_source),
      utm_medium = COALESCE(NULLIF(TRIM(NEW.utm_medium), ''), negocios.utm_medium),
      utm_campaign = COALESCE(NULLIF(TRIM(NEW.utm_campaign), ''), negocios.utm_campaign),
      utm_content = COALESCE(NULLIF(TRIM(NEW.utm_content), ''), negocios.utm_content),
      utm_term = COALESCE(NULLIF(TRIM(NEW.utm_term), ''), negocios.utm_term),
      updated_at = now()
    WHERE crm_id = OLD.crm_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;