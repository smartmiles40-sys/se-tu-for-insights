// Pipeline constants for business rules
export const PIPELINE_PRE_VENDAS = 'Pré-Vendas - Comercial';
export const PIPELINE_COMERCIAL = 'Comercial 1 - Se tu for eu vou';

// All valid pipelines for filtering
export const PIPELINES_VALIDOS = [PIPELINE_PRE_VENDAS, PIPELINE_COMERCIAL];

// Helper to check if a negocio belongs to Pre-Vendas pipeline
export const isPreVendas = (pipeline: string | null | undefined): boolean => 
  pipeline === PIPELINE_PRE_VENDAS;

// Helper to check if a negocio belongs to Comercial pipeline
export const isComercial = (pipeline: string | null | undefined): boolean => 
  pipeline === PIPELINE_COMERCIAL;

// Helper to check if a negocio belongs to any valid pipeline
export const isPipelineValido = (pipeline: string | null | undefined): boolean => 
  PIPELINES_VALIDOS.includes(pipeline || '');
