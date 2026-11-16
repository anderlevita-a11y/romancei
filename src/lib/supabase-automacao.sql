-- ==============================================================================
-- CONSIGNA EVOLUTION - Cadastros do "Formulário para Automação"
-- Execute UMA vez no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.automacao_cadastros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(30) NOT NULL DEFAULT 'novo',      -- novo | em_ativacao | ativado | cancelado
    nome_completo TEXT NOT NULL,
    nome_operacao TEXT NOT NULL,
    cidade_uf TEXT,
    email TEXT,
    whatsapp_pessoal VARCHAR(30),
    whatsapp_automacao VARCHAR(30) NOT NULL,
    tipo_whatsapp TEXT,
    aparelhos_conectados TEXT,
    avisos_para TEXT,
    whatsapp_avisos VARCHAR(30),
    vp_usuario TEXT,
    vp_analise_credito TEXT,
    apos_aprovacao TEXT,
    horario_atendimento TEXT,
    observacoes TEXT,
    melhor_horario TEXT,
    celular_na_ativacao TEXT,
    aceite_login BOOLEAN DEFAULT false,
    aceite_lgpd BOOLEAN DEFAULT false,
    aceite_whatsapp BOOLEAN DEFAULT false,
    instancia TEXT,                                    -- identificador usado no robô (preenchido na ativação)
    anotacoes TEXT                                     -- observações internas da distribuidora
);

CREATE INDEX IF NOT EXISTS automacao_cadastros_created_at_idx ON public.automacao_cadastros (created_at DESC);

ALTER TABLE public.automacao_cadastros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a automacao_cadastros" ON public.automacao_cadastros;
CREATE POLICY "Permitir acesso completo a automacao_cadastros" ON public.automacao_cadastros
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.automacao_cadastros REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'automacao_cadastros'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automacao_cadastros;
  END IF;
END $$;
