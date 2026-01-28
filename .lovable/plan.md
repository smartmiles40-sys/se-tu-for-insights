
## Plano: Corrigir Aprovação de Registros Duplicados

### Problema Identificado
O erro "Erro ao aprovar registros" ocorre porque:

1. A tabela `negocios` tem uma constraint UNIQUE em `crm_id` (`negocios_crm_id_unique`)
2. Dos 184 registros selecionados, todos já existem na tabela `negocios` com o mesmo `crm_id`
3. O código atual usa `insert`, que falha com conflito de chave duplicada (erro 409)

### Solução
Modificar a função `useApproveStaging` para:
1. Verificar quais `crm_id` já existem na tabela `negocios`
2. Para registros existentes: fazer `UPDATE` (atualizar dados)
3. Para registros novos: fazer `INSERT`

### Alterações de Código

**Arquivo: `src/hooks/useStagingNegocios.ts`**

Modificar a função `useApproveStaging` (linhas 142-226) para:

```typescript
export function useApproveStaging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Get staging records to approve
      const { data: stagingRecords, error: fetchError } = await supabase
        .from('staging_negocios')
        .select('*')
        .in('id', ids);

      if (fetchError) throw fetchError;
      if (!stagingRecords || stagingRecords.length === 0) {
        throw new Error('No records found');
      }

      // Get crm_ids that already exist in negocios
      const crmIds = stagingRecords
        .map(r => r.crm_id)
        .filter(Boolean);
      
      let existingCrmIds = new Set<string>();
      if (crmIds.length > 0) {
        const { data: existingRecords } = await supabase
          .from('negocios')
          .select('crm_id')
          .in('crm_id', crmIds);
        
        existingCrmIds = new Set(existingRecords?.map(r => r.crm_id) || []);
      }

      // Separate records into updates and inserts
      const toUpdate = stagingRecords.filter(r => r.crm_id && existingCrmIds.has(r.crm_id));
      const toInsert = stagingRecords.filter(r => !r.crm_id || !existingCrmIds.has(r.crm_id));

      // Prepare record data (remove staging-specific fields)
      const prepareRecord = (record) => ({
        nome: record.nome,
        pipeline: record.pipeline,
        // ... all other fields
      });

      // Update existing records
      for (const record of toUpdate) {
        const { error } = await supabase
          .from('negocios')
          .update(prepareRecord(record))
          .eq('crm_id', record.crm_id);
        
        if (error) throw error;
      }

      // Insert new records
      if (toInsert.length > 0) {
        const insertRecords = toInsert.map(prepareRecord);
        const { error } = await supabase
          .from('negocios')
          .insert(insertRecords);
        
        if (error) throw error;
      }

      // Update staging status to approved
      const { error: updateError } = await supabase
        .from('staging_negocios')
        .update({ status: 'aprovado' })
        .in('id', ids);

      if (updateError) throw updateError;

      return stagingRecords.length;
    },
    // ... callbacks unchanged
  });
}
```

### Detalhes Técnicos

**Por que o erro ocorre:**
- A tabela `negocios` possui constraint `negocios_crm_id_unique`
- O código atual usa `.insert()` que falha quando `crm_id` já existe
- 184 dos 458 registros no staging têm `crm_id` duplicados em `negocios`

**Como a solução funciona:**
1. Consulta quais `crm_id` já existem em `negocios`
2. Divide registros em dois grupos: atualizar vs inserir
3. Registros existentes são atualizados com `UPDATE ... WHERE crm_id = ?`
4. Registros novos são inseridos normalmente
5. Todos os registros staging são marcados como aprovados

### Resultado Esperado
- Aprovação funcionará sem erros
- Registros existentes em `negocios` serão atualizados com novos dados
- Registros novos serão inseridos
- O status no staging será atualizado para "aprovado"
