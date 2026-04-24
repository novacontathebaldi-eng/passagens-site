-- Rebranding: Atualizar defaults de colunas de ViajaEdu! para Partiu Turismo
ALTER TABLE global_settings 
  ALTER COLUMN company_name SET DEFAULT 'Partiu Turismo',
  ALTER COLUMN contact_email SET DEFAULT 'contato@partiuturismo.com.br';
