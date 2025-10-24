# Yallbrary Pin API

## Endpoints

### GET /yallbrary_apps
Fetch all public apps in registry
- **Auth**: Required (user role)
- **Response**: `AppMetadata[]`

### GET /yallbrary_pins?user_id=eq.{userId}
Fetch user's pinned apps
- **Auth**: Required (must be owner)
- **Response**: `PinnedApp[]`

### POST /yallbrary_pins
Pin app to dashboard
- **Auth**: Required
- **Body**: `{ user_id, app_id, position }`
- **Response**: `201 Created`

### DELETE /yallbrary_pins?user_id=eq.{userId}&app_id=eq.{appId}
Unpin app
- **Auth**: Required (must be owner)
- **Response**: `204 No Content`

### POST /yallbrary_pins (upsert for reorder)
Reorder pinned apps
- **Auth**: Required
- **Body**: `PinnedApp[]`
- **Response**: `200 OK`

## RLS Policies
- Users can only view/modify their own pins
- All authenticated users can view public apps
- Admins can manage app registry
