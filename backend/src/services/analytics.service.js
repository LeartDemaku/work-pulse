import { dbClient } from '../db/client.js';

// Koment: Eventet ruhen ne DB per raporte te thjeshta pa infrastrukture shtese.
export function trackEvent({ userId = null, role = null, eventKey, eventValue = null, metadata = {} }) {
  dbClient.run(
    'INSERT INTO analytics_events (user_id, role, event_key, event_value, metadata_json) VALUES (?, ?, ?, ?, ?)',
    [userId, role, eventKey, eventValue, JSON.stringify(metadata || {})]
  );
}