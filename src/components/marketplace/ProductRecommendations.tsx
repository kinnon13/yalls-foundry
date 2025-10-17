import { Card } from '@/design/components/Card';
import { tokens } from '@/design/tokens';

type ProductRecommendationsProps = {
  listingId: string;
};

export const ProductRecommendations = ({ listingId }: ProductRecommendationsProps) => {
  return (
    <div style={{ marginTop: tokens.space.l }}>
      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.m }}>
        People Also Bought
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          Recommendations coming soon
        </div>
      </Card>
    </div>
  );
};
