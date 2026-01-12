-- First, convert empty crm_id strings to NULL
UPDATE staging_negocios 
SET crm_id = NULL 
WHERE crm_id = '';

-- Drop the existing unique index/constraint on crm_id
DROP INDEX IF EXISTS staging_negocios_crm_id_unique;
DROP INDEX IF EXISTS staging_negocios_crm_id_key;

-- Create a partial unique index that only enforces uniqueness for non-NULL values
-- This allows multiple records with NULL crm_id
CREATE UNIQUE INDEX staging_negocios_crm_id_unique 
ON staging_negocios (crm_id) 
WHERE crm_id IS NOT NULL;