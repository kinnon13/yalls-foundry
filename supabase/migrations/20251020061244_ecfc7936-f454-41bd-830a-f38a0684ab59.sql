-- Auto-maintain content_tsv on insert/update for fast lexical search
CREATE OR REPLACE FUNCTION public.tg_rk_tsv() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  NEW.content_tsv := to_tsvector('simple', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_rk_tsv ON public.rocker_knowledge;
CREATE TRIGGER tr_rk_tsv
BEFORE INSERT OR UPDATE OF content ON public.rocker_knowledge
FOR EACH ROW EXECUTE FUNCTION public.tg_rk_tsv();