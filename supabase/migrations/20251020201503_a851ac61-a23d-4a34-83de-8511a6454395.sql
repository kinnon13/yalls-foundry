-- ============================================
-- Rocker Proactivity Activation (Corrected)
-- User: f6952613-af22-467d-b790-06dfc7efbdbd
-- ============================================

-- 1. Voice Preferences (Enable voice features)
INSERT INTO voice_preferences (
  user_id, 
  allow_voice_calls, 
  allow_voice_messages,
  preferred_voice
)
VALUES (
  'f6952613-af22-467d-b790-06dfc7efbdbd', 
  true, 
  true,
  'alloy'
)
ON CONFLICT (user_id) DO UPDATE SET
  allow_voice_calls = true,
  allow_voice_messages = true,
  updated_at = now();

-- 2. Runtime Flags (Enable proactive features)
INSERT INTO runtime_flags (key, value, description) VALUES
  ('rocker.always_on', '{"enabled": true}', 'Master switch for all Rocker proactivity'),
  ('rocker.daily_checkin', '{"enabled": true, "hour": 9}', 'Morning check-in at 9 AM'),
  ('rocker.evening_wrap', '{"enabled": true, "hour": 20}', 'Evening wrap-up at 8 PM'),
  ('rocker.task_nag', '{"enabled": true, "interval_min": 120, "max_per_day": 3}', 'Task reminders every 2 hours'),
  ('rocker.channel.web', '{"enabled": true}', 'Web notifications enabled'),
  ('rocker.channel.whatsapp', '{"enabled": false}', 'WhatsApp disabled')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- 3. Super Admin Settings (Full permissions)
INSERT INTO super_admin_settings (
  user_id,
  allow_secure_credentials,
  allow_voice_calls,
  allow_voice_messages,
  allow_web_automation,
  allow_autonomous_actions,
  allow_email_sending,
  allow_calendar_access,
  allow_file_operations,
  allow_crm_operations,
  allow_financial_operations,
  rocker_obedience_level,
  rocker_can_refuse_commands
) VALUES (
  'f6952613-af22-467d-b790-06dfc7efbdbd',
  true,   -- secure credentials
  true,   -- voice calls
  true,   -- voice messages
  true,   -- web automation
  true,   -- autonomous actions
  true,   -- email sending
  true,   -- calendar access
  true,   -- file operations
  true,   -- crm operations
  false,  -- financial operations (default off for safety)
  'balanced',
  true    -- can refuse dangerous commands
)
ON CONFLICT (user_id) DO UPDATE SET
  allow_voice_calls = true,
  allow_voice_messages = true,
  allow_autonomous_actions = true,
  allow_calendar_access = true,
  allow_file_operations = true,
  allow_crm_operations = true,
  rocker_obedience_level = 'balanced',
  rocker_can_refuse_commands = true,
  updated_at = now();

-- 4. Create rocker_dm function for notifications
CREATE OR REPLACE FUNCTION public.rocker_dm(
  p_user_id uuid,
  p_text text,
  p_channel text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into notifications table
  INSERT INTO rocker_notifications (user_id, type, title, body, data, read)
  VALUES (
    p_user_id,
    'rocker_message',
    'Rocker',
    p_text,
    jsonb_build_object('channel', p_channel, 'source', 'proactive'),
    false
  );
  
  -- Also insert into outbox if table exists
  BEGIN
    INSERT INTO rocker_outbox (user_id, channel, message_type, content, status)
    VALUES (p_user_id, p_channel, 'proactive', jsonb_build_object('text', p_text), 'pending');
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip
      NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rocker_dm TO authenticated, service_role;

-- 5. Verify configuration
DO $$
DECLARE
  v_voice_prefs int;
  v_flags int;
  v_admin_settings int;
BEGIN
  SELECT COUNT(*) INTO v_voice_prefs FROM voice_preferences 
    WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd' 
    AND allow_voice_messages = true;
  
  SELECT COUNT(*) INTO v_flags FROM runtime_flags WHERE key LIKE 'rocker.%';
  
  SELECT COUNT(*) INTO v_admin_settings FROM super_admin_settings 
    WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd';
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🤖 Rocker Proactivity Config Status';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  Voice Preferences: % (need 1+)', v_voice_prefs;
  RAISE NOTICE '  Runtime Flags: % (need 6)', v_flags;
  RAISE NOTICE '  Super Admin Settings: % (need 1)', v_admin_settings;
  
  IF v_voice_prefs > 0 AND v_flags >= 6 AND v_admin_settings > 0 THEN
    RAISE NOTICE '✅ All proactive config READY!';
    RAISE NOTICE 'Cron jobs enabled in config.toml:';
    RAISE NOTICE '  - rocker-daily-tick (hourly)';
    RAISE NOTICE '  - nightly-gap-scan (2 AM daily)';
    RAISE NOTICE '  - rocker-proactive-sweep (every 6 hours)';
  ELSE
    RAISE WARNING '⚠️ Some config is still missing!';
  END IF;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;