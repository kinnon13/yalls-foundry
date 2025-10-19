/**
 * Marketplace Index - Browse Listings
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAllListings } from '@/lib/marketplace/service.supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { formatPrice } from '@/entities/marketplace';
import { Search, ShoppingCart } from 'lucide-react';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';
import { RequestCategoryDialog } from '@/components/marketplace/RequestCategoryDialog';

export default function MarketplaceIndex() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['marketplace-listings', category, search],
    queryFn: () => getAllListings({ category, search: search || undefined }),
  });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">Browse listings across Agriculture, Horse World & more</p>
            </div>
            <div className="flex gap-2">
              <RequestCategoryDialog />
              <Link to="/cart">
                <Button variant="outline" size="sm" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Category Sidebar */}
            <aside className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryFilter
                    selectedCategory={category || null}
                    onCategoryChange={(cat) => setCategory(cat || undefined)}
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={() => setSearch('')} variant="outline">
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Listings Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : !listings || listings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {category ? 'No products in this category yet.' : 'No products found'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <Link key={listing.id} to={`/marketplace/${listing.id}`}>
                  <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                    <CardHeader>
                      {listing.images?.[0] && (
                        <div className="w-full h-48 bg-muted rounded-md mb-4 overflow-hidden">
                          <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {listing.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {formatPrice(listing.base_price_cents)}
                        </span>
                        <Badge variant="secondary">
                          {listing.stock_quantity} in stock
                        </Badge>
                      </div>
                      {listing.category && (
                        <Badge variant="outline" className="mt-2">
                          {listing.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    );
  }
