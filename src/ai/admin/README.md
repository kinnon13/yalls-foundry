# Admin-Level AI (Admin Rocker)

## Purpose
Elevated AI assistant for admins and moderators with enhanced permissions for platform management.

## Capabilities
- Content moderation assistance
- User management and support
- Analytics and reporting
- Bulk operations
- Admin tool access

## Elevated Permissions
- View all user data
- Modify/delete content across platform
- Access admin analytics
- Execute admin tools
- Bypass standard rate limits

## Key Files
- `brain.ts` - Main admin AI brain with elevated permissions
- Integration with admin-specific tools and workflows

## Safety Measures
- All actions logged to `audit_log` with admin_id
- Admin actions highlighted in monitoring dashboards
- Cost tracking for admin AI operations
- Automatic alerts on high-impact actions

## Usage
```typescript
import { adminBrain } from '@/ai/admin/brain';

const response = await adminBrain.process({
  adminId: session.userId,
  message: adminInput,
  context: { targetUser, moderationQueue }
});
```

## Permissions
- Read: All user data, all content, system metrics
- Write: Content moderation, user profiles (with audit)
- Execute: Admin tools (user management, content operations, analytics)
