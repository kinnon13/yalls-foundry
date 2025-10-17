-- PR5 Final Performance Indexes (without grants for non-existent functions)

-- Posts indexes for feed fusion
create index if not exists posts_created_at_desc_idx 
on posts(created_at desc);

-- Post targets for efficient targeting checks
create index if not exists pt_target_approved_idx 
on post_targets(target_entity_id, approved) 
where approved = true;

-- Marketplace listings indexes
create index if not exists listings_status_created_idx 
on marketplace_listings(status, created_at desc);

create index if not exists listings_seller_status_created_idx 
on marketplace_listings(seller_profile_id, status, created_at desc);

-- Events indexes
create index if not exists events_starts_at_idx 
on events(starts_at);

-- Entity edges for follow graph
create index if not exists entity_edges_follow_idx 
on entity_edges(relation_type, subject_entity_id, object_entity_id)
where relation_type = 'follow';