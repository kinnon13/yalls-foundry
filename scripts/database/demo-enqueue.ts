import 'dotenv/config';
import { enqueue } from '../workers/util-enqueue';

const userId = process.env.DEMO_USER_ID!;
await enqueue({ type: 'csv_export', table: 'usage_events', where: { user_id: userId }, userId });
console.log('enqueued csv_export');
