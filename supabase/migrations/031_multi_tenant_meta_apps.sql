-- Add multi-tenant App ID and Secret columns to whatsapp_config
ALTER TABLE whatsapp_config 
  ADD COLUMN meta_app_id text,
  ADD COLUMN meta_app_secret text;
