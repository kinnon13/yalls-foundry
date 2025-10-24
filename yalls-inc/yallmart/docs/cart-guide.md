# Yallmart Cart Guide

## Features
- One-tap add to cart from social feeds
- Persistent cart (stored in Supabase)
- Quantity management
- Stripe/Venmo checkout
- Order history tracking

## API Endpoints

### GET /yallmart_cart_items
Fetch user's cart
- **Auth**: Required (must be cart owner)
- **Query**: `?user_id=eq.{userId}`
- **Response**: `CartItem[]`

### POST /yallmart_cart_items
Add item to cart
- **Auth**: Required
- **Body**: `{ user_id, product_id, quantity, source_post_id? }`
- **Response**: `201 Created`

### DELETE /yallmart_cart_items
Remove item from cart
- **Auth**: Required (must be cart owner)
- **Query**: `?id=eq.{cartItemId}`
- **Response**: `204 No Content`

### POST /functions/v1/yallmart-checkout
Create Stripe checkout session
- **Auth**: Required
- **Body**: `{ user_id }`
- **Response**: `{ url: string }`

## Integration with Social Feed
Cart items can track `source_post_id` to attribute purchases to specific social posts for analytics and creator commissions.

## RLS Policies
- Users can only view/modify their own cart
- Cart items are deleted when user is deleted (CASCADE)
