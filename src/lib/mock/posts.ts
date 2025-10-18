// Mock posts generator for the TikTok-style feed
// Generates deterministic-looking mock data per page without backend

// NOTE: Keep this lightweight and self-contained so it can be used anywhere

export function generateMockPosts(page: number, pageSize: number) {
  const titles = [
    'Epic sunrise over the mountains',
    'Street food tour highlights',
    'Cozy reading nook inspo',
    'Workout routine – day 7',
    'Minimal desk setup tour',
    'City lights at midnight',
    'Ocean waves ASMR',
    'Art timelapse: pastel skies',
    'Tiny home walk-through',
    'Weekend hike recap'
  ];

  const handles = [
    'alex', 'sam', 'jordan', 'casey', 'riley',
    'drew', 'avery', 'cameron', 'skyler', 'morgan'
  ];

  const images = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop'
  ];

  const names = [
    'Alex Rivera', 'Sam Chen', 'Jordan Taylor', 'Casey Morgan', 'Riley Quinn',
    'Drew Parker', 'Avery Brooks', 'Cameron Lee', 'Skyler Jones', 'Morgan Davis'
  ];

  const now = Date.now();

  const items = Array.from({ length: pageSize }).map((_, i) => {
    const idx = (page * pageSize + i) % names.length;
    const id = `mock_${page}_${i}`;
    const name = names[idx];
    const handle = handles[idx];

    return {
      id,
      body: `${titles[idx]} — page ${page + 1}, item ${i + 1}. #mock #demo`,
      media: { url: images[idx] },
      created_at: new Date(now - (page * 1000 + i) * 60000).toISOString(),
      author_user_id: id,
      profiles: {
        display_name: name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`
      },
      entities: {
        display_name: name,
        handle
      }
    } as any;
  });

  return items;
}
