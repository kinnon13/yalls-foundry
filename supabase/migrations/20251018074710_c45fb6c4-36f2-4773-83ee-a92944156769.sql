-- Fix app catalog icons (Horse -> Sparkles)
update app_catalog 
set icon = 'Sparkles' 
where key = 'horse_app' and icon = 'Horse';