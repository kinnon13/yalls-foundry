// Mock entity generators for people, homes, farms, products, businesses
// Generates deterministic mock data without backend

export function generateMockPeople(count: number) {
  const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Drew', 'Avery', 'Cameron', 'Skyler', 'Morgan'];
  const lastNames = ['Rivera', 'Chen', 'Taylor', 'Morgan', 'Quinn', 'Parker', 'Brooks', 'Lee', 'Jones', 'Davis'];
  const bios = [
    'Professional equestrian and trainer',
    'Farm owner and animal lover',
    'Real estate enthusiast',
    'Local business owner',
    'Community organizer',
    'Event planner and coordinator',
    'Agricultural specialist',
    'Property manager',
    'Marketplace vendor',
    'Local entrepreneur'
  ];

  return Array.from({ length: count }).map((_, i) => {
    const id = `mock_person_${i}`;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const displayName = `${firstName} ${lastName}`;

    return {
      id,
      kind: 'person' as const,
      display_name: displayName,
      handle: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      bio: bios[i % bios.length],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
      status: 'active',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: {
        location: 'Local area',
        verified: i % 3 === 0
      }
    };
  });
}

export function generateMockHomes(count: number) {
  const types = ['Ranch', 'Farmhouse', 'Estate', 'Cottage', 'Villa', 'Barn Conversion', 'Modern Home', 'Historic Property'];
  const features = [
    ['3 bedrooms', '2 baths', 'Large yard', 'Barn'],
    ['4 bedrooms', '3 baths', 'Pool', 'Stables'],
    ['5 bedrooms', '4 baths', 'Guest house', 'Paddocks'],
    ['2 bedrooms', '1 bath', 'Cozy', 'Garden'],
    ['6 bedrooms', '5 baths', 'Luxury', 'Arena']
  ];

  const images = [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop'
  ];

  return Array.from({ length: count }).map((_, i) => {
    const id = `mock_home_${i}`;
    const type = types[i % types.length];
    const feature = features[i % features.length];

    return {
      id,
      kind: 'home' as const,
      display_name: `${type} Home #${i + 1}`,
      description: `Beautiful ${type.toLowerCase()} featuring ${feature.join(', ')}`,
      image_url: images[i % images.length],
      status: 'active',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: {
        price: `$${(250000 + i * 50000).toLocaleString()}`,
        features: feature,
        sqft: 2000 + i * 500,
        acres: 2 + (i % 10)
      }
    };
  });
}

export function generateMockFarms(count: number) {
  const names = [
    'Sunset Valley Farm',
    'Green Meadows Ranch',
    'Rolling Hills Farm',
    'Oak Tree Stables',
    'River Bend Farm',
    'Mountain View Ranch',
    'Prairie Wind Farm',
    'Cedar Creek Stables',
    'Willow Grove Farm',
    'Pine Ridge Ranch'
  ];

  const specialties = [
    'Horse boarding and training',
    'Organic produce',
    'Livestock raising',
    'Equestrian events',
    'Agricultural tours',
    'Farm-to-table produce',
    'Riding lessons',
    'Petting zoo',
    'Sustainable farming',
    'Hobby farm'
  ];

  const images = [
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595524577092-16c0b22e6f61?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1600&auto=format&fit=crop'
  ];

  return Array.from({ length: count }).map((_, i) => {
    const id = `mock_farm_${i}`;
    const name = names[i % names.length];

    return {
      id,
      kind: 'farm' as const,
      display_name: name,
      description: `${specialties[i % specialties.length]} – ${(5 + (i % 45))} acres of beautiful countryside`,
      image_url: images[i % images.length],
      status: 'active',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: {
        acres: 5 + (i % 45),
        specialty: specialties[i % specialties.length],
        established: 1990 + (i % 30)
      }
    };
  });
}

export function generateMockProducts(count: number) {
  const products = [
    { name: 'Leather Saddle', price: 45000, category: 'Tack' },
    { name: 'Riding Boots', price: 15000, category: 'Apparel' },
    { name: 'Horse Blanket', price: 8000, category: 'Care' },
    { name: 'Grooming Kit', price: 5000, category: 'Care' },
    { name: 'Bridle Set', price: 12000, category: 'Tack' },
    { name: 'Feed Bucket', price: 2500, category: 'Supplies' },
    { name: 'Hay Bale', price: 1500, category: 'Feed' },
    { name: 'Horse Treats', price: 1200, category: 'Feed' },
    { name: 'Helmet', price: 18000, category: 'Safety' },
    { name: 'Riding Gloves', price: 4500, category: 'Apparel' }
  ];

  const images = [
    'https://images.unsplash.com/photo-1553531087-14524846a44f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800&auto=format&fit=crop'
  ];

  return Array.from({ length: count }).map((_, i) => {
    const product = products[i % products.length];
    const id = `mock_product_${i}`;

    return {
      id,
      kind: 'product' as const,
      display_name: `${product.name} #${i + 1}`,
      description: `Quality ${product.name.toLowerCase()} for all your equestrian needs`,
      image_url: images[i % images.length],
      status: 'active',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: {
        price_cents: product.price,
        category: product.category,
        in_stock: i % 4 !== 0,
        rating: 3.5 + (i % 3) * 0.5
      }
    };
  });
}

export function generateMockBusinesses(count: number) {
  const businesses = [
    { name: "Sarah's Riding Academy", type: 'Training' },
    { name: "Green Valley Tack Shop", type: 'Retail' },
    { name: "Equine Veterinary Clinic", type: 'Services' },
    { name: "Prairie Wind Stables", type: 'Boarding' },
    { name: "Sunset Farrier Services", type: 'Services' },
    { name: "Horse Transport Co", type: 'Logistics' },
    { name: "Meadow Feed & Supply", type: 'Retail' },
    { name: "Elite Equestrian Events", type: 'Events' },
    { name: "Country Trails Guides", type: 'Tourism' },
    { name: "Ranch Equipment Rental", type: 'Services' }
  ];

  const images = [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=800&auto=format&fit=crop'
  ];

  return Array.from({ length: count }).map((_, i) => {
    const business = businesses[i % businesses.length];
    const id = `mock_business_${i}`;

    return {
      id,
      kind: 'business' as const,
      display_name: business.name,
      description: `Professional ${business.type.toLowerCase()} services for the equestrian community`,
      image_url: images[i % images.length],
      status: 'active',
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: {
        type: business.type,
        rating: 4.0 + (i % 2) * 0.5,
        location: 'Local area',
        hours: '9am - 5pm',
        verified: i % 2 === 0
      }
    };
  });
}

// Helper to generate all mock entities at once
export function generateAllMockEntities() {
  return {
    people: generateMockPeople(10),
    homes: generateMockHomes(8),
    farms: generateMockFarms(10),
    products: generateMockProducts(12),
    businesses: generateMockBusinesses(10)
  };
}
