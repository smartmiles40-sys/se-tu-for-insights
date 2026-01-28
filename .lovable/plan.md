

## Plano: Corrigir Erro de Importação de Dados

### Problema Identificado
O erro `"there is no unique or exclusion constraint matching the ON CONFLICT specification"` ocorre porque a tabela `staging_negocios` não possui uma constraint UNIQUE no campo `crm_id`. Sem essa constraint, o comando upsert não consegue identificar qual registro atualizar.

### Solução
Adicionar uma constraint UNIQUE no campo `crm_id` da tabela `staging_negocios` via migration de banco de dados.

### Passos de Implementação

1. **Criar migration para adicionar constraint UNIQUE**
   - Adicionar constraint UNIQUE no campo `crm_id` da tabela `staging_negocios`
   - Isso permitirá que o upsert funcione corretamente

2. **SQL da Migration**
   ```sql
   -- Primeiro, limpar possíveis duplicatas existentes
   DELETE FROM staging_negocios a
   USING staging_negocios b
   WHERE a.crm_id = b.crm_id
     AND a.crm_id IS NOT NULL
     AND a.created_at < b.created_at;
   
   -- Adicionar constraint UNIQUE
   ALTER TABLE staging_negocios 
   ADD CONSTRAINT staging_negocios_crm_id_unique UNIQUE (crm_id);
   ```

3. **Nenhuma alteração de código necessária**
   - O código atual já usa upsert com `onConflict: 'crm_id'`
   - Após a migration, a importação funcionará automaticamente

### Resultado Esperado
- A importação do arquivo `report_32.xls` funcionará sem erros
- Registros com mesmo `crm_id` serão atualizados ao invés de duplicados
- O campo `data_reuniao_realizada` será populado corretamente

### Detalhes Técnicos
A constraint UNIQUE permitirá:
- Identificar registros existentes pelo `crm_id`
- Atualizar campos como `data_reuniao_realizada` em reimportações
- Evitar duplicatas na área de staging

