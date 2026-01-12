-- Create unique index on crm_id for upsert functionality
CREATE UNIQUE INDEX IF NOT EXISTS staging_negocios_crm_id_unique 
ON staging_negocios(crm_id) 
WHERE crm_id IS NOT NULL;