/**
 * Listings Management (redirects to Marketplace)
 * This is primarily for seller management - buyers should use /marketplace
 */

import { Navigate } from 'react-router-dom';

export default function ListingsIndex() {
  return <Navigate to="/marketplace" replace />;
}
