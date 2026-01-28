
## Plano: Adicionar Constraint UNIQUE ao Campo crm_id

### Problema Identificado
O erro `"there is no unique or exclusion constraint matching the ON CONFLICT specification"` continua ocorrendo porque a constraint UNIQUE no campo `crm_id` da tabela `staging_negocios` **não existe** no banco de dados.

Uma verificação confirmou que não há nenhuma constraint UNIQUE na tabela `staging_negocios`.

### Causa do Problema
A migration anterior não foi aplicada corretamente - o erro de "constraint já existe" foi um falso positivo ou houve um problema na execução.

### Solução
Executar uma nova migration para:

1. **Limpar registros duplicados** (se houver) - Manter apenas o registro mais recente para cada `crm_id`
2. **Adicionar constraint UNIQUE** no campo `crm_id`

### Detalhes Técnicos

**SQL da Migration:**
```sql
-- Primeiro, limpar possíveis duplicatas existentes mantendo apenas o mais recente
DELETE FROM staging_negocios a
USING staging_negocios b
WHERE a.crm_id = b.crm_id
  AND a.crm_id IS NOT NULL
  AND a.created_at < b.created_at;

-- Adicionar constraint UNIQUE
ALTER TABLE staging_negocios 
ADD CONSTRAINT staging_negocios_crm_id_unique UNIQUE (crm_id);
```

**Por que isso resolve o problema:**
- O Supabase SDK usa `ON CONFLICT` para fazer upsert
- `ON CONFLICT` requer uma constraint UNIQUE ou exclusion para identificar o registro a atualizar
- Sem essa constraint, o banco não sabe qual registro atualizar quando há um `crm_id` duplicado

### Resultado Esperado
Após a migration:
- A importação do arquivo `report_32.xls` funcionará corretamente
- Registros com mesmo `crm_id` serão atualizados (não duplicados)
- O campo `data_reuniao_realizada` será populado corretamente

### Arquivos Afetados
Nenhum arquivo de código precisa ser alterado - apenas uma migration de banco de dados.
