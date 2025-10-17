-- Minimal seed for investor demo
-- Run this after creating a user account

-- Create a demo entity (farm)
insert into public.entities (owner_user_id, name) 
select auth.uid(), 'Bluegrass Farm'
where not exists (select 1 from public.entities where owner_user_id = auth.uid());

-- Create a sample post
insert into public.posts (author_user_id, entity_id, body, media)
select auth.uid(), (select id from public.entities where owner_user_id = auth.uid() limit 1),
'Colt update: breezing in :12.1', '[{"url":"https://picsum.photos/seed/colt/800/1200","type":"image"}]'
where not exists (select 1 from public.posts where author_user_id = auth.uid());

-- Create a sample marketplace listing
insert into public.marketplace_listings (seller_entity_id, title, price_cents, media, stock_quantity)
select (select id from public.entities where owner_user_id = auth.uid() limit 1),
'2022 Filly by Into Mischief', 12500000, '[{"url":"https://picsum.photos/seed/filly/1200/800","type":"image"}]', 1
where not exists (select 1 from public.marketplace_listings where title like '2022 Filly%');

-- Create a sample event
insert into public.events (host_entity_id, title, starts_at, location, metadata)
select (select id from public.entities where owner_user_id = auth.uid() limit 1),
'Open Barn Morning', now() + interval '3 days', '{"city":"Lexington","state":"KY"}', '{"rsvp_count":12}';
