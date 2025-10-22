/**
 * Worker Heartbeat Types
 */

export interface Heartbeat {
  worker_id: string;
  pool: string;
  last_beat: Date;
  load_pct: number;
  version: string;
}

export interface HeartbeatStatus {
  active: boolean;
  lastSeen: Date;
  load: number;
}
