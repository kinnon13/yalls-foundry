-- Tables exist?
SELECT 'user_segments'  AS obj, to_regclass('public.user_segments')  IS NOT NULL AS ok
UNION ALL
SELECT 'entity_segments',          to_regclass('public.entity_segments') IS NOT NULL
UNION ALL
SELECT 'ui_theme_overrides',       to_regclass('public.ui_theme_overrides') IS NOT NULL;

-- Functions exist?
SELECT 'recommend_workspace_modules' AS fn, oid IS NOT NULL AS ok
FROM pg_proc WHERE proname='recommend_workspace_modules'
UNION ALL
SELECT 'accept_module_recommendation', oid IS NOT NULL
FROM pg_proc WHERE proname='accept_module_recommendation'
UNION ALL
SELECT 'set_theme_overrides', oid IS NOT NULL
FROM pg_proc WHERE proname='set_theme_overrides'
UNION ALL
SELECT 'get_theme', oid IS NOT NULL
FROM pg_proc WHERE proname='get_theme'
UNION ALL
SELECT 'get_workspace_kpis', oid IS NOT NULL
FROM pg_proc WHERE proname='get_workspace_kpis';

-- RLS enabled?
SELECT relname AS table, rowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND relname IN ('user_segments','entity_segments','ui_theme_overrides');
