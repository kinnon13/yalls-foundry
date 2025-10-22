export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_capabilities: {
        Row: {
          enabled: boolean
          feature_id: string
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          feature_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          feature_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_capabilities_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: number
          metadata: Json | null
          reason: string | null
          target: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: number
          metadata?: Json | null
          reason?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: number
          metadata?: Json | null
          reason?: string | null
          target?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      affiliate_subscriptions: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          metadata: Json
          referred_user_id: string
          referrer_user_id: string
          status: string
          subscription_type: string
          terminated_at: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          metadata?: Json
          referred_user_id: string
          referrer_user_id: string
          status?: string
          subscription_type: string
          terminated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          metadata?: Json
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
          subscription_type?: string
          terminated_at?: string | null
        }
        Relationships: []
      }
      ai_action_ledger: {
        Row: {
          action: string
          agent: string
          correlation_id: string | null
          hash: string | null
          id: string
          input: Json
          output: Json
          prev_hash: string | null
          result: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          agent: string
          correlation_id?: string | null
          hash?: string | null
          id?: string
          input?: Json
          output?: Json
          prev_hash?: string | null
          result: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          agent?: string
          correlation_id?: string | null
          hash?: string | null
          id?: string
          input?: Json
          output?: Json
          prev_hash?: string | null
          result?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_admin_private_memory: {
        Row: {
          created_at: string | null
          id: string
          key: string
          super_admin_id: string
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          super_admin_id: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          super_admin_id?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_blocklist: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          pattern: string
          target: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          pattern: string
          target: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          pattern?: string
          target?: string
          tenant_id?: string
        }
        Relationships: []
      }
      ai_change_approvals: {
        Row: {
          approver_id: string
          approver_role: string
          created_at: string | null
          decision: string
          id: string
          proposal_id: string | null
          reason: string | null
        }
        Insert: {
          approver_id: string
          approver_role: string
          created_at?: string | null
          decision: string
          id?: string
          proposal_id?: string | null
          reason?: string | null
        }
        Update: {
          approver_id?: string
          approver_role?: string
          created_at?: string | null
          decision?: string
          id?: string
          proposal_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_change_approvals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_change_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_change_proposals: {
        Row: {
          approvals_collected: number | null
          approvals_required: number | null
          approver_policy: Json
          change: Json
          created_at: string | null
          id: string
          requested_by: string
          status: string | null
          target_ref: string
          target_scope: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approvals_collected?: number | null
          approvals_required?: number | null
          approver_policy: Json
          change: Json
          created_at?: string | null
          id?: string
          requested_by: string
          status?: string | null
          target_ref: string
          target_scope: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approvals_collected?: number | null
          approvals_required?: number | null
          approver_policy?: Json
          change?: Json
          created_at?: string | null
          id?: string
          requested_by?: string
          status?: string | null
          target_ref?: string
          target_scope?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_consent: {
        Row: {
          channels: Json
          frequency_cap: number
          proactive_enabled: boolean
          quiet_hours: unknown | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json
          frequency_cap?: number
          proactive_enabled?: boolean
          quiet_hours?: unknown | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json
          frequency_cap?: number
          proactive_enabled?: boolean
          quiet_hours?: unknown | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_control_flags: {
        Row: {
          burst_override: boolean | null
          changed_at: string | null
          external_calls_enabled: boolean | null
          global_pause: boolean | null
          id: string
          last_changed_by: string | null
          last_reason: string | null
          write_freeze: boolean | null
        }
        Insert: {
          burst_override?: boolean | null
          changed_at?: string | null
          external_calls_enabled?: boolean | null
          global_pause?: boolean | null
          id?: string
          last_changed_by?: string | null
          last_reason?: string | null
          write_freeze?: boolean | null
        }
        Update: {
          burst_override?: boolean | null
          changed_at?: string | null
          external_calls_enabled?: boolean | null
          global_pause?: boolean | null
          id?: string
          last_changed_by?: string | null
          last_reason?: string | null
          write_freeze?: boolean | null
        }
        Relationships: []
      }
      ai_control_scopes: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          paused: boolean | null
          reason: string | null
          scope_key: string
          scope_type: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          paused?: boolean | null
          reason?: string | null
          scope_key: string
          scope_type: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          paused?: boolean | null
          reason?: string | null
          scope_key?: string
          scope_type?: string
        }
        Relationships: []
      }
      ai_cron_jobs: {
        Row: {
          created_at: string | null
          cron: string
          enabled: boolean | null
          id: string
          jitter_sec: number | null
          key: string
          last_run_at: string | null
          next_run_at: string | null
          payload: Json | null
          region: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cron: string
          enabled?: boolean | null
          id?: string
          jitter_sec?: number | null
          key: string
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          region?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cron?: string
          enabled?: boolean | null
          id?: string
          jitter_sec?: number | null
          key?: string
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          region?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          region: string
          status: string
          tenant_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          region?: string
          status?: string
          tenant_id: string
          topic: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          region?: string
          status?: string
          tenant_id?: string
          topic?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          kind: string | null
          message: string | null
          meta: Json | null
          payload: Json
          route: string | null
          screenshot_url: string | null
          selector: string | null
          session_id: string | null
          success: boolean | null
          target: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          kind?: string | null
          message?: string | null
          meta?: Json | null
          payload: Json
          route?: string | null
          screenshot_url?: string | null
          selector?: string | null
          session_id?: string | null
          success?: boolean | null
          target?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          kind?: string | null
          message?: string | null
          meta?: Json | null
          payload?: Json
          route?: string | null
          screenshot_url?: string | null
          selector?: string | null
          session_id?: string | null
          success?: boolean | null
          target?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_game_rounds: {
        Row: {
          choices: string[] | null
          created_at: string | null
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["ai_game_kind"]
          question_text: string
          round_no: number
          session_id: string
          state: string
        }
        Insert: {
          choices?: string[] | null
          created_at?: string | null
          created_by: string
          id?: string
          kind: Database["public"]["Enums"]["ai_game_kind"]
          question_text: string
          round_no: number
          session_id: string
          state?: string
        }
        Update: {
          choices?: string[] | null
          created_at?: string | null
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["ai_game_kind"]
          question_text?: string
          round_no?: number
          session_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_game_rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_game_sessions: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_global_knowledge: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          key: string
          source: string
          tags: string[] | null
          tenant_id: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at: string
          value: Json
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key: string
          source?: string
          tags?: string[] | null
          tenant_id: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          value: Json
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          source?: string
          tags?: string[] | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ai_global_patterns: {
        Row: {
          avg_confidence: number | null
          created_at: string
          id: string
          last_observed_at: string
          metadata: Json | null
          occurrence_count: number | null
          pattern_key: string
          pattern_type: string
          success_rate: number | null
          user_count: number | null
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string
          id?: string
          last_observed_at?: string
          metadata?: Json | null
          occurrence_count?: number | null
          pattern_key: string
          pattern_type: string
          success_rate?: number | null
          user_count?: number | null
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string
          id?: string
          last_observed_at?: string
          metadata?: Json | null
          occurrence_count?: number | null
          pattern_key?: string
          pattern_type?: string
          success_rate?: number | null
          user_count?: number | null
        }
        Relationships: []
      }
      ai_hypotheses: {
        Row: {
          confidence: number
          created_at: string | null
          evidence: Json | null
          id: string
          key: string
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          confidence: number
          created_at?: string | null
          evidence?: Json | null
          id?: string
          key: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          confidence?: number
          created_at?: string | null
          evidence?: Json | null
          id?: string
          key?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      ai_interaction_log: {
        Row: {
          business_context: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          improvement_applied: boolean | null
          intent: string
          interaction_type: string
          parameters: Json | null
          result_status: string
          session_id: string | null
          tool_called: string | null
          user_correction: string | null
          user_id: string
        }
        Insert: {
          business_context?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          improvement_applied?: boolean | null
          intent: string
          interaction_type: string
          parameters?: Json | null
          result_status: string
          session_id?: string | null
          tool_called?: string | null
          user_correction?: string | null
          user_id: string
        }
        Update: {
          business_context?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          improvement_applied?: boolean | null
          intent?: string
          interaction_type?: string
          parameters?: Json | null
          result_status?: string
          session_id?: string | null
          tool_called?: string | null
          user_correction?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_job_attempts: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          job_id: string
          ok: boolean | null
          region: string | null
          started_at: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_id: string
          ok?: boolean | null
          region?: string | null
          started_at?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string
          ok?: boolean | null
          region?: string | null
          started_at?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_job_attempts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_job_dlq: {
        Row: {
          created_at: string | null
          from_job_id: string | null
          id: string
          payload: Json | null
          quarantined_at: string | null
          reason: string
          region: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_job_id?: string | null
          id?: string
          payload?: Json | null
          quarantined_at?: string | null
          reason: string
          region?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_job_id?: string | null
          id?: string
          payload?: Json | null
          quarantined_at?: string | null
          reason?: string
          region?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          attempts: number | null
          correlation_id: string | null
          created_at: string | null
          fingerprint: string | null
          id: string
          max_attempts: number | null
          not_before: string | null
          parent_job_id: string | null
          payload: Json | null
          priority: number | null
          region: string | null
          status: string | null
          tenant_id: string
          topic: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          correlation_id?: string | null
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          max_attempts?: number | null
          not_before?: string | null
          parent_job_id?: string | null
          payload?: Json | null
          priority?: number | null
          region?: string | null
          status?: string | null
          tenant_id: string
          topic: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          correlation_id?: string | null
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          max_attempts?: number | null
          not_before?: string | null
          parent_job_id?: string | null
          payload?: Json | null
          priority?: number | null
          region?: string | null
          status?: string | null
          tenant_id?: string
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_kill_events: {
        Row: {
          action: string
          created_at: string | null
          id: string
          key: string | null
          level: string
          reason: string | null
          requested_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          key?: string | null
          level: string
          reason?: string | null
          requested_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          key?: string | null
          level?: string
          reason?: string | null
          requested_by?: string | null
        }
        Relationships: []
      }
      ai_knower_access_log: {
        Row: {
          access_type: string
          accessed_user_id: string
          admin_id: string
          created_at: string
          id: string
          reason: string
        }
        Insert: {
          access_type: string
          accessed_user_id: string
          admin_id: string
          created_at?: string
          id?: string
          reason: string
        }
        Update: {
          access_type?: string
          accessed_user_id?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          body: Json
          correlation_id: string | null
          created_at: string | null
          from_actor: string
          from_user_id: string | null
          id: string
          read_at: string | null
          subject: string | null
          tenant_id: string
          to_actor: string
          to_user_id: string | null
        }
        Insert: {
          body: Json
          correlation_id?: string | null
          created_at?: string | null
          from_actor: string
          from_user_id?: string | null
          id?: string
          read_at?: string | null
          subject?: string | null
          tenant_id: string
          to_actor: string
          to_user_id?: string | null
        }
        Update: {
          body?: Json
          correlation_id?: string | null
          created_at?: string | null
          from_actor?: string
          from_user_id?: string | null
          id?: string
          read_at?: string | null
          subject?: string | null
          tenant_id?: string
          to_actor?: string
          to_user_id?: string | null
        }
        Relationships: []
      }
      ai_model_registry: {
        Row: {
          created_at: string | null
          default_params: Json | null
          enabled: boolean | null
          id: string
          model_id: string
          name: string
          provider: string
          traffic_pct: number | null
          version: string
        }
        Insert: {
          created_at?: string | null
          default_params?: Json | null
          enabled?: boolean | null
          id?: string
          model_id: string
          name: string
          provider: string
          traffic_pct?: number | null
          version: string
        }
        Update: {
          created_at?: string | null
          default_params?: Json | null
          enabled?: boolean | null
          id?: string
          model_id?: string
          name?: string
          provider?: string
          traffic_pct?: number | null
          version?: string
        }
        Relationships: []
      }
      ai_policy_config: {
        Row: {
          required_policy_version: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          required_policy_version?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          required_policy_version?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_policy_rules: {
        Row: {
          action: string
          created_at: string | null
          enabled: boolean | null
          id: string
          matcher: Json
          name: string
          priority: number | null
          scope: string
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          matcher: Json
          name: string
          priority?: number | null
          scope: string
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          matcher?: Json
          name?: string
          priority?: number | null
          scope?: string
          tenant_id?: string
        }
        Relationships: []
      }
      ai_prediction_commits: {
        Row: {
          commit_hash: string
          committed_at: string | null
          id: string
          round_id: string
        }
        Insert: {
          commit_hash: string
          committed_at?: string | null
          id?: string
          round_id: string
        }
        Update: {
          commit_hash?: string
          committed_at?: string | null
          id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prediction_commits_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "ai_game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prediction_reveals: {
        Row: {
          id: string
          prediction_json: Json
          revealed_at: string | null
          round_id: string
          salt: string
        }
        Insert: {
          id?: string
          prediction_json: Json
          revealed_at?: string | null
          round_id: string
          salt: string
        }
        Update: {
          id?: string
          prediction_json?: Json
          revealed_at?: string | null
          round_id?: string
          salt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prediction_reveals_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "ai_game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_preferences: {
        Row: {
          confirm_threshold: number | null
          created_at: string | null
          dnd_end: string | null
          dnd_start: string | null
          id: string
          live_question_cadence: string | null
          max_questions_per_thread: number | null
          silence_ms: number | null
          snoozed_until: string | null
          super_mode: boolean | null
          updated_at: string | null
          user_id: string
          voice_enabled: boolean | null
        }
        Insert: {
          confirm_threshold?: number | null
          created_at?: string | null
          dnd_end?: string | null
          dnd_start?: string | null
          id?: string
          live_question_cadence?: string | null
          max_questions_per_thread?: number | null
          silence_ms?: number | null
          snoozed_until?: string | null
          super_mode?: boolean | null
          updated_at?: string | null
          user_id: string
          voice_enabled?: boolean | null
        }
        Update: {
          confirm_threshold?: number | null
          created_at?: string | null
          dnd_end?: string | null
          dnd_start?: string | null
          id?: string
          live_question_cadence?: string | null
          max_questions_per_thread?: number | null
          silence_ms?: number | null
          snoozed_until?: string | null
          super_mode?: boolean | null
          updated_at?: string | null
          user_id?: string
          voice_enabled?: boolean | null
        }
        Relationships: []
      }
      ai_proactive_log: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          metadata: Json | null
          proposal_id: string | null
          result: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          proposal_id?: string | null
          result?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          proposal_id?: string | null
          result?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_proactive_log_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_promotion_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: number
          notes: string | null
          promotion_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: number
          notes?: string | null
          promotion_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: number
          notes?: string | null
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_promotion_audit_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "ai_promotion_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_promotion_queue: {
        Row: {
          approver_id: string | null
          created_at: string
          from_scope: string
          id: string
          payload: Json
          proposer_id: string
          reason: string | null
          reviewed_at: string | null
          source_ref: Json
          status: string
          tenant_id: string
          to_scope: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          from_scope: string
          id?: string
          payload: Json
          proposer_id: string
          reason?: string | null
          reviewed_at?: string | null
          source_ref: Json
          status?: string
          tenant_id: string
          to_scope: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          from_scope?: string
          id?: string
          payload?: Json
          proposer_id?: string
          reason?: string | null
          reviewed_at?: string | null
          source_ref?: Json
          status?: string
          tenant_id?: string
          to_scope?: string
        }
        Relationships: []
      }
      ai_proposals: {
        Row: {
          created_at: string | null
          due_at: string
          id: string
          payload: Json
          sent_at: string | null
          status: string | null
          tenant_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_at: string
          id?: string
          payload: Json
          sent_at?: string | null
          status?: string | null
          tenant_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_at?: string
          id?: string
          payload?: Json
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_question_events: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          question_hash: string
          question_text: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question_hash: string
          question_text: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question_hash?: string
          question_text?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_question_feedback: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          round_id: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          round_id: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          round_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_question_feedback_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "ai_game_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_question_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quota_counters: {
        Row: {
          api_calls: number | null
          cost_cents: number | null
          created_at: string | null
          jobs_enqueued: number | null
          region: string | null
          tenant_id: string
          tokens: number | null
          updated_at: string | null
          window_start: string
        }
        Insert: {
          api_calls?: number | null
          cost_cents?: number | null
          created_at?: string | null
          jobs_enqueued?: number | null
          region?: string | null
          tenant_id: string
          tokens?: number | null
          updated_at?: string | null
          window_start: string
        }
        Update: {
          api_calls?: number | null
          cost_cents?: number | null
          created_at?: string | null
          jobs_enqueued?: number | null
          region?: string | null
          tenant_id?: string
          tokens?: number | null
          updated_at?: string | null
          window_start?: string
        }
        Relationships: []
      }
      ai_round_scores: {
        Row: {
          brier: number
          computed_at: string | null
          confidence: number
          correct: boolean
          log_loss: number
          round_id: string
        }
        Insert: {
          brier: number
          computed_at?: string | null
          confidence: number
          correct: boolean
          log_loss: number
          round_id: string
        }
        Update: {
          brier?: number
          computed_at?: string | null
          confidence?: number
          correct?: boolean
          log_loss?: number
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_round_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "ai_game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_selector_catalog: {
        Row: {
          id: string
          meta: Json | null
          route: string
          score: number
          selector: string
          target_name: string
          updated_at: string
          votes: number
        }
        Insert: {
          id?: string
          meta?: Json | null
          route: string
          score?: number
          selector: string
          target_name: string
          updated_at?: string
          votes?: number
        }
        Update: {
          id?: string
          meta?: Json | null
          route?: string
          score?: number
          selector?: string
          target_name?: string
          updated_at?: string
          votes?: number
        }
        Relationships: []
      }
      ai_selector_memory: {
        Row: {
          failures: number
          id: string
          last_attempt_at: string | null
          last_success_at: string | null
          meta: Json | null
          route: string
          score: number
          selector: string
          successes: number
          target_name: string
          user_id: string
        }
        Insert: {
          failures?: number
          id?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          meta?: Json | null
          route: string
          score?: number
          selector: string
          successes?: number
          target_name: string
          user_id: string
        }
        Update: {
          failures?: number
          id?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          meta?: Json | null
          route?: string
          score?: number
          selector?: string
          successes?: number
          target_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_selector_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          actor_role: string
          ended_at: string | null
          id: string
          model_id: string
          params: Json | null
          started_at: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          actor_role: string
          ended_at?: string | null
          id?: string
          model_id: string
          params?: Json | null
          started_at?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          actor_role?: string
          ended_at?: string | null
          id?: string
          model_id?: string
          params?: Json | null
          started_at?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_thread_prefs: {
        Row: {
          created_at: string | null
          snoozed_until: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          snoozed_until?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          snoozed_until?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_triggers: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          kind: string
          matcher: Json
          name: string
          priority: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          kind: string
          matcher: Json
          name: string
          priority?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          kind?: string
          matcher?: Json
          name?: string
          priority?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      ai_user_analytics: {
        Row: {
          calculated_at: string
          compared_to: number | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          percentile: number | null
          user_id: string
        }
        Insert: {
          calculated_at?: string
          compared_to?: number | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          percentile?: number | null
          user_id: string
        }
        Update: {
          calculated_at?: string
          compared_to?: number | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          percentile?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_user_answers: {
        Row: {
          answer_index: number
          answered_at: string | null
          id: string
          round_id: string
        }
        Insert: {
          answer_index: number
          answered_at?: string | null
          id?: string
          round_id: string
        }
        Update: {
          answer_index?: number
          answered_at?: string | null
          id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_user_answers_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "ai_game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_consent: {
        Row: {
          cadence: string | null
          consented_at: string | null
          email_opt_in: boolean
          id: string
          ip: unknown | null
          policy_version: string
          proactive_enabled: boolean | null
          push_opt_in: boolean
          quiet_hours: unknown | null
          scopes: string[] | null
          site_opt_in: boolean
          sms_opt_in: boolean
          tenant_id: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          cadence?: string | null
          consented_at?: string | null
          email_opt_in?: boolean
          id?: string
          ip?: unknown | null
          policy_version?: string
          proactive_enabled?: boolean | null
          push_opt_in?: boolean
          quiet_hours?: unknown | null
          scopes?: string[] | null
          site_opt_in?: boolean
          sms_opt_in?: boolean
          tenant_id: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          cadence?: string | null
          consented_at?: string | null
          email_opt_in?: boolean
          id?: string
          ip?: unknown | null
          policy_version?: string
          proactive_enabled?: boolean | null
          push_opt_in?: boolean
          quiet_hours?: unknown | null
          scopes?: string[] | null
          site_opt_in?: boolean
          sms_opt_in?: boolean
          tenant_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_user_memory: {
        Row: {
          confidence: number | null
          created_at: string
          embedding: string | null
          expires_at: string | null
          id: string
          key: string
          last_used_at: string | null
          namespace: string | null
          originator_profile_id: string | null
          pinned: boolean | null
          provenance: Json | null
          safety_category: string | null
          scope: string | null
          sensitivity: string | null
          shared_with: string[] | null
          source: string
          tags: string[] | null
          tenant_id: string
          tone: string | null
          toxicity: number | null
          type: Database["public"]["Enums"]["memory_type"]
          updated_at: string
          use_count: number | null
          user_id: string
          value: Json
          visibility: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key: string
          last_used_at?: string | null
          namespace?: string | null
          originator_profile_id?: string | null
          pinned?: boolean | null
          provenance?: Json | null
          safety_category?: string | null
          scope?: string | null
          sensitivity?: string | null
          shared_with?: string[] | null
          source?: string
          tags?: string[] | null
          tenant_id: string
          tone?: string | null
          toxicity?: number | null
          type: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          use_count?: number | null
          user_id: string
          value: Json
          visibility?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          last_used_at?: string | null
          namespace?: string | null
          originator_profile_id?: string | null
          pinned?: boolean | null
          provenance?: Json | null
          safety_category?: string | null
          scope?: string | null
          sensitivity?: string | null
          shared_with?: string[] | null
          source?: string
          tags?: string[] | null
          tenant_id?: string
          tone?: string | null
          toxicity?: number | null
          type?: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          use_count?: number | null
          user_id?: string
          value?: Json
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_user_memory_originator_profile_id_fkey"
            columns: ["originator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_privacy: {
        Row: {
          created_at: string
          hidden_from_admins: boolean | null
          hidden_from_specific_admins: string[] | null
          id: string
          managed_by_super_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden_from_admins?: boolean | null
          hidden_from_specific_admins?: string[] | null
          id?: string
          managed_by_super_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden_from_admins?: boolean | null
          hidden_from_specific_admins?: string[] | null
          id?: string
          managed_by_super_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_worker_heartbeats: {
        Row: {
          created_at: string | null
          id: string
          last_beat: string
          load_pct: number | null
          pool: string
          region: string | null
          tenant_id: string | null
          updated_at: string | null
          version: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_beat?: string
          load_pct?: number | null
          pool: string
          region?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          version?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_beat?: string
          load_pct?: number | null
          pool?: string
          region?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          version?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      ai_worker_pools: {
        Row: {
          burst_concurrency: number
          created_at: string | null
          current_concurrency: number | null
          id: string
          max_concurrency: number
          min_concurrency: number
          pool: string
          region: string | null
          tenant_id: string | null
          topic_glob: string
          updated_at: string | null
        }
        Insert: {
          burst_concurrency?: number
          created_at?: string | null
          current_concurrency?: number | null
          id?: string
          max_concurrency?: number
          min_concurrency?: number
          pool: string
          region?: string | null
          tenant_id?: string | null
          topic_glob: string
          updated_at?: string | null
        }
        Update: {
          burst_concurrency?: number
          created_at?: string | null
          current_concurrency?: number | null
          id?: string
          max_concurrency?: number
          min_concurrency?: number
          pool?: string
          region?: string | null
          tenant_id?: string | null
          topic_glob?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      andy_learning_log: {
        Row: {
          applied_count: number | null
          confidence: number | null
          from_content: string
          id: string
          learned_at: string | null
          learning_type: string
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          user_id: string
          what_learned: string
        }
        Insert: {
          applied_count?: number | null
          confidence?: number | null
          from_content: string
          id?: string
          learned_at?: string | null
          learning_type: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
          what_learned: string
        }
        Update: {
          applied_count?: number | null
          confidence?: number | null
          from_content?: string
          id?: string
          learned_at?: string | null
          learning_type?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
          what_learned?: string
        }
        Relationships: [
          {
            foreignKeyName: "andy_learning_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      andy_memory_enhancements: {
        Row: {
          confidence: number | null
          created_at: string | null
          enhanced_content: Json
          enhancement_type: string
          id: string
          metadata: Json | null
          original_content: string
          reasoning: string
          source_knowledge_id: string | null
          source_memory_id: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          enhanced_content: Json
          enhancement_type: string
          id?: string
          metadata?: Json | null
          original_content: string
          reasoning: string
          source_knowledge_id?: string | null
          source_memory_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          enhanced_content?: Json
          enhancement_type?: string
          id?: string
          metadata?: Json | null
          original_content?: string
          reasoning?: string
          source_knowledge_id?: string | null
          source_memory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andy_memory_enhancements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      andy_prediction_game: {
        Row: {
          andy_confidence: number
          andy_prediction: string
          answered_at: string | null
          based_on_analysis: string | null
          based_on_memories: string[] | null
          created_at: string | null
          game_date: string
          game_session_id: string
          id: string
          is_correct: boolean | null
          options: Json | null
          question_number: number
          question_text: string
          question_type: string
          session_number: number
          user_actual_answer: string | null
          user_id: string
        }
        Insert: {
          andy_confidence: number
          andy_prediction: string
          answered_at?: string | null
          based_on_analysis?: string | null
          based_on_memories?: string[] | null
          created_at?: string | null
          game_date: string
          game_session_id: string
          id?: string
          is_correct?: boolean | null
          options?: Json | null
          question_number: number
          question_text: string
          question_type: string
          session_number: number
          user_actual_answer?: string | null
          user_id: string
        }
        Update: {
          andy_confidence?: number
          andy_prediction?: string
          answered_at?: string | null
          based_on_analysis?: string | null
          based_on_memories?: string[] | null
          created_at?: string | null
          game_date?: string
          game_session_id?: string
          id?: string
          is_correct?: boolean | null
          options?: Json | null
          question_number?: number
          question_text?: string
          question_type?: string
          session_number?: number
          user_actual_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andy_prediction_game_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      andy_prediction_stats: {
        Row: {
          accuracy_rate: number | null
          category: string
          confidence_avg: number | null
          correct_predictions: number | null
          id: string
          learning_insights: Json | null
          stat_date: string
          total_predictions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          category: string
          confidence_avg?: number | null
          correct_predictions?: number | null
          id?: string
          learning_insights?: Json | null
          stat_date: string
          total_predictions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_rate?: number | null
          category?: string
          confidence_avg?: number | null
          correct_predictions?: number | null
          id?: string
          learning_insights?: Json | null
          stat_date?: string
          total_predictions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andy_prediction_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      andy_research: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          metadata: Json | null
          research_type: string
          source_memory_ids: string[] | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          metadata?: Json | null
          research_type: string
          source_memory_ids?: string[] | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          metadata?: Json | null
          research_type?: string
          source_memory_ids?: string[] | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andy_research_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_catalog: {
        Row: {
          category: string | null
          config_schema: Json | null
          created_at: string | null
          icon: string | null
          key: string
          name: string
          pricing: string | null
          scopes: string[] | null
          summary: string | null
        }
        Insert: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          icon?: string | null
          key: string
          name: string
          pricing?: string | null
          scopes?: string[] | null
          summary?: string | null
        }
        Update: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          icon?: string | null
          key?: string
          name?: string
          pricing?: string | null
          scopes?: string[] | null
          summary?: string | null
        }
        Relationships: []
      }
      app_provider_secrets: {
        Row: {
          created_at: string
          enc_api_key: string
          id: string
          last_used_at: string | null
          name: string
          owner_user_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enc_api_key: string
          id?: string
          last_used_at?: string | null
          name?: string
          owner_user_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enc_api_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          owner_user_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      appearance_settings: {
        Row: {
          id: string
          screensaver_payload: Json | null
          subject_id: string
          subject_type: string
          updated_at: string
          wallpaper_url: string | null
        }
        Insert: {
          id?: string
          screensaver_payload?: Json | null
          subject_id: string
          subject_type: string
          updated_at?: string
          wallpaper_url?: string | null
        }
        Update: {
          id?: string
          screensaver_payload?: Json | null
          subject_id?: string
          subject_type?: string
          updated_at?: string
          wallpaper_url?: string | null
        }
        Relationships: []
      }
      apps: {
        Row: {
          created_at: string | null
          deeplink_template: string
          icon_url: string | null
          id: string
          is_core: boolean | null
          name: string
          tagline: string | null
        }
        Insert: {
          created_at?: string | null
          deeplink_template?: string
          icon_url?: string | null
          id: string
          is_core?: boolean | null
          name: string
          tagline?: string | null
        }
        Update: {
          created_at?: string | null
          deeplink_template?: string
          icon_url?: string | null
          id?: string
          is_core?: boolean | null
          name?: string
          tagline?: string | null
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          id: string
          meta: Json
        }
        Insert: {
          id: string
          meta?: Json
        }
        Update: {
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      boarders: {
        Row: {
          board_type: string
          business_id: string
          created_at: string
          emergency_contact: Json | null
          end_date: string | null
          horse_entity_id: string | null
          id: string
          monthly_rate_cents: number
          profile_id: string
          special_needs: Json | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          board_type: string
          business_id: string
          created_at?: string
          emergency_contact?: Json | null
          end_date?: string | null
          horse_entity_id?: string | null
          id?: string
          monthly_rate_cents: number
          profile_id: string
          special_needs?: Json | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          board_type?: string
          business_id?: string
          created_at?: string
          emergency_contact?: Json | null
          end_date?: string | null
          horse_entity_id?: string | null
          id?: string
          monthly_rate_cents?: number
          profile_id?: string
          special_needs?: Json | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boarders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boarders_horse_entity_id_fkey"
            columns: ["horse_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boarders_horse_entity_id_fkey"
            columns: ["horse_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "boarders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_tasks: {
        Row: {
          claimed_by: string | null
          completed_at: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          requirements: Json
          reward_cents: number
          status: string | null
          task_type: string
          title: string
        }
        Insert: {
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          requirements?: Json
          reward_cents: number
          status?: string | null
          task_type: string
          title: string
        }
        Update: {
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          requirements?: Json
          reward_cents?: number
          status?: string | null
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_tasks_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_records: {
        Row: {
          breeding_date: string
          created_at: string
          created_by: string
          foal_entity_id: string | null
          id: string
          mare_entity_id: string
          notes: string | null
          outcome: string | null
          stallion_entity_id: string
          updated_at: string
        }
        Insert: {
          breeding_date: string
          created_at?: string
          created_by: string
          foal_entity_id?: string | null
          id?: string
          mare_entity_id: string
          notes?: string | null
          outcome?: string | null
          stallion_entity_id: string
          updated_at?: string
        }
        Update: {
          breeding_date?: string
          created_at?: string
          created_by?: string
          foal_entity_id?: string | null
          id?: string
          mare_entity_id?: string
          notes?: string | null
          outcome?: string | null
          stallion_entity_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_records_foal_entity_id_fkey"
            columns: ["foal_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_foal_entity_id_fkey"
            columns: ["foal_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "breeding_records_mare_entity_id_fkey"
            columns: ["mare_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_mare_entity_id_fkey"
            columns: ["mare_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "breeding_records_stallion_entity_id_fkey"
            columns: ["stallion_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_stallion_entity_id_fkey"
            columns: ["stallion_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      business_kpi_snapshots: {
        Row: {
          active_users: number | null
          ai_interactions: number | null
          ai_success_rate: number | null
          business_id: string | null
          created_at: string | null
          engagement_score: number | null
          id: string
          revenue_cents: number | null
          snapshot_date: string
          total_users: number | null
          trends: Json | null
        }
        Insert: {
          active_users?: number | null
          ai_interactions?: number | null
          ai_success_rate?: number | null
          business_id?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          revenue_cents?: number | null
          snapshot_date: string
          total_users?: number | null
          trends?: Json | null
        }
        Update: {
          active_users?: number | null
          ai_interactions?: number | null
          ai_success_rate?: number | null
          business_id?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          revenue_cents?: number | null
          snapshot_date?: string
          total_users?: number | null
          trends?: Json | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          meta: Json | null
          name: string
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          meta?: Json | null
          name: string
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          name?: string
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_team: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_team_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          capabilities: Json | null
          created_at: string
          created_by: string
          description: string | null
          frozen: boolean
          frozen_reason: string | null
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          frozen?: boolean
          frozen_reason?: string | null
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          frozen?: boolean
          frozen_reason?: string | null
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_collection_members: {
        Row: {
          calendar_id: string
          collection_id: string
        }
        Insert: {
          calendar_id: string
          collection_id: string
        }
        Update: {
          calendar_id?: string
          collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_collection_members_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "calendar_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_collection_shares: {
        Row: {
          collection_id: string
          created_at: string
          profile_id: string
          role: Database["public"]["Enums"]["calendar_role"]
        }
        Insert: {
          collection_id: string
          created_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["calendar_role"]
        }
        Update: {
          collection_id?: string
          created_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["calendar_role"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "calendar_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_profile_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_profile_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_attendees: {
        Row: {
          event_id: string
          profile_id: string
          response_at: string | null
          status: string
        }
        Insert: {
          event_id: string
          profile_id: string
          response_at?: string | null
          status?: string
        }
        Update: {
          event_id?: string
          profile_id?: string
          response_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          sent_at: string | null
          trigger_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          sent_at?: string | null
          trigger_at: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          sent_at?: string | null
          trigger_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          calendar_id: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          event_type: string | null
          id: string
          location: string | null
          metadata: Json | null
          recurrence_freq: Database["public"]["Enums"]["recurrence_freq"] | null
          recurrence_rule: string | null
          starts_at: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          all_day?: boolean | null
          calendar_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at: string
          event_type?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          recurrence_freq?:
            | Database["public"]["Enums"]["recurrence_freq"]
            | null
          recurrence_rule?: string | null
          starts_at: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          event_type?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          recurrence_freq?:
            | Database["public"]["Enums"]["recurrence_freq"]
            | null
          recurrence_rule?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_shares: {
        Row: {
          calendar_id: string
          created_at: string
          profile_id: string
          role: Database["public"]["Enums"]["calendar_role"]
        }
        Insert: {
          calendar_id: string
          created_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["calendar_role"]
        }
        Update: {
          calendar_id?: string
          created_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["calendar_role"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_shares_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          calendar_type: Database["public"]["Enums"]["calendar_type"]
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_profile_id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          calendar_type?: Database["public"]["Enums"]["calendar_type"]
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_profile_id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          calendar_type?: Database["public"]["Enums"]["calendar_type"]
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_profile_id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      capability_gaps: {
        Row: {
          created_at: string
          id: string
          section: string
          status: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          section: string
          status?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          section?: string
          status?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      care_plans: {
        Row: {
          created_at: string
          horse_id: string
          id: string
          schedule: Json
          title: string
        }
        Insert: {
          created_at?: string
          horse_id: string
          id?: string
          schedule?: Json
          title: string
        }
        Update: {
          created_at?: string
          horse_id?: string
          id?: string
          schedule?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "farm_horses"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_bounties: {
        Row: {
          amount_cents: number
          claim_id: string
          contributor_user_id: string
          created_at: string
          entity_id: string
          id: string
          status: string
          window_days: number
          within_window: boolean
        }
        Insert: {
          amount_cents?: number
          claim_id: string
          contributor_user_id: string
          created_at?: string
          entity_id: string
          id?: string
          status?: string
          window_days: number
          within_window: boolean
        }
        Update: {
          amount_cents?: number
          claim_id?: string
          contributor_user_id?: string
          created_at?: string
          entity_id?: string
          id?: string
          status?: string
          window_days?: number
          within_window?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "claim_bounties_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "entity_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_bounties_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_bounties_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      claim_events: {
        Row: {
          actor_user_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          new_owner_id: string | null
          previous_owner_id: string | null
        }
        Insert: {
          actor_user_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          new_owner_id?: string | null
          previous_owner_id?: string | null
        }
        Update: {
          actor_user_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          new_owner_id?: string | null
          previous_owner_id?: string | null
        }
        Relationships: []
      }
      combined_memory_files: {
        Row: {
          andy_research_ids: string[] | null
          confidence: number | null
          content: Json
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          merge_reasoning: string | null
          metadata: Json | null
          parent_file_id: string | null
          updated_at: string | null
          user_id: string
          user_memory_ids: string[] | null
        }
        Insert: {
          andy_research_ids?: string[] | null
          confidence?: number | null
          content: Json
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          merge_reasoning?: string | null
          metadata?: Json | null
          parent_file_id?: string | null
          updated_at?: string | null
          user_id: string
          user_memory_ids?: string[] | null
        }
        Update: {
          andy_research_ids?: string[] | null
          confidence?: number | null
          content?: Json
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          merge_reasoning?: string | null
          metadata?: Json | null
          parent_file_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_memory_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "combined_memory_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "combined_memory_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combined_memory_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_ledger: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          redirected_to_platform: boolean | null
          reversal_of_id: string | null
          reversed_at: string | null
          settlement_batch_id: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          redirected_to_platform?: boolean | null
          reversal_of_id?: string | null
          reversed_at?: string | null
          settlement_batch_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          redirected_to_platform?: boolean | null
          reversal_of_id?: string | null
          reversed_at?: string | null
          settlement_batch_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_reversal_of_id_fkey"
            columns: ["reversal_of_id"]
            isOneToOne: false
            referencedRelation: "commission_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_policy: {
        Row: {
          id: boolean
          min_payout_cents: number | null
          self_referral_allowed: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: boolean
          min_payout_cents?: number | null
          self_referral_allowed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: boolean
          min_payout_cents?: number | null
          self_referral_allowed?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_edges: {
        Row: {
          created_at: string
          edge_type: string
          entity_id: string
          id: string
          scope: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          edge_type: string
          entity_id: string
          id?: string
          scope?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          edge_type?: string
          entity_id?: string
          id?: string
          scope?: Json
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          metadata: Json
          object_id: string
          object_type: string
          relation: string
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          object_id: string
          object_type: string
          relation: string
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          object_id?: string
          object_type?: string
          relation?: string
          subject_id?: string
          subject_type?: string
        }
        Relationships: []
      }
      contact_identities: {
        Row: {
          contact_id: string
          created_at: string
          tenant_id: string
          type: string
          value: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          tenant_id?: string
          type: string
          value: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          tenant_id?: string
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_identities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          meta: Json | null
          owner_user_id: string
          phone: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          meta?: Json | null
          owner_user_id: string
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          meta?: Json | null
          owner_user_id?: string
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      contributors: {
        Row: {
          bounties_logged_cents: number
          created_at: string
          entities_claimed: number
          entities_created: number
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bounties_logged_cents?: number
          created_at?: string
          entities_claimed?: number
          entities_created?: number
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bounties_logged_cents?: number
          created_at?: string
          entities_claimed?: number
          entities_created?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          last_message_at: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          last_message_at?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          last_message_at?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          business_id: string
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          value: number | null
        }
        Insert: {
          activity_type: string
          business_id: string
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          value?: number | null
        }
        Update: {
          activity_type?: string
          business_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          business_id: string
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          status: string
          tags: Json
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          tags?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          tags?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          anonymous_id: string | null
          contact_hint: Json | null
          contact_id: string | null
          created_at: string
          data: Json
          happened_at: string
          id: string
          kind: string | null
          owner_user_id: string | null
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_10: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_10_v2: {
        Row: {
          anonymous_id: string | null
          contact_hint: Json | null
          contact_id: string | null
          created_at: string
          data: Json
          happened_at: string
          id: string
          kind: string | null
          owner_user_id: string | null
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_11: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_11_v2: {
        Row: {
          anonymous_id: string | null
          contact_hint: Json | null
          contact_id: string | null
          created_at: string
          data: Json
          happened_at: string
          id: string
          kind: string | null
          owner_user_id: string | null
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_12: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2025_12_v2: {
        Row: {
          anonymous_id: string | null
          contact_hint: Json | null
          contact_id: string | null
          created_at: string
          data: Json
          happened_at: string
          id: string
          kind: string | null
          owner_user_id: string | null
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          data?: Json
          happened_at?: string
          id?: string
          kind?: string | null
          owner_user_id?: string | null
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2026_01: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2026_02: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_2026_03: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_default: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_old: {
        Row: {
          anonymous_id: string | null
          contact_hint: Json | null
          contact_id: string | null
          created_at: string
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type: string
        }
        Update: {
          anonymous_id?: string | null
          contact_hint?: Json | null
          contact_id?: string | null
          created_at?: string
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: []
      }
      crm_events_partitioned: {
        Row: {
          contact_hint: Json | null
          contact_id: string | null
          id: string
          props: Json
          source: string
          tenant_id: string
          ts: string
          type: string
        }
        Insert: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id: string
          ts?: string
          type: string
        }
        Update: {
          contact_hint?: Json | null
          contact_id?: string | null
          id?: string
          props?: Json
          source?: string
          tenant_id?: string
          ts?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_events_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefs: {
        Row: {
          blockers: Json | null
          brief_date: string
          created_at: string
          goals_progress: Json | null
          high_leverage_moves: Json | null
          id: string
          schedule: Json | null
          user_id: string
        }
        Insert: {
          blockers?: Json | null
          brief_date: string
          created_at?: string
          goals_progress?: Json | null
          high_leverage_moves?: Json | null
          id?: string
          schedule?: Json | null
          user_id: string
        }
        Update: {
          blockers?: Json | null
          brief_date?: string
          created_at?: string
          goals_progress?: Json | null
          high_leverage_moves?: Json | null
          id?: string
          schedule?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      discovery_items: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_id: string
          item_type: string
          metadata: Json | null
          relevance_score: number | null
          trending_score: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id: string
          item_type: string
          metadata?: Json | null
          relevance_score?: number | null
          trending_score?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          metadata?: Json | null
          relevance_score?: number | null
          trending_score?: number | null
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["draft_kind"]
          payload: Json
          profile_id: string | null
          status: Database["public"]["Enums"]["draft_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["draft_kind"]
          payload?: Json
          profile_id?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["draft_kind"]
          payload?: Json
          profile_id?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          class_id: string
          created_at: string
          entry_id: string
          go_time: string | null
          id: string
          is_slack: boolean
          perf_label: string | null
          position: number
          round: number
        }
        Insert: {
          class_id: string
          created_at?: string
          entry_id: string
          go_time?: string | null
          id?: string
          is_slack?: boolean
          perf_label?: string | null
          position: number
          round?: number
        }
        Update: {
          class_id?: string
          created_at?: string
          entry_id?: string
          go_time?: string | null
          id?: string
          is_slack?: boolean
          perf_label?: string | null
          position?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "draws_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "event_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_sync_state: {
        Row: {
          created_at: string | null
          drive_folder_id: string
          enabled: boolean | null
          folder_name: string
          id: string
          last_sync_at: string | null
          next_page_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drive_folder_id: string
          enabled?: boolean | null
          folder_name: string
          id?: string
          last_sync_at?: string | null
          next_page_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          drive_folder_id?: string
          enabled?: boolean | null
          folder_name?: string
          id?: string
          last_sync_at?: string | null
          next_page_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dynamic_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_ai_suggested: boolean
          name: string
          parent_category_id: string | null
          slug: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_ai_suggested?: boolean
          name: string
          parent_category_id?: string | null
          slug: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_ai_suggested?: boolean
          name?: string
          parent_category_id?: string | null
          slug?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "dynamic_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_inbound: {
        Row: {
          attachments: Json | null
          created_at: string | null
          from_addr: string
          headers: Json | null
          html_body: string | null
          id: string
          msg_id: string | null
          processed: boolean | null
          processed_at: string | null
          raw_payload: Json | null
          rocker_thread_id: string | null
          subject: string | null
          tenant_id: string | null
          text_body: string | null
          to_addr: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          from_addr: string
          headers?: Json | null
          html_body?: string | null
          id?: string
          msg_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload?: Json | null
          rocker_thread_id?: string | null
          subject?: string | null
          tenant_id?: string | null
          text_body?: string | null
          to_addr: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          from_addr?: string
          headers?: Json | null
          html_body?: string | null
          id?: string
          msg_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload?: Json | null
          rocker_thread_id?: string | null
          subject?: string | null
          tenant_id?: string | null
          text_body?: string | null
          to_addr?: string
        }
        Relationships: []
      }
      embedding_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          knowledge_id: string
          last_error: string | null
          priority: number
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          knowledge_id: string
          last_error?: string | null
          priority?: number
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          knowledge_id?: string
          last_error?: string | null
          priority?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_jobs_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "rocker_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          contributor_window_days: number
          created_at: string
          created_by_user_id: string | null
          display_name: string
          handle: string | null
          handle_lower: string | null
          id: string
          is_mock: boolean | null
          kind: Database["public"]["Enums"]["entity_kind"]
          metadata: Json
          name_key: string | null
          owner_user_id: string | null
          provenance: Json
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          window_expires_at: string | null
        }
        Insert: {
          contributor_window_days?: number
          created_at?: string
          created_by_user_id?: string | null
          display_name: string
          handle?: string | null
          handle_lower?: string | null
          id?: string
          is_mock?: boolean | null
          kind: Database["public"]["Enums"]["entity_kind"]
          metadata?: Json
          name_key?: string | null
          owner_user_id?: string | null
          provenance?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          window_expires_at?: string | null
        }
        Update: {
          contributor_window_days?: number
          created_at?: string
          created_by_user_id?: string | null
          display_name?: string
          handle?: string | null
          handle_lower?: string | null
          id?: string
          is_mock?: boolean | null
          kind?: Database["public"]["Enums"]["entity_kind"]
          metadata?: Json
          name_key?: string | null
          owner_user_id?: string | null
          provenance?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          window_expires_at?: string | null
        }
        Relationships: []
      }
      entitlement_override_audit: {
        Row: {
          action: string
          actor_user_id: string
          allow: boolean | null
          created_at: string
          feature_id: string
          id: number
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          allow?: boolean | null
          created_at?: string
          feature_id: string
          id?: number
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          allow?: boolean | null
          created_at?: string
          feature_id?: string
          id?: number
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      entitlement_overrides: {
        Row: {
          allow: boolean
          created_at: string
          feature_id: string | null
          id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          allow: boolean
          created_at?: string
          feature_id?: string | null
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          allow?: boolean
          created_at?: string
          feature_id?: string | null
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_overrides_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_overrides_fk_feature"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_claims: {
        Row: {
          claimant_user_id: string
          claimed_at: string
          contact_target: string | null
          created_at: string
          entity_id: string
          evidence: Json
          first_seen_at: string | null
          id: string
          method: Database["public"]["Enums"]["claim_method"]
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          token_expires_at: string | null
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          claimant_user_id: string
          claimed_at?: string
          contact_target?: string | null
          created_at?: string
          entity_id: string
          evidence?: Json
          first_seen_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["claim_method"]
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          claimant_user_id?: string
          claimed_at?: string
          contact_target?: string | null
          created_at?: string
          entity_id?: string
          evidence?: Json
          first_seen_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["claim_method"]
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          token_expires_at?: string | null
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_claims_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_claims_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      entity_edges: {
        Row: {
          allow_crosspost: boolean | null
          auto_propagate: boolean | null
          created_at: string | null
          id: string
          metadata: Json | null
          object_entity_id: string
          relation_type: string
          status: string | null
          subject_entity_id: string
          updated_at: string | null
        }
        Insert: {
          allow_crosspost?: boolean | null
          auto_propagate?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object_entity_id: string
          relation_type: string
          status?: string | null
          subject_entity_id: string
          updated_at?: string | null
        }
        Update: {
          allow_crosspost?: boolean | null
          auto_propagate?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object_entity_id?: string
          relation_type?: string
          status?: string | null
          subject_entity_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_edges_object_entity_id_fkey"
            columns: ["object_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_edges_object_entity_id_fkey"
            columns: ["object_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "entity_edges_subject_entity_id_fkey"
            columns: ["subject_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_edges_subject_entity_id_fkey"
            columns: ["subject_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      entity_ingest_log: {
        Row: {
          action: string | null
          by_user_id: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          reason: string | null
          unknown_memory_id: string | null
        }
        Insert: {
          action?: string | null
          by_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          unknown_memory_id?: string | null
        }
        Update: {
          action?: string | null
          by_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          unknown_memory_id?: string | null
        }
        Relationships: []
      }
      entity_interests: {
        Row: {
          entity_id: string
          interest_id: string
          relevance: number
          updated_at: string
        }
        Insert: {
          entity_id: string
          interest_id: string
          relevance?: number
          updated_at?: string
        }
        Update: {
          entity_id?: string
          interest_id?: string
          relevance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_interests_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_interests_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "entity_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_members: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          member_user_id: string
          permissions: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          member_user_id: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          member_user_id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_members_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_members_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      entity_profiles: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          normalized_name: string | null
          owner_id: string | null
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_profiles_2025_01: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          normalized_name: string | null
          owner_id: string | null
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_profiles_2025_02: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          normalized_name: string | null
          owner_id: string | null
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_profiles_2025_03: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          normalized_name: string | null
          owner_id: string | null
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          normalized_name?: string | null
          owner_id?: string | null
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_ui_prefs: {
        Row: {
          entity_id: string
          prefs: Json
          updated_at: string
        }
        Insert: {
          entity_id: string
          prefs?: Json
          updated_at?: string
        }
        Update: {
          entity_id?: string
          prefs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_ui_prefs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_ui_prefs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      entries: {
        Row: {
          back_number: number | null
          class_id: string
          created_at: string
          fees_cents: number
          horse_entity_id: string | null
          id: string
          rider_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          back_number?: number | null
          class_id: string
          created_at?: string
          fees_cents?: number
          horse_entity_id?: string | null
          id?: string
          rider_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          back_number?: number | null
          class_id?: string
          created_at?: string
          fees_cents?: number
          horse_entity_id?: string | null
          id?: string
          rider_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "event_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_horse_entity_id_fkey"
            columns: ["horse_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_horse_entity_id_fkey"
            columns: ["horse_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      entry_checkin_log: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          entry_id: string
          id: string
          metadata: Json | null
          method: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          entry_id: string
          id?: string
          metadata?: Json | null
          method?: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          entry_id?: string
          id?: string
          metadata?: Json | null
          method?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_checkin_log_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      event_classes: {
        Row: {
          added_money_cents: number
          created_at: string
          discipline: string
          event_id: string
          fees_jsonb: Json
          id: string
          key: string
          max_entries: number | null
          rules_md: string | null
          schedule_block: string | null
          title: string
          updated_at: string
        }
        Insert: {
          added_money_cents?: number
          created_at?: string
          discipline: string
          event_id: string
          fees_jsonb?: Json
          id?: string
          key: string
          max_entries?: number | null
          rules_md?: string | null
          schedule_block?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          added_money_cents?: number
          created_at?: string
          discipline?: string
          event_id?: string
          fees_jsonb?: Json
          id?: string
          key?: string
          max_entries?: number | null
          rules_md?: string | null
          schedule_block?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_classes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_type: string
          host_entity_id: string | null
          host_profile_id: string | null
          id: string
          incentive_id: string | null
          kind: Database["public"]["Enums"]["event_kind"] | null
          location: Json | null
          slug: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          event_type: string
          host_entity_id?: string | null
          host_profile_id?: string | null
          id?: string
          incentive_id?: string | null
          kind?: Database["public"]["Enums"]["event_kind"] | null
          location?: Json | null
          slug: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          host_entity_id?: string | null
          host_profile_id?: string | null
          id?: string
          incentive_id?: string | null
          kind?: Database["public"]["Enums"]["event_kind"] | null
          location?: Json | null
          slug?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_entity_id_fkey"
            columns: ["host_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_entity_id_fkey"
            columns: ["host_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "events_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "incentives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["incentive_id"]
          },
        ]
      }
      events_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          payload: Json
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          payload?: Json
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          payload?: Json
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      farm_horses: {
        Row: {
          created_at: string
          dob: string | null
          id: string
          name: string
          owner_entity_id: string
        }
        Insert: {
          created_at?: string
          dob?: string | null
          id?: string
          name: string
          owner_entity_id: string
        }
        Update: {
          created_at?: string
          dob?: string | null
          id?: string
          name?: string
          owner_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_horses_owner_entity_id_fkey"
            columns: ["owner_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_horses_owner_entity_id_fkey"
            columns: ["owner_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      favorite_entities: {
        Row: {
          created_at: string
          entity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          fav_type: string
          id: string
          note: string | null
          ref_id: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fav_type: string
          id?: string
          note?: string | null
          ref_id: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          fav_type?: string
          id?: string
          note?: string | null
          ref_id?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      feature_catalog: {
        Row: {
          id: string
          meta: Json
          tier_hint: string
          title: string
        }
        Insert: {
          id: string
          meta?: Json
          tier_hint?: string
          title: string
        }
        Update: {
          id?: string
          meta?: Json
          tier_hint?: string
          title?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          enabled_for_tenants: string[] | null
          feature_key: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          enabled_for_tenants?: string[] | null
          feature_key: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          enabled_for_tenants?: string[] | null
          feature_key?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_locations: {
        Row: {
          feature_id: string
          location: string
          sort_order: number
        }
        Insert: {
          feature_id: string
          location: string
          sort_order?: number
        }
        Update: {
          feature_id?: string
          location?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_locations_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_public: boolean
          key: string
          label: string
          path: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_public?: boolean
          key: string
          label: string
          path?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_public?: boolean
          key?: string
          label?: string
          path?: string | null
        }
        Relationships: []
      }
      feed_hides: {
        Row: {
          created_at: string | null
          entity_id: string
          hidden_by_user: string
          id: string
          post_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          hidden_by_user: string
          id?: string
          post_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          hidden_by_user?: string
          id?: string
          post_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_hides_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_hides_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "feed_hides_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          duration_minutes: number
          id: string
          micro_steps: Json | null
          notes: string | null
          paused_at: string | null
          started_at: string | null
          status: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          duration_minutes: number
          id?: string
          micro_steps?: Json | null
          notes?: string | null
          paused_at?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          duration_minutes?: number
          id?: string
          micro_steps?: Json | null
          notes?: string | null
          paused_at?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_user_id: string
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_user_id: string
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_user_id?: string
          follower_user_id?: string
          id?: string
        }
        Relationships: []
      }
      handle_reservations: {
        Row: {
          created_at: string
          expires_at: string
          handle: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          handle: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          handle?: string
          user_id?: string
        }
        Relationships: []
      }
      horse_feed: {
        Row: {
          caption: string | null
          created_at: string | null
          created_by: string
          horse_id: string
          id: string
          media_id: string | null
          post_type: string | null
          tagged_profiles: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          created_by: string
          horse_id: string
          id?: string
          media_id?: string | null
          post_type?: string | null
          tagged_profiles?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          created_by?: string
          horse_id?: string
          id?: string
          media_id?: string | null
          post_type?: string | null
          tagged_profiles?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horse_feed_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key: string
          scope: string
        }
        Insert: {
          created_at?: string
          key: string
          scope: string
        }
        Update: {
          created_at?: string
          key?: string
          scope?: string
        }
        Relationships: []
      }
      idempotency_log: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          result: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          result: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          result?: Json
        }
        Relationships: []
      }
      incentive_nominations: {
        Row: {
          created_at: string
          fee_paid: boolean
          horse_id: string
          id: string
          incentive_id: string
          nominator_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_paid?: boolean
          horse_id: string
          id?: string
          incentive_id: string
          nominator_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_paid?: boolean
          horse_id?: string
          id?: string
          incentive_id?: string
          nominator_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentive_nominations_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "incentives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_nominations_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["incentive_id"]
          },
        ]
      }
      incentives: {
        Row: {
          created_at: string
          deadline_at: string
          eligibility_rules: Json
          entry_fee_cents: number
          id: string
          program_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_at: string
          eligibility_rules?: Json
          entry_fee_cents?: number
          id?: string
          program_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_at?: string
          eligibility_rules?: Json
          entry_fee_cents?: number
          id?: string
          program_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingest_jobs: {
        Row: {
          attempts: number
          created_at: string
          external_idempotency_key: string | null
          id: string
          kind: string
          org_id: string
          payload: Json
          run_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          external_idempotency_key?: string | null
          id?: string
          kind: string
          org_id: string
          payload: Json
          run_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          external_idempotency_key?: string | null
          id?: string
          kind?: string
          org_id?: string
          payload?: Json
          run_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      installed_apps: {
        Row: {
          app_key: string
          config: Json | null
          entity_id: string
          installed_at: string | null
          installed_by: string
        }
        Insert: {
          app_key: string
          config?: Json | null
          entity_id: string
          installed_at?: string | null
          installed_by: string
        }
        Update: {
          app_key?: string
          config?: Json | null
          entity_id?: string
          installed_at?: string | null
          installed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "installed_apps_app_key_fkey"
            columns: ["app_key"]
            isOneToOne: false
            referencedRelation: "app_catalog"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "installed_apps_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installed_apps_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          app_key: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          provider: string | null
          scopes: string[] | null
          status: string | null
        }
        Insert: {
          app_key?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          provider?: string | null
          scopes?: string[] | null
          status?: string | null
        }
        Update: {
          app_key?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          provider?: string | null
          scopes?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_app_key_fkey"
            columns: ["app_key"]
            isOneToOne: false
            referencedRelation: "app_catalog"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "integration_connections_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      intent_signals: {
        Row: {
          id: number
          metadata: Json
          name: string
          target_id: string | null
          target_kind: string | null
          ts: string
          user_id: string
        }
        Insert: {
          id?: number
          metadata?: Json
          name: string
          target_id?: string | null
          target_kind?: string | null
          ts?: string
          user_id: string
        }
        Update: {
          id?: number
          metadata?: Json
          name?: string
          target_id?: string | null
          target_kind?: string | null
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      interest_catalog: {
        Row: {
          category: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          locale: string
          sort_order: number | null
          tag: string
        }
        Insert: {
          category: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          locale?: string
          sort_order?: number | null
          tag: string
        }
        Update: {
          category?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          locale?: string
          sort_order?: number | null
          tag?: string
        }
        Relationships: []
      }
      interests_catalog: {
        Row: {
          category: string
          id: string
          sort_order: number | null
          tag: string
        }
        Insert: {
          category: string
          id: string
          sort_order?: number | null
          tag: string
        }
        Update: {
          category?: string
          id?: string
          sort_order?: number | null
          tag?: string
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          content: string
          created_at: string
          doc_id: string
          embedding: string | null
          id: string
          idx: number
          tokens: number
        }
        Insert: {
          content: string
          created_at?: string
          doc_id: string
          embedding?: string | null
          id?: string
          idx: number
          tokens?: number
        }
        Update: {
          content?: string
          created_at?: string
          doc_id?: string
          embedding?: string | null
          id?: string
          idx?: number
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          id: string
          metadata: Json | null
          sha256: string
          source_id: string
          text: string
          title: string | null
          updated_at: string
          uri: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          sha256: string
          source_id: string
          text: string
          title?: string | null
          updated_at?: string
          uri: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          sha256?: string
          source_id?: string
          text?: string
          title?: string | null
          updated_at?: string
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_sources: {
        Row: {
          allow: string[] | null
          base: string
          created_at: string
          deny: string[] | null
          id: string
          kind: string
          updated_at: string
        }
        Insert: {
          allow?: string[] | null
          base: string
          created_at?: string
          deny?: string[] | null
          id?: string
          kind: string
          updated_at?: string
        }
        Update: {
          allow?: string[] | null
          base?: string
          created_at?: string
          deny?: string[] | null
          id?: string
          kind?: string
          updated_at?: string
        }
        Relationships: []
      }
      kernel_contexts: {
        Row: {
          context_data: Json
          context_entity_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          kernel_type: string
          priority: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_data?: Json
          context_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kernel_type: string
          priority?: number | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_data?: Json
          context_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kernel_type?: string
          priority?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          idx: number
          item_id: string
          text: string
          token_count: number | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          idx: number
          item_id: string
          text: string
          token_count?: number | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          idx?: number
          item_id?: string
          text?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string
          content_excerpt: string | null
          created_at: string | null
          created_by: string | null
          embedding: string | null
          id: string
          language: string | null
          permissions: Json | null
          scope: string
          source_bucket_path: string | null
          subcategory: string | null
          summary: string | null
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          uri: string
          version: number
        }
        Insert: {
          category: string
          content_excerpt?: string | null
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          id?: string
          language?: string | null
          permissions?: Json | null
          scope: string
          source_bucket_path?: string | null
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          uri: string
          version?: number
        }
        Update: {
          category?: string
          content_excerpt?: string | null
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          id?: string
          language?: string | null
          permissions?: Json | null
          scope?: string
          source_bucket_path?: string | null
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          uri?: string
          version?: number
        }
        Relationships: []
      }
      kv_counters: {
        Row: {
          expires_at: string | null
          k: string
          v: number
        }
        Insert: {
          expires_at?: string | null
          k: string
          v?: number
        }
        Update: {
          expires_at?: string | null
          k?: string
          v?: number
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          period: string
          period_start: string | null
          profile_id: string
          rank: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          period: string
          period_start?: string | null
          profile_id: string
          rank?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          period?: string
          period_start?: string | null
          profile_id?: string
          rank?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_events: {
        Row: {
          candidate_id: string
          context: Json
          explored: boolean
          id: number
          p_exp: number
          policy: string
          reward: number | null
          score: number | null
          surface: string
          ts: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          context?: Json
          explored?: boolean
          id?: number
          p_exp: number
          policy: string
          reward?: number | null
          score?: number | null
          surface: string
          ts?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          context?: Json
          explored?: boolean
          id?: number
          p_exp?: number
          policy?: string
          reward?: number | null
          score?: number | null
          surface?: string
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          notes: string | null
          order_id: string
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          handle: string
          id: string
          metadata: Json | null
          profile_url: string | null
          proof_data: Json | null
          proof_url: string | null
          provider: string
          updated_at: string
          user_id: string
          verification_method: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          handle: string
          id?: string
          metadata?: Json | null
          profile_url?: string | null
          proof_data?: Json | null
          proof_url?: string | null
          provider: string
          updated_at?: string
          user_id: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          handle?: string
          id?: string
          metadata?: Json | null
          profile_url?: string | null
          proof_data?: Json | null
          proof_url?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      listing_taxonomy: {
        Row: {
          listing_id: string
          taxonomy_id: string
          value_id: string
        }
        Insert: {
          listing_id: string
          taxonomy_id: string
          value_id: string
        }
        Update: {
          listing_id?: string
          taxonomy_id?: string
          value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_taxonomy_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "taxonomies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_taxonomy_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_values"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          stream_url: string | null
          streamer_id: string
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stream_url?: string | null
          streamer_id: string
          tenant_id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stream_url?: string | null
          streamer_id?: string
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_min"
            referencedColumns: ["user_id"]
          },
        ]
      }
      market_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          listing_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          listing_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          listing_id?: string | null
        }
        Relationships: []
      }
      marketplace_candidates: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string | null
          id: string
          image_url: string | null
          interest_id: string
          metadata: Json
          price_cents: number | null
          score: number
          source: string
          title: string
          url: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          image_url?: string | null
          interest_id: string
          metadata?: Json
          price_cents?: number | null
          score?: number
          source: string
          title: string
          url?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          image_url?: string | null
          interest_id?: string
          metadata?: Json
          price_cents?: number | null
          score?: number
          source?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_candidates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_candidates_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          category: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          name: string
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_discovery_queue: {
        Row: {
          attempts: number
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          interest_id: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interest_id: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interest_id?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_discovery_queue_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_discovery_queue_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_gaps: {
        Row: {
          category_id: string | null
          gap_level: string
          interest_id: string
          inventory_ct: number
          last_checked: string
        }
        Insert: {
          category_id?: string | null
          gap_level?: string
          interest_id: string
          inventory_ct?: number
          last_checked?: string
        }
        Update: {
          category_id?: string | null
          gap_level?: string
          interest_id?: string
          inventory_ct?: number
          last_checked?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_gaps_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_gaps_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: true
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_interest_map: {
        Row: {
          category_id: string
          confidence: number
          created_at: string
          interest_id: string
          source: string
          updated_at: string
        }
        Insert: {
          category_id: string
          confidence?: number
          created_at?: string
          interest_id: string
          source?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          confidence?: number
          created_at?: string
          interest_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_interest_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_interest_map_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          location: Json | null
          media: Json | null
          metadata: Json | null
          price_cents: number
          seller_profile_id: string
          status: string
          stock_quantity: number
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          location?: Json | null
          media?: Json | null
          metadata?: Json | null
          price_cents: number
          seller_profile_id: string
          status?: string
          stock_quantity?: number
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: Json | null
          media?: Json | null
          metadata?: Json | null
          price_cents?: number
          seller_profile_id?: string
          status?: string
          stock_quantity?: number
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          ai_analysis: Json | null
          caption: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          linked_entities: Json | null
          metadata: Json | null
          tenant_id: string
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          caption?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          linked_entities?: Json | null
          metadata?: Json | null
          tenant_id?: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          caption?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          linked_entities?: Json | null
          metadata?: Json | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      media_entities: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          media_id: string
          relation_type: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          media_id: string
          relation_type?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          media_id?: string
          relation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_entities_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_links: {
        Row: {
          can_edit: boolean | null
          created_at: string | null
          id: string
          source_memory_id: string
          visible_to_profile_id: string
        }
        Insert: {
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          source_memory_id: string
          visible_to_profile_id: string
        }
        Update: {
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          source_memory_id?: string
          visible_to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_links_source_memory_id_fkey"
            columns: ["source_memory_id"]
            isOneToOne: false
            referencedRelation: "ai_user_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_share_requests: {
        Row: {
          created_at: string | null
          decided_at: string | null
          expires_at: string | null
          from_profile_id: string
          id: string
          memory_id: string
          status: string | null
          to_profile_id: string
        }
        Insert: {
          created_at?: string | null
          decided_at?: string | null
          expires_at?: string | null
          from_profile_id: string
          id?: string
          memory_id: string
          status?: string | null
          to_profile_id: string
        }
        Update: {
          created_at?: string | null
          decided_at?: string | null
          expires_at?: string | null
          from_profile_id?: string
          id?: string
          memory_id?: string
          status?: string | null
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_share_requests_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "ai_user_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          recipient_user_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          recipient_user_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          recipient_user_id?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          digest_hour: number | null
          lanes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_hour?: number | null
          lanes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_hour?: number | null
          lanes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_receipts: {
        Row: {
          archived: boolean | null
          created_at: string
          id: string
          muted: boolean | null
          notif_id: string
          read_at: string | null
          seen_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          id?: string
          muted?: boolean | null
          notif_id: string
          read_at?: string | null
          seen_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          id?: string
          muted?: boolean | null
          notif_id?: string
          read_at?: string | null
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_receipts_notif_id_fkey"
            columns: ["notif_id"]
            isOneToOne: false
            referencedRelation: "notif_center_view"
            referencedColumns: ["notif_id"]
          },
          {
            foreignKeyName: "notification_receipts_notif_id_fkey"
            columns: ["notif_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          payload: Json | null
          priority: number
          thread_key: string | null
          title: string
        }
        Insert: {
          body?: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          payload?: Json | null
          priority?: number
          thread_key?: string | null
          title: string
        }
        Update: {
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          payload?: Json | null
          priority?: number
          thread_key?: string | null
          title?: string
        }
        Relationships: []
      }
      order_line_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          order_id: string
          qty: number
          unit_price_cents: number
          variant: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          order_id: string
          qty: number
          unit_price_cents: number
          variant?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          qty?: number
          unit_price_cents?: number
          variant?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cart_id: string | null
          created_at: string
          currency: string
          email: string
          fx_rate: number | null
          id: string
          payment_intent_id: string | null
          reversal_reason: string | null
          reversed_at: string | null
          shipping_address: Json | null
          shipping_cents: number
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          total_usd_cents: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          currency?: string
          email: string
          fx_rate?: number | null
          id?: string
          payment_intent_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          total_usd_cents?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          currency?: string
          email?: string
          fx_rate?: number | null
          id?: string
          payment_intent_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          total_usd_cents?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          id: string
          payload: Json
          processing_token: string | null
          tenant_id: string
          topic: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          payload: Json
          processing_token?: string | null
          tenant_id?: string
          topic: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          payload?: Json
          processing_token?: string | null
          tenant_id?: string
          topic?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          intent_id: string
          order_id: string
          provider: string
          raw: Json | null
          status: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          intent_id: string
          order_id: string
          provider?: string
          raw?: Json | null
          status: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          intent_id?: string
          order_id?: string
          provider?: string
          raw?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_rules: {
        Row: {
          class_id: string
          created_at: string
          id: string
          schema: Json
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          schema?: Json
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          schema?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payout_rules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "event_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          class_id: string
          created_at: string
          entry_id: string
          id: string
          place: number
          status: string
        }
        Insert: {
          amount_cents?: number
          class_id: string
          created_at?: string
          entry_id: string
          id?: string
          place: number
          status?: string
        }
        Update: {
          amount_cents?: number
          class_id?: string
          created_at?: string
          entry_id?: string
          id?: string
          place?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "event_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_index: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_index?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_index?: number | null
          user_id?: string
        }
        Relationships: []
      }
      plan_entitlements: {
        Row: {
          feature_id: string
          plan_id: string
        }
        Insert: {
          feature_id: string
          plan_id: string
        }
        Update: {
          feature_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_entitlements_fk_feature"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_entitlements_fk_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          ask_templates: Json | null
          created_at: string | null
          embedding: string | null
          from_knowledge_uri: string | null
          id: string
          intent: string
          required_slots: Json | null
          scope: string
          steps: Json
          tenant_id: string | null
          updated_at: string | null
          version: number
        }
        Insert: {
          ask_templates?: Json | null
          created_at?: string | null
          embedding?: string | null
          from_knowledge_uri?: string | null
          id?: string
          intent: string
          required_slots?: Json | null
          scope: string
          steps: Json
          tenant_id?: string | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          ask_templates?: Json | null
          created_at?: string | null
          embedding?: string | null
          from_knowledge_uri?: string | null
          id?: string
          intent?: string
          required_slots?: Json | null
          scope?: string
          steps?: Json
          tenant_id?: string | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_from_knowledge_uri_fkey"
            columns: ["from_knowledge_uri"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["uri"]
          },
        ]
      }
      post_drafts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          user_id: string
          visibility: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reshares: {
        Row: {
          commentary: string | null
          created_at: string | null
          id: string
          post_id: string
          tenant_id: string
          user_id: string
          visibility: string
        }
        Insert: {
          commentary?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          tenant_id?: string
          user_id: string
          visibility?: string
        }
        Update: {
          commentary?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          tenant_id?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reshares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reshares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "post_reshares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_min"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_saves: {
        Row: {
          collection: string | null
          created_at: string | null
          note: string | null
          post_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          collection?: string | null
          created_at?: string | null
          note?: string | null
          post_id: string
          tenant_id?: string
          user_id: string
        }
        Update: {
          collection?: string | null
          created_at?: string | null
          note?: string | null
          post_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_min"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          post_id: string
          tag_type: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          post_id: string
          tag_type?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          post_id?: string
          tag_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_targets: {
        Row: {
          approved: boolean | null
          created_at: string | null
          id: string
          post_id: string
          reason: string | null
          source_post_id: string | null
          target_entity_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          post_id: string
          reason?: string | null
          source_post_id?: string | null
          target_entity_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          source_post_id?: string | null
          target_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_targets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_targets_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_targets_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_targets_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          author_user_id: string | null
          body: string | null
          body_tsv: unknown | null
          created_at: string | null
          entity_id: string | null
          id: string
          idempotency_key: string | null
          kind: string
          media: Json | null
          media_urls: string[] | null
          tenant_id: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          author_id: string
          author_user_id?: string | null
          body?: string | null
          body_tsv?: unknown | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          idempotency_key?: string | null
          kind: string
          media?: Json | null
          media_urls?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string
          author_user_id?: string | null
          body?: string | null
          body_tsv?: unknown | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: string
          media?: Json | null
          media_urls?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_min"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      preview_audit_log: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          ip_inet: unknown | null
          meta: Json
          payload_hash: string
          route: string | null
          source: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          ip_inet?: unknown | null
          meta?: Json
          payload_hash: string
          route?: string | null
          source: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          ip_inet?: unknown | null
          meta?: Json
          payload_hash?: string
          route?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_test_variants: {
        Row: {
          id: string
          price_cents: number
          test_id: string
          variant_key: string
        }
        Insert: {
          id?: string
          price_cents: number
          test_id: string
          variant_key: string
        }
        Update: {
          id?: string
          price_cents?: number
          test_id?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "price_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tests: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          listing_id: string
          owner_user_id: string
          started_at: string | null
          status: string
          winner_variant: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          listing_id: string
          owner_user_id: string
          started_at?: string | null
          status?: string
          winner_variant?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          listing_id?: string
          owner_user_id?: string
          started_at?: string | null
          status?: string
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chunks: {
        Row: {
          content: string
          created_at: string
          doc_id: string | null
          embedding: string | null
          id: string
          org_id: string
        }
        Insert: {
          content: string
          created_at?: string
          doc_id?: string | null
          embedding?: string | null
          id?: string
          org_id: string
        }
        Update: {
          content?: string
          created_at?: string
          doc_id?: string | null
          embedding?: string | null
          id?: string
          org_id?: string
        }
        Relationships: []
      }
      profile_badges: {
        Row: {
          badge_id: string
          badge_type: string
          description: string | null
          display_name: string
          display_order: number | null
          earned_at: string
          icon_url: string | null
          id: string
          metadata: Json | null
          user_id: string
          visible: boolean | null
        }
        Insert: {
          badge_id: string
          badge_type: string
          description?: string | null
          display_name: string
          display_order?: number | null
          earned_at?: string
          icon_url?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
          visible?: boolean | null
        }
        Update: {
          badge_id?: string
          badge_type?: string
          description?: string | null
          display_name?: string
          display_order?: number | null
          earned_at?: string
          icon_url?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      profile_pins: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_id: string | null
          item_type: string
          position: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string | null
          item_type: string
          position: number
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string | null
          item_type?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_pins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          calendar_public: boolean | null
          calendar_settings: Json | null
          created_at: string
          creator_account_enabled: boolean | null
          creator_account_verified_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          handle: string | null
          handle_lower: string | null
          id: string
          interests: Json | null
          invite_source: string | null
          invited_by: string | null
          notifications_enabled: boolean | null
          onboarding_complete: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          calendar_public?: boolean | null
          calendar_settings?: Json | null
          created_at?: string
          creator_account_enabled?: boolean | null
          creator_account_verified_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          handle?: string | null
          handle_lower?: string | null
          id?: string
          interests?: Json | null
          invite_source?: string | null
          invited_by?: string | null
          notifications_enabled?: boolean | null
          onboarding_complete?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          calendar_public?: boolean | null
          calendar_settings?: Json | null
          created_at?: string
          creator_account_enabled?: boolean | null
          creator_account_verified_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          handle?: string | null
          handle_lower?: string | null
          id?: string
          interests?: Json | null
          invite_source?: string | null
          invited_by?: string | null
          notifications_enabled?: boolean | null
          onboarding_complete?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_onboarding_progress: {
        Row: {
          data: Json | null
          step: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          data?: Json | null
          step: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          data?: Json | null
          step?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promotion_redemptions: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          listing_id: string | null
          order_id: string
          promotion_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          listing_id?: string | null
          order_id: string
          promotion_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          listing_id?: string | null
          order_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_redemptions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_redemptions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_targets: {
        Row: {
          id: string
          listing_id: string
          promotion_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          promotion_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_targets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_targets_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number
          end_at: string
          id: string
          kind: Database["public"]["Enums"]["promotion_kind"]
          metadata: Json
          name: string
          owner_user_id: string
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number
          end_at: string
          id?: string
          kind?: Database["public"]["Enums"]["promotion_kind"]
          metadata?: Json
          name: string
          owner_user_id: string
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number
          end_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["promotion_kind"]
          metadata?: Json
          name?: string
          owner_user_id?: string
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_secrets: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          last_used_at: string | null
          name: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          last_used_at?: string | null
          name?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_app_visibility: {
        Row: {
          app_id: string
          config: Json
          created_at: string
          entity_id: string
          id: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          app_id: string
          config?: Json
          created_at?: string
          entity_id: string
          id?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          app_id?: string
          config?: Json
          created_at?: string
          entity_id?: string
          id?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      public_counters: {
        Row: {
          entity_id: string
          favorites_count: number
          followers_count: number
          likes_count: number
          updated_at: string
        }
        Insert: {
          entity_id: string
          favorites_count?: number
          followers_count?: number
          likes_count?: number
          updated_at?: string
        }
        Update: {
          entity_id?: string
          favorites_count?: number
          followers_count?: number
          likes_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      rate_counters: {
        Row: {
          bucket: string
          count: number
          updated_at: string
        }
        Insert: {
          bucket: string
          count?: number
          updated_at?: string
        }
        Update: {
          bucket?: string
          count?: number
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          count: number
          created_at: string
          id: number
          scope: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: number
          scope: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: number
          scope?: string
          window_start?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          expires_at: string
        }
        Insert: {
          bucket: string
          count?: number
          expires_at: string
        }
        Update: {
          bucket?: string
          count?: number
          expires_at?: string
        }
        Relationships: []
      }
      reposts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          repost_post_id: string
          source_post_id: string
          targets: string[] | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          repost_post_id: string
          source_post_id: string
          targets?: string[] | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          repost_post_id?: string
          source_post_id?: string
          targets?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_repost_post_id_fkey"
            columns: ["repost_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      result_flags: {
        Row: {
          created_at: string
          details: string
          entry_data: Json
          event_id: string
          flag_type: string
          id: string
          reporter_user_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details: string
          entry_data: Json
          event_id: string
          flag_type: string
          id?: string
          reporter_user_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          entry_data?: Json
          event_id?: string
          flag_type?: string
          id?: string
          reporter_user_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_flags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          created_at: string
          dnf: boolean
          entry_id: string
          id: string
          notes: string | null
          penalties_ms: number
          round: number
          score: number | null
          time_ms: number | null
        }
        Insert: {
          created_at?: string
          dnf?: boolean
          entry_id: string
          id?: string
          notes?: string | null
          penalties_ms?: number
          round?: number
          score?: number | null
          time_ms?: number | null
        }
        Update: {
          created_at?: string
          dnf?: boolean
          entry_id?: string
          id?: string
          notes?: string | null
          penalties_ms?: number
          round?: number
          score?: number | null
          time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "results_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_admin_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          target: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      rocker_campaign_audience: {
        Row: {
          campaign_id: string
          id: string
          segment: string
          segment_params: Json
          user_ids: string[] | null
        }
        Insert: {
          campaign_id: string
          id?: string
          segment: string
          segment_params?: Json
          user_ids?: string[] | null
        }
        Update: {
          campaign_id?: string
          id?: string
          segment?: string
          segment_params?: Json
          user_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_campaign_audience_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rocker_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_campaigns: {
        Row: {
          channel: string
          created_at: string
          id: string
          name: string
          rrule: string | null
          schedule_at: string | null
          sent_count: number
          status: string
          template: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          name: string
          rrule?: string | null
          schedule_at?: string | null
          sent_count?: number
          status?: string
          template?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          name?: string
          rrule?: string | null
          schedule_at?: string | null
          sent_count?: number
          status?: string
          template?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_categories: {
        Row: {
          category_type: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          meta: Json | null
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_type: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          meta?: Json | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_type?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          meta?: Json | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "rocker_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_commands: {
        Row: {
          created_at: string
          execution_result: Json | null
          id: string
          parameters: Json | null
          parsed_intent: string | null
          raw_command: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_result?: Json | null
          id?: string
          parameters?: Json | null
          parsed_intent?: string | null
          raw_command: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          execution_result?: Json | null
          id?: string
          parameters?: Json | null
          parsed_intent?: string | null
          raw_command?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_config: {
        Row: {
          alpha: number | null
          id: number
          keep_k: number | null
          mmr_lambda: number | null
          retrieve_k: number | null
          sim_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          alpha?: number | null
          id?: number
          keep_k?: number | null
          mmr_lambda?: number | null
          retrieve_k?: number | null
          sim_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          alpha?: number | null
          id?: number
          keep_k?: number | null
          mmr_lambda?: number | null
          retrieve_k?: number | null
          sim_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rocker_context: {
        Row: {
          context_data: Json
          context_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          profile_id: string | null
          relevance_score: number | null
          user_id: string
        }
        Insert: {
          context_data: Json
          context_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          profile_id?: string | null
          relevance_score?: number | null
          user_id: string
        }
        Update: {
          context_data?: Json
          context_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          profile_id?: string | null
          relevance_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_conversations: {
        Row: {
          actor_role: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          actor_role?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          actor_role?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_daily_kickoffs: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          scheduled_time: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          scheduled_time?: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          scheduled_time?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_deep_analysis: {
        Row: {
          content_preview: string | null
          created_at: string
          filing_options: Json
          id: string
          sections: Json
          selected_option: number | null
          status: string
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          filing_options?: Json
          id?: string
          sections?: Json
          selected_option?: number | null
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          filing_options?: Json
          id?: string
          sections?: Json
          selected_option?: number | null
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_edges: {
        Row: {
          created_at: string | null
          dst: string
          id: string
          meta: Json | null
          rel: string
          src: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          dst: string
          id?: string
          meta?: Json | null
          rel: string
          src: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          dst?: string
          id?: string
          meta?: Json | null
          rel?: string
          src?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_edges_dst_fkey"
            columns: ["dst"]
            isOneToOne: false
            referencedRelation: "rocker_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_edges_src_fkey"
            columns: ["src"]
            isOneToOne: false
            referencedRelation: "rocker_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_entities: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          meta: Json | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          meta?: Json | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          name?: string
        }
        Relationships: []
      }
      rocker_events: {
        Row: {
          id: string
          payload: Json
          session_id: string | null
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          payload?: Json
          session_id?: string | null
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          payload?: Json
          session_id?: string | null
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_evidence_cards: {
        Row: {
          action_id: string | null
          created_at: string | null
          id: string
          inputs: Json | null
          outputs: Json | null
          steps: Json | null
          title: string
          uncertainties: string[] | null
          undo_available: boolean | null
          user_id: string
          vault_changes: Json | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          steps?: Json | null
          title: string
          uncertainties?: string[] | null
          undo_available?: boolean | null
          user_id: string
          vault_changes?: Json | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          steps?: Json | null
          title?: string
          uncertainties?: string[] | null
          undo_available?: boolean | null
          user_id?: string
          vault_changes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_evidence_cards_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_action_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_evidence_cards_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_action_my_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_files: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string | null
          file_type: string | null
          folder_path: string | null
          id: string
          meta: Json | null
          mime: string | null
          name: string | null
          ocr_text: string | null
          parent_file_id: string | null
          priority: string | null
          project: string | null
          related_files: string[] | null
          related_messages: string[] | null
          size: number | null
          source: string | null
          starred: boolean | null
          status: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          text_content: string | null
          thread_id: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          file_type?: string | null
          folder_path?: string | null
          id?: string
          meta?: Json | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          parent_file_id?: string | null
          priority?: string | null
          project?: string | null
          related_files?: string[] | null
          related_messages?: string[] | null
          size?: number | null
          source?: string | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          file_type?: string | null
          folder_path?: string | null
          id?: string
          meta?: Json | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          parent_file_id?: string | null
          priority?: string | null
          project?: string | null
          related_files?: string[] | null
          related_messages?: string[] | null
          size?: number | null
          source?: string | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_files_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rocker_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "rocker_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "vw_starred"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_files_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_gap_opportunities: {
        Row: {
          created_at: string | null
          effort: number
          entities: Json | null
          evidence: Json | null
          id: string
          kind: string
          priority: number
          size: number
          status: string | null
          title: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          effort: number
          entities?: Json | null
          evidence?: Json | null
          id?: string
          kind: string
          priority: number
          size: number
          status?: string | null
          title: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          effort?: number
          entities?: Json | null
          evidence?: Json | null
          id?: string
          kind?: string
          priority?: number
          size?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      rocker_gap_signals: {
        Row: {
          created_at: string | null
          entities: Json | null
          id: number
          kind: string
          meta: Json | null
          query: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entities?: Json | null
          id?: number
          kind: string
          meta?: Json | null
          query?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entities?: Json | null
          id?: number
          kind?: string
          meta?: Json | null
          query?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rocker_insights: {
        Row: {
          action: string | null
          confidence: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string
          source: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          source?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          source?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_knowledge: {
        Row: {
          category_id: string | null
          chunk_index: number
          chunk_summary: string | null
          content: string
          content_tsv: unknown | null
          created_at: string
          embedding: string | null
          file_id: string | null
          id: string
          keywords: string[] | null
          memory_id: string | null
          message_id: number | null
          meta: Json | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          chunk_index?: number
          chunk_summary?: string | null
          content: string
          content_tsv?: unknown | null
          created_at?: string
          embedding?: string | null
          file_id?: string | null
          id?: string
          keywords?: string[] | null
          memory_id?: string | null
          message_id?: number | null
          meta?: Json | null
          source_id?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          chunk_index?: number
          chunk_summary?: string | null
          content?: string
          content_tsv?: unknown | null
          created_at?: string
          embedding?: string | null
          file_id?: string | null
          id?: string
          keywords?: string[] | null
          memory_id?: string | null
          message_id?: number | null
          meta?: Json | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_knowledge_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rocker_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "rocker_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "vw_starred"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "rocker_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_knowledge_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "rocker_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_long_memory: {
        Row: {
          category_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          key: string | null
          kind: string
          last_accessed: string | null
          memory_layer: string | null
          pinned: boolean | null
          priority: number
          related_files: string[] | null
          related_memories: string[] | null
          source: string | null
          updated_at: string | null
          user_id: string
          value: Json
          visibility: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          key?: string | null
          kind: string
          last_accessed?: string | null
          memory_layer?: string | null
          pinned?: boolean | null
          priority?: number
          related_files?: string[] | null
          related_memories?: string[] | null
          source?: string | null
          updated_at?: string | null
          user_id: string
          value: Json
          visibility?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          key?: string | null
          kind?: string
          last_accessed?: string | null
          memory_layer?: string | null
          pinned?: boolean | null
          priority?: number
          related_files?: string[] | null
          related_memories?: string[] | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
          value?: Json
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_long_memory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rocker_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_memories: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          importance: number
          kind: string
          tags: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number
          kind?: string
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number
          kind?: string
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_message_summaries: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string | null
          key_themes: string[] | null
          message_count: number
          summary_date: string
          thread_id: string
          topics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          key_themes?: string[] | null
          message_count?: number
          summary_date: string
          thread_id: string
          topics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          key_themes?: string[] | null
          message_count?: number
          summary_date?: string
          thread_id?: string
          topics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_message_summaries_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_messages: {
        Row: {
          content: string
          created_at: string
          exported_to_file_id: string | null
          id: number
          linked_files: string[] | null
          linked_knowledge: string[] | null
          meta: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          exported_to_file_id?: string | null
          id?: number
          linked_files?: string[] | null
          linked_knowledge?: string[] | null
          meta?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          exported_to_file_id?: string | null
          id?: number
          linked_files?: string[] | null
          linked_knowledge?: string[] | null
          meta?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_messages_exported_to_file_id_fkey"
            columns: ["exported_to_file_id"]
            isOneToOne: false
            referencedRelation: "rocker_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_messages_exported_to_file_id_fkey"
            columns: ["exported_to_file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_messages_exported_to_file_id_fkey"
            columns: ["exported_to_file_id"]
            isOneToOne: false
            referencedRelation: "vw_files_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_messages_exported_to_file_id_fkey"
            columns: ["exported_to_file_id"]
            isOneToOne: false
            referencedRelation: "vw_starred"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_metrics: {
        Row: {
          action: string | null
          created_at: string | null
          hit5: boolean | null
          id: number
          latency_ms: number | null
          low_conf: boolean | null
          mrr: number | null
          retrieved_ids: string[] | null
          scores: number[] | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          hit5?: boolean | null
          id?: number
          latency_ms?: number | null
          low_conf?: boolean | null
          mrr?: number | null
          retrieved_ids?: string[] | null
          scores?: number[] | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          hit5?: boolean | null
          id?: number
          latency_ms?: number | null
          low_conf?: boolean | null
          mrr?: number | null
          retrieved_ids?: string[] | null
          scores?: number[] | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rocker_notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_okr_key_results: {
        Row: {
          created_at: string | null
          current: number | null
          id: string
          name: string
          okr_id: string
          target: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current?: number | null
          id?: string
          name: string
          okr_id: string
          target: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current?: number | null
          id?: string
          name?: string
          okr_id?: string
          target?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_okr_key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "rocker_okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_okrs: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          objective: string
          owner_id: string
          period: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          objective: string
          owner_id: string
          period: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          objective?: string
          owner_id?: string
          period?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rocker_outbox: {
        Row: {
          attempt_count: number
          body: string
          channel: string
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string | null
          to_addr: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          body: string
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_addr: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          body?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_addr?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_projects: {
        Row: {
          created_at: string | null
          description: string | null
          end_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          owner_id: string
          start_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          owner_id: string
          start_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string
          start_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rocker_suggestions: {
        Row: {
          acted_on_at: string | null
          action_data: Json | null
          confidence: number | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          id: string
          priority: string | null
          profile_id: string | null
          status: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          acted_on_at?: string | null
          action_data?: Json | null
          confidence?: number | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          id?: string
          priority?: string | null
          profile_id?: string | null
          status?: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          acted_on_at?: string | null
          action_data?: Json | null
          confidence?: number | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          id?: string
          priority?: string | null
          profile_id?: string | null
          status?: string | null
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      rocker_task_comments: {
        Row: {
          author_id: string | null
          author_type: string | null
          body: string
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          author_type?: string | null
          body: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          author_type?: string | null
          body?: string
          created_at?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_task_dependencies: {
        Row: {
          depends_on: string
          task_id: string
        }
        Insert: {
          depends_on: string
          task_id: string
        }
        Update: {
          depends_on?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_task_dependencies_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_task_label_links: {
        Row: {
          label_id: string
          task_id: string
        }
        Insert: {
          label_id: string
          task_id: string
        }
        Update: {
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_task_label_links_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "rocker_task_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocker_task_label_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_task_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      rocker_task_progress: {
        Row: {
          confidence: number | null
          id: string
          metadata: Json | null
          notes: string | null
          recorded_at: string | null
          status: string
          task_id: string
        }
        Insert: {
          confidence?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          recorded_at?: string | null
          status: string
          task_id: string
        }
        Update: {
          confidence?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          recorded_at?: string | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_task_subtasks: {
        Row: {
          created_at: string | null
          done: boolean | null
          id: string
          order_index: number | null
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          done?: boolean | null
          id?: string
          order_index?: number | null
          task_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          done?: boolean | null
          id?: string
          order_index?: number | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "rocker_tasks_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_tasks: {
        Row: {
          context: Json | null
          created_at: string | null
          due_at: string | null
          id: string
          recur: string | null
          status: string
          thread_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          recur?: string | null
          status?: string
          thread_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          recur?: string | null
          status?: string
          thread_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocker_tasks_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      rocker_tasks_v2: {
        Row: {
          assignee_id: string | null
          assignee_type: string | null
          blocker_reason: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          embedding: string | null
          entity_id: string | null
          id: string
          kind: string
          metadata: Json | null
          owner_id: string
          priority: string
          project_id: string | null
          reopen_reason: string | null
          rice_confidence: number | null
          rice_effort: number | null
          rice_impact: number | null
          rice_reach: number | null
          sla_severity: number | null
          source: string | null
          source_ref: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          assignee_type?: string | null
          blocker_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          embedding?: string | null
          entity_id?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          owner_id: string
          priority?: string
          project_id?: string | null
          reopen_reason?: string | null
          rice_confidence?: number | null
          rice_effort?: number | null
          rice_impact?: number | null
          rice_reach?: number | null
          sla_severity?: number | null
          source?: string | null
          source_ref?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          assignee_type?: string | null
          blocker_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          embedding?: string | null
          entity_id?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          owner_id?: string
          priority?: string
          project_id?: string | null
          reopen_reason?: string | null
          rice_confidence?: number | null
          rice_effort?: number | null
          rice_impact?: number | null
          rice_reach?: number | null
          sla_severity?: number | null
          source?: string | null
          source_ref?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rocker_threads: {
        Row: {
          actor_role: string
          created_at: string
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          actor_role?: string
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          actor_role?: string
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rocker_vault_documents: {
        Row: {
          chunks_count: number | null
          content_type: string | null
          created_at: string | null
          filename: string
          id: string
          metadata: Json | null
          processed: boolean | null
          project: string | null
          size_bytes: number | null
          status: string | null
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chunks_count?: number | null
          content_type?: string | null
          created_at?: string | null
          filename: string
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          project?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chunks_count?: number | null
          content_type?: string | null
          created_at?: string | null
          filename?: string
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          project?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rpc_observations: {
        Row: {
          created_at: string
          duration_ms: number
          error_code: string | null
          id: number
          meta: Json
          rpc_name: string
          status: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          error_code?: string | null
          id?: number
          meta?: Json
          rpc_name: string
          status: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          id?: number
          meta?: Json
          rpc_name?: string
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      runtime_flag_overrides: {
        Row: {
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_runtime_overrides_key"
            columns: ["key"]
            isOneToOne: false
            referencedRelation: "runtime_flags"
            referencedColumns: ["key"]
          },
        ]
      }
      runtime_flags: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          listing_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          listing_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          listing_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settlement_batches: {
        Row: {
          batch_date: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          processor_reference: string | null
          settled_at: string | null
          status: string
          total_amount_cents: number
        }
        Insert: {
          batch_date: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          processor_reference?: string | null
          settled_at?: string | null
          status?: string
          total_amount_cents?: number
        }
        Update: {
          batch_date?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          processor_reference?: string | null
          settled_at?: string | null
          status?: string
          total_amount_cents?: number
        }
        Relationships: []
      }
      shopping_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          listing_id: string
          price_cents: number
          qty: number
          variant: Json | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          listing_id: string
          price_cents: number
          qty: number
          variant?: Json | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          price_cents?: number
          qty?: number
          variant?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_carts: {
        Row: {
          created_at: string
          currency: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stallion_profiles: {
        Row: {
          breeding_record: Json | null
          breeding_status: string | null
          created_at: string
          entity_id: string
          genetics: Json | null
          media: Json | null
          offspring_count: number | null
          stud_fee_cents: number | null
          temperament_notes: string | null
          updated_at: string
        }
        Insert: {
          breeding_record?: Json | null
          breeding_status?: string | null
          created_at?: string
          entity_id: string
          genetics?: Json | null
          media?: Json | null
          offspring_count?: number | null
          stud_fee_cents?: number | null
          temperament_notes?: string | null
          updated_at?: string
        }
        Update: {
          breeding_record?: Json | null
          breeding_status?: string | null
          created_at?: string
          entity_id?: string
          genetics?: Json | null
          media?: Json | null
          offspring_count?: number | null
          stud_fee_cents?: number | null
          temperament_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stallion_profiles_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stallion_profiles_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      stalls_rv_inventory: {
        Row: {
          available_quantity: number
          created_at: string
          event_id: string
          id: string
          label: string
          metadata: Json | null
          price_cents: number
          reserved_quantity: number
          type: string
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          created_at?: string
          event_id: string
          id?: string
          label: string
          metadata?: Json | null
          price_cents?: number
          reserved_quantity?: number
          type: string
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          metadata?: Json | null
          price_cents?: number
          reserved_quantity?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stalls_rv_inventory_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      stalls_rv_reservations: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          metadata: Json | null
          quantity: number
          status: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          metadata?: Json | null
          quantity?: number
          status?: string
          total_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          metadata?: Json | null
          quantity?: number
          status?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stalls_rv_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "stalls_rv_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          app_id: string
          created_at: string
          entity_id: string
          id: string
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          entity_id: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          entity_id?: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admin_guardrails: {
        Row: {
          civic_integrity_enabled: boolean
          harm_prevention_enabled: boolean
          id: string
          manipulation_detection_enabled: boolean
          toxicity_filter_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          civic_integrity_enabled?: boolean
          harm_prevention_enabled?: boolean
          id?: string
          manipulation_detection_enabled?: boolean
          toxicity_filter_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          civic_integrity_enabled?: boolean
          harm_prevention_enabled?: boolean
          id?: string
          manipulation_detection_enabled?: boolean
          toxicity_filter_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admin_settings: {
        Row: {
          allow_autonomous_actions: boolean
          allow_calendar_access: boolean
          allow_crm_operations: boolean
          allow_email_sending: boolean
          allow_file_operations: boolean
          allow_financial_operations: boolean
          allow_knowledge_write: boolean | null
          allow_memory_ingest: boolean | null
          allow_proactive_suggestions: boolean | null
          allow_secure_credentials: boolean
          allow_voice_calls: boolean
          allow_voice_messages: boolean
          allow_web_automation: boolean
          created_at: string
          id: string
          rocker_can_refuse_commands: boolean
          rocker_obedience_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_autonomous_actions?: boolean
          allow_calendar_access?: boolean
          allow_crm_operations?: boolean
          allow_email_sending?: boolean
          allow_file_operations?: boolean
          allow_financial_operations?: boolean
          allow_knowledge_write?: boolean | null
          allow_memory_ingest?: boolean | null
          allow_proactive_suggestions?: boolean | null
          allow_secure_credentials?: boolean
          allow_voice_calls?: boolean
          allow_voice_messages?: boolean
          allow_web_automation?: boolean
          created_at?: string
          id?: string
          rocker_can_refuse_commands?: boolean
          rocker_obedience_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_autonomous_actions?: boolean
          allow_calendar_access?: boolean
          allow_crm_operations?: boolean
          allow_email_sending?: boolean
          allow_file_operations?: boolean
          allow_financial_operations?: boolean
          allow_knowledge_write?: boolean | null
          allow_memory_ingest?: boolean | null
          allow_proactive_suggestions?: boolean | null
          allow_secure_credentials?: boolean
          allow_voice_calls?: boolean
          allow_voice_messages?: boolean
          allow_web_automation?: boolean
          created_at?: string
          id?: string
          rocker_can_refuse_commands?: boolean
          rocker_obedience_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          added_at: string | null
          added_by: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          owner_user_id: string
          related_entity_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          owner_user_id: string
          related_entity_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          owner_user_id?: string
          related_entity_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_related_entity_id_fkey"
            columns: ["related_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_entity_id_fkey"
            columns: ["related_entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      taxonomies: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          label: string
          metadata: Json | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind: string
          label: string
          metadata?: Json | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          label?: string
          metadata?: Json | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_values: {
        Row: {
          id: string
          label: string
          metadata: Json | null
          sort_order: number | null
          taxonomy_id: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          metadata?: Json | null
          sort_order?: number | null
          taxonomy_id: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          metadata?: Json | null
          sort_order?: number | null
          taxonomy_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_values_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      term_dictionary: {
        Row: {
          definition: string | null
          embedding: string | null
          scope: string
          source_uri: string | null
          synonyms: string[] | null
          tenant_id: string | null
          term: string
          term_knowledge_id: string | null
          updated_at: string | null
        }
        Insert: {
          definition?: string | null
          embedding?: string | null
          scope: string
          source_uri?: string | null
          synonyms?: string[] | null
          tenant_id?: string | null
          term: string
          term_knowledge_id?: string | null
          updated_at?: string | null
        }
        Update: {
          definition?: string | null
          embedding?: string | null
          scope?: string
          source_uri?: string | null
          synonyms?: string[] | null
          tenant_id?: string | null
          term?: string
          term_knowledge_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "term_dictionary_term_knowledge_id_fkey"
            columns: ["term_knowledge_id"]
            isOneToOne: false
            referencedRelation: "term_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      term_knowledge: {
        Row: {
          added_by: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          source_type: string
          source_url: string | null
          summary: string | null
          supersedes: string | null
          term: string
          title: string | null
        }
        Insert: {
          added_by?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_type: string
          source_url?: string | null
          summary?: string | null
          supersedes?: string | null
          term: string
          title?: string | null
        }
        Update: {
          added_by?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_type?: string
          source_url?: string | null
          summary?: string | null
          supersedes?: string | null
          term?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "term_knowledge_supersedes_fkey"
            columns: ["supersedes"]
            isOneToOne: false
            referencedRelation: "term_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      term_resolution_events: {
        Row: {
          created_at: string | null
          id: string
          method: string
          resolved: boolean | null
          term: string
          term_knowledge_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          method: string
          resolved?: boolean | null
          term: string
          term_knowledge_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          method?: string
          resolved?: boolean | null
          term?: string
          term_knowledge_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_resolution_events_term_knowledge_id_fkey"
            columns: ["term_knowledge_id"]
            isOneToOne: false
            referencedRelation: "term_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      term_votes: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          term_knowledge_id: string | null
          vote: number
          voter_user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          term_knowledge_id?: string | null
          vote: number
          voter_user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          term_knowledge_id?: string | null
          vote?: number
          voter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_votes_term_knowledge_id_fkey"
            columns: ["term_knowledge_id"]
            isOneToOne: false
            referencedRelation: "term_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      time_windows: {
        Row: {
          days: number
          description: string
          key: string
        }
        Insert: {
          days: number
          description: string
          key: string
        }
        Update: {
          days?: number
          description?: string
          key?: string
        }
        Relationships: []
      }
      tour_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          stops: Json
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          stops?: Json
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stops?: Json
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          item_id: string
          item_type: string
          lane: string | null
          payload: Json | null
          position: number | null
          session_id: string
          surface: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          item_id: string
          item_type: string
          lane?: string | null
          payload?: Json | null
          position?: number | null
          session_id: string
          surface?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          item_id?: string
          item_type?: string
          lane?: string | null
          payload?: Json | null
          position?: number | null
          session_id?: string
          surface?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_acquisition: {
        Row: {
          first_touch_ts: string | null
          invite_code: string | null
          invite_medium: string | null
          invited_by_id: string | null
          invited_by_kind: string | null
          last_touch_ts: string | null
          ref_session_id: string | null
          user_id: string
          utm: Json | null
        }
        Insert: {
          first_touch_ts?: string | null
          invite_code?: string | null
          invite_medium?: string | null
          invited_by_id?: string | null
          invited_by_kind?: string | null
          last_touch_ts?: string | null
          ref_session_id?: string | null
          user_id: string
          utm?: Json | null
        }
        Update: {
          first_touch_ts?: string | null
          invite_code?: string | null
          invite_medium?: string | null
          invited_by_id?: string | null
          invited_by_kind?: string | null
          last_touch_ts?: string | null
          ref_session_id?: string | null
          user_id?: string
          utm?: Json | null
        }
        Relationships: []
      }
      user_app_layout: {
        Row: {
          app_id: string
          created_at: string
          id: string
          order_index: number
          pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          order_index?: number
          pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          order_index?: number
          pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_apps: {
        Row: {
          app_id: string
          id: string
          installed_at: string
          settings: Json | null
          user_id: string
        }
        Insert: {
          app_id: string
          id?: string
          installed_at?: string
          settings?: Json | null
          user_id: string
        }
        Update: {
          app_id?: string
          id?: string
          installed_at?: string
          settings?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_autonomy_settings: {
        Row: {
          allow_calendar_write: boolean | null
          allow_domains: string[] | null
          allow_email_send: boolean | null
          allow_file_write: boolean | null
          autonomy_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_calendar_write?: boolean | null
          allow_domains?: string[] | null
          allow_email_send?: boolean | null
          allow_file_write?: boolean | null
          autonomy_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_calendar_write?: boolean | null
          allow_domains?: string[] | null
          allow_email_send?: boolean | null
          allow_file_write?: boolean | null
          autonomy_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          telemetry_basic: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          telemetry_basic?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          telemetry_basic?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          created_at: string
          encrypted_password: string | null
          id: string
          last_used_at: string | null
          notes: string | null
          service_name: string
          tags: string[] | null
          updated_at: string
          url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          encrypted_password?: string | null
          id?: string
          last_used_at?: string | null
          notes?: string | null
          service_name: string
          tags?: string[] | null
          updated_at?: string
          url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          encrypted_password?: string | null
          id?: string
          last_used_at?: string | null
          notes?: string | null
          service_name?: string
          tags?: string[] | null
          updated_at?: string
          url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_feed_preferences: {
        Row: {
          boosted_topics: string[] | null
          boosted_users: string[] | null
          created_at: string
          facebook_interactions: number | null
          feed_layout: string
          hidden_topics: string[] | null
          hidden_users: string[] | null
          id: string
          instagram_interactions: number | null
          tenant_id: string
          tiktok_interactions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boosted_topics?: string[] | null
          boosted_users?: string[] | null
          created_at?: string
          facebook_interactions?: number | null
          feed_layout?: string
          hidden_topics?: string[] | null
          hidden_users?: string[] | null
          id?: string
          instagram_interactions?: number | null
          tenant_id: string
          tiktok_interactions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boosted_topics?: string[] | null
          boosted_users?: string[] | null
          created_at?: string
          facebook_interactions?: number | null
          feed_layout?: string
          hidden_topics?: string[] | null
          hidden_users?: string[] | null
          id?: string
          instagram_interactions?: number | null
          tenant_id?: string
          tiktok_interactions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          config: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          refresh_token: string | null
          scopes: string[] | null
          service: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interest_profiles: {
        Row: {
          created_at: string | null
          embedding: string | null
          interests: Json
          last_computed_at: string | null
          trace_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          interests?: Json
          last_computed_at?: string | null
          trace_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          interests?: Json
          last_computed_at?: string | null
          trace_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          affinity: number
          confidence: string
          interest_id: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affinity?: number
          confidence?: string
          interest_id: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affinity?: number
          confidence?: string
          interest_id?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_oauth_tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_pin_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          parent_folder_id: string | null
          section: string
          sort_index: number
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          parent_folder_id?: string | null
          section: string
          sort_index?: number
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          parent_folder_id?: string | null
          section?: string
          sort_index?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pin_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "user_pin_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pins: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          is_public: boolean
          lock_reason: string | null
          locked_until: string | null
          metadata: Json | null
          origin: string
          pin_type: Database["public"]["Enums"]["pin_type"]
          ref_id: string
          section: string | null
          sort_index: number | null
          title: string | null
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean
          lock_reason?: string | null
          locked_until?: string | null
          metadata?: Json | null
          origin?: string
          pin_type: Database["public"]["Enums"]["pin_type"]
          ref_id: string
          section?: string | null
          sort_index?: number | null
          title?: string | null
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean
          lock_reason?: string | null
          locked_until?: string | null
          metadata?: Json | null
          origin?: string
          pin_type?: Database["public"]["Enums"]["pin_type"]
          ref_id?: string
          section?: string | null
          sort_index?: number | null
          title?: string | null
          use_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pins_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "pin_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_shortcuts: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          shortcut: string
          target_id: string
          target_type: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          shortcut: string
          target_id: string
          target_type: string
          tenant_id?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          shortcut?: string
          target_id?: string
          target_type?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shortcuts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_shortcuts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_min"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          plan_id: string | null
          starts_at: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ui_prefs: {
        Row: {
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_access: {
        Row: {
          mfa_required: boolean
          role: string
          user_id: string
          vault_id: string
        }
        Insert: {
          mfa_required?: boolean
          role: string
          user_id: string
          vault_id: string
        }
        Update: {
          mfa_required?: boolean
          role?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_access_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          created_at: string
          enc_blob: string
          id: string
          kind: string
          meta: Json
          vault_id: string
        }
        Insert: {
          created_at?: string
          enc_blob: string
          id?: string
          kind: string
          meta?: Json
          vault_id: string
        }
        Update: {
          created_at?: string
          enc_blob?: string
          id?: string
          kind?: string
          meta?: Json
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaults_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaults_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "v_incentive_eligibility"
            referencedColumns: ["horse_id"]
          },
        ]
      }
      views_coldstart: {
        Row: {
          listing_id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          listing_id: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          listing_id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      visual_learning_events: {
        Row: {
          action_attempted: string
          correction_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          session_id: string | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          action_attempted: string
          correction_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          action_attempted?: string
          correction_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_events: {
        Row: {
          actor_role: string
          created_at: string
          id: number
          kind: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          actor_role: string
          created_at?: string
          id?: number
          kind: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          actor_role?: string
          created_at?: string
          id?: number
          kind?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      voice_interactions: {
        Row: {
          completed_at: string | null
          created_at: string
          direction: string
          duration_seconds: number | null
          id: string
          interaction_type: string
          metadata: Json | null
          recording_url: string | null
          status: string
          transcript: string | null
          twilio_call_sid: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          direction: string
          duration_seconds?: number | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          recording_url?: string | null
          status?: string
          transcript?: string | null
          twilio_call_sid?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          recording_url?: string | null
          status?: string
          transcript?: string | null
          twilio_call_sid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_post_rate_limits: {
        Row: {
          post_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          post_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          post_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      voice_preferences: {
        Row: {
          allow_voice_calls: boolean | null
          allow_voice_messages: boolean | null
          max_call_duration_minutes: number | null
          phone_number: string | null
          preferred_voice: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_voice_calls?: boolean | null
          allow_voice_messages?: boolean | null
          max_call_duration_minutes?: number | null
          phone_number?: string | null
          preferred_voice?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_voice_calls?: boolean | null
          allow_voice_messages?: boolean | null
          max_call_duration_minutes?: number | null
          phone_number?: string | null
          preferred_voice?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      web_access_allowlist: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      web_access_blocklist: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          note: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          note?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      web_automation_tasks: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          error: string | null
          id: string
          result: Json | null
          schedule_cron: string | null
          screenshots: string[] | null
          started_at: string | null
          status: string
          task_type: string
          url: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          result?: Json | null
          schedule_cron?: string | null
          screenshots?: string[] | null
          started_at?: string | null
          status?: string
          task_type: string
          url: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          result?: Json | null
          schedule_cron?: string | null
          screenshots?: string[] | null
          started_at?: string | null
          status?: string
          task_type?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      work_packages: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          role: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          role: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          role?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_action_my_timeline: {
        Row: {
          action: string | null
          agent: string | null
          correlation_id: string | null
          created_at: string | null
          id: string | null
          input: Json | null
          output: Json | null
          result: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          agent?: string | null
          correlation_id?: string | null
          created_at?: string | null
          id?: string | null
          input?: Json | null
          output?: Json | null
          result?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          agent?: string | null
          correlation_id?: string | null
          created_at?: string | null
          id?: string | null
          input?: Json | null
          output?: Json | null
          result?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      notif_center_view: {
        Row: {
          archived: boolean | null
          body: string | null
          category: Database["public"]["Enums"]["notification_category"] | null
          created_at: string | null
          link: string | null
          muted: boolean | null
          notif_id: string | null
          payload: Json | null
          priority: number | null
          read_at: string | null
          receipt_id: string | null
          seen_at: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: []
      }
      public_profiles_min: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          handle: string | null
          handle_lower: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          handle_lower?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          handle_lower?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_gap_clusters: {
        Row: {
          cluster_id: string | null
          crop: string | null
          equipment: string | null
          evidence_ids: Json | null
          first_seen: string | null
          kind: string | null
          last_seen: string | null
          pain: number | null
          pest: string | null
          season: string | null
          size: number | null
          topic: string | null
        }
        Relationships: []
      }
      v_incentive_eligibility: {
        Row: {
          deadline_at: string | null
          horse_id: string | null
          incentive_id: string | null
          is_open: boolean | null
          meets_rules: boolean | null
          program_name: string | null
        }
        Relationships: []
      }
      v_knowledge_health: {
        Row: {
          embedded_chunks: number | null
          pending_chunks: number | null
          total_chunks: number | null
        }
        Relationships: []
      }
      v_top_entities: {
        Row: {
          degree: number | null
          kind: string | null
          name: string | null
        }
        Relationships: []
      }
      vw_discovery_queue_health: {
        Row: {
          ct: number | null
          high_retry_ct: number | null
          last_activity: string | null
          oldest_queued: string | null
          p95_age_sec: number | null
          status: string | null
        }
        Relationships: []
      }
      vw_embedding_freshness: {
        Row: {
          ct: number | null
          hour_bucket: string | null
          last_write: string | null
        }
        Relationships: []
      }
      vw_events_queue_health: {
        Row: {
          ct: number | null
          last_activity: string | null
          p95_age_sec: number | null
          status: string | null
          topic: string | null
        }
        Relationships: []
      }
      vw_files_inbox: {
        Row: {
          category: string | null
          created_at: string | null
          folder_path: string | null
          id: string | null
          mime: string | null
          name: string | null
          ocr_text: string | null
          size: number | null
          starred: boolean | null
          status: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          text_content: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_files_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_files_library: {
        Row: {
          category: string | null
          created_at: string | null
          folder_path: string | null
          id: string | null
          mime: string | null
          name: string | null
          ocr_text: string | null
          size: number | null
          starred: boolean | null
          status: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          text_content: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_files_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_gap_severity: {
        Row: {
          avg_inventory: number | null
          category: string | null
          ct: number | null
          domain: string | null
          gap_level: string | null
        }
        Relationships: []
      }
      vw_kernel_slos: {
        Row: {
          p95_ms: number | null
          path: string | null
        }
        Relationships: []
      }
      vw_marketplace_gaps_critical: {
        Row: {
          category: string | null
          category_name: string | null
          category_slug: string | null
          domain: string | null
          gap_level: string | null
          inventory_ct: number | null
          last_checked: string | null
          tag: string | null
          user_demand: number | null
        }
        Relationships: []
      }
      vw_policy_health: {
        Row: {
          avg_epsilon: number | null
          avg_reward: number | null
          exploration_rate: number | null
          impression_count: number | null
          last_impression: string | null
          policy: string | null
          reward_stddev: number | null
        }
        Relationships: []
      }
      vw_profile_embeddings: {
        Row: {
          interests_embedding: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          interests_embedding?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          interests_embedding?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_slo_burnrate: {
        Row: {
          burn_rate: number | null
          calculated_at: string | null
          surface: string | null
        }
        Relationships: []
      }
      vw_starred: {
        Row: {
          category: string | null
          created_at: string | null
          folder_path: string | null
          id: string | null
          mime: string | null
          name: string | null
          ocr_text: string | null
          size: number | null
          starred: boolean | null
          status: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          text_content: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string | null
          mime?: string | null
          name?: string | null
          ocr_text?: string | null
          size?: number | null
          starred?: boolean | null
          status?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          text_content?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rocker_files_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "rocker_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_suggestions_coverage: {
        Row: {
          coverage_pct: number | null
          domain: string | null
          total_inventory: number | null
          users_with_interest: number | null
          users_with_inventory: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _log_rpc: {
        Args: { p_duration_ms: number; p_error?: string; p_rpc_name: string }
        Returns: undefined
      }
      _map_profile_to_entity: {
        Args: { p_profile_id: string }
        Returns: string
      }
      _owns_or_admin: {
        Args: { row_uid: string; uid: string }
        Returns: boolean
      }
      _pin_next_index: {
        Args: { p_user: string }
        Returns: number
      }
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      ack_discovery_item: {
        Args: { p_id: string; p_token: string }
        Returns: undefined
      }
      ack_event: {
        Args: { p_id: string; p_token: string }
        Returns: undefined
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      admin_clear_entitlement_override: {
        Args: { p_feature_id: string; p_target_user_id: string }
        Returns: undefined
      }
      admin_set_entitlement_override: {
        Args: {
          p_allow: boolean
          p_feature_id: string
          p_reason?: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      aggregate_user_patterns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ai_approve: {
        Args: {
          p_admin: string
          p_decision: string
          p_id: string
          p_notes: string
        }
        Returns: undefined
      }
      ai_mem_get: {
        Args: { p_route: string; p_target: string }
        Returns: {
          score: number
          selector: string
          source: string
        }[]
      }
      ai_mem_mark: {
        Args: { p_route: string; p_success: boolean; p_target: string }
        Returns: undefined
      }
      ai_mem_promote: {
        Args: { p_route: string; p_target: string }
        Returns: undefined
      }
      ai_mem_upsert: {
        Args: {
          p_meta?: Json
          p_route: string
          p_selector: string
          p_target: string
        }
        Returns: undefined
      }
      ai_propose: {
        Args: {
          p_from: string
          p_payload: Json
          p_proposer: string
          p_reason: string
          p_source: Json
          p_tenant: string
          p_to: string
        }
        Returns: string
      }
      ai_search_tasks: {
        Args: {
          p_match_count?: number
          p_match_threshold?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          description: string
          id: string
          similarity: number
          status: string
          title: string
        }[]
      }
      append_rocker_message: {
        Args: {
          p_content: string
          p_meta?: Json
          p_role: string
          p_thread: string
        }
        Returns: number
      }
      assign_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      attach_incentive_to_event: {
        Args: {
          p_entity_id: string
          p_event_id: string
          p_incentive_id: string
        }
        Returns: Json
      }
      auto_pin_rocker_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      badge_grant: {
        Args: {
          p_badge_id: string
          p_badge_type: string
          p_description?: string
          p_display_name: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bump_counter: {
        Args: { p_key: string; p_ttl_sec?: number }
        Returns: number
      }
      bump_rate: {
        Args:
          | { bucket: string; limit_in: number }
          | { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_rice_score: {
        Args: {
          confidence: number
          effort: number
          impact: number
          reach: number
        }
        Returns: number
      }
      calculate_user_percentiles: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      can_claim_entity: {
        Args: { entity_id: string }
        Returns: boolean
      }
      can_initiate_voice_call: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_view_calendar: {
        Args: { calendar_owner_id: string; viewer_id: string }
        Returns: boolean
      }
      cart_get: {
        Args: { p_session_id?: string }
        Returns: {
          cart_id: string
          item_id: string
          listing_id: string
          price_cents: number
          qty: number
          variant: Json
        }[]
      }
      cart_merge_guest_to_user: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      cart_upsert_item: {
        Args:
          | { p_listing_id: string; p_qty: number; p_session_id?: string }
          | {
              p_listing_id: string
              p_qty: number
              p_session_id?: string
              p_variant?: Json
            }
        Returns: string
      }
      check_auth_rate_limit: {
        Args: { p_identifier: string; p_window_sec?: number }
        Returns: Json
      }
      check_handle_available: {
        Args: { p_handle: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_limit: number; p_scope: string; p_window_sec?: number }
        Returns: Json
      }
      check_voice_post_rate_limit: {
        Args: {
          p_max_posts?: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      claim_embedding_jobs: {
        Args: { p_limit: number }
        Returns: {
          job_id: string
          knowledge_id: string
        }[]
      }
      claim_entity: {
        Args: { entity_id: string }
        Returns: Json
      }
      claim_ingest_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          attempts: number
          created_at: string
          external_idempotency_key: string | null
          id: string
          kind: string
          org_id: string
          payload: Json
          run_at: string
          status: string
          updated_at: string
        }
      }
      claim_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      class_upsert: {
        Args: { p_event_id: string; p_payload: Json }
        Returns: string
      }
      cleanup_expired_handle_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_idempotency: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_kernels: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_memories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_counters: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      commission_check_release: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      commission_distribute_dual_tree: {
        Args: { p_hold_days?: number; p_order_id: string; p_rule_set?: string }
        Returns: Json
      }
      commission_expire_old: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_onboarding: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      connect_entities: {
        Args: {
          p_dst: string
          p_meta?: Json
          p_rel: string
          p_src: string
          p_weight?: number
        }
        Returns: string
      }
      connection_metrics: {
        Args: { p_window_hours?: number }
        Returns: {
          count: number
          object_type: string
          relation: string
        }[]
      }
      connection_toggle: {
        Args: { p_apps?: string[]; p_edge_type: string; p_entity_id: string }
        Returns: Json
      }
      connection_unfollow: {
        Args: { p_action?: string; p_entity_id: string }
        Returns: Json
      }
      contributor_window_status: {
        Args: { p_entity_id: string }
        Returns: Json
      }
      crm_contact_upsert: {
        Args: {
          p_email?: string
          p_name: string
          p_phone?: string
          p_tags?: Json
        }
        Returns: string
      }
      crm_upsert_contact: {
        Args: { p_business_id: string; p_name: string; p_phone?: string }
        Returns: string
      }
      decrement_listing_stock: {
        Args: { p_listing_id: string; p_qty: number }
        Returns: undefined
      }
      delete_account_prepare: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      discovery_mark_error: {
        Args: { p_id: string; p_msg: string }
        Returns: undefined
      }
      dm_send: {
        Args: { p_body: string; p_metadata?: Json; p_recipient: string }
        Returns: string
      }
      draw_generate: {
        Args: { p_event_id: string; p_opts?: Json }
        Returns: Json
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      emit_signal: {
        Args:
          | { p_metadata?: Json; p_name: string }
          | {
              p_metadata?: Json
              p_name: string
              p_target_id?: string
              p_target_kind?: string
            }
        Returns: undefined
      }
      enable_mfa: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      end_price_test: {
        Args: { p_test_id: string; p_winner?: string }
        Returns: Json
      }
      enqueue_discovery_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      enqueue_missing_embeddings: {
        Args: { p_limit?: number }
        Returns: number
      }
      ensure_category_for_interest: {
        Args: { p_interest_id: string }
        Returns: undefined
      }
      entitlement_gate_metrics: {
        Args: { p_window_minutes?: number }
        Returns: {
          calls: number
          feature: string
          outcome: string
          rate_pct: number
        }[]
      }
      entitlement_override_set: {
        Args: { p_allow: boolean; p_feature_id: string; p_user_id: string }
        Returns: string
      }
      entity_claim_approve: {
        Args: { p_claim_id: string }
        Returns: Json
      }
      entity_claim_reject: {
        Args: { p_claim_id: string; p_reason: string }
        Returns: undefined
      }
      entity_claim_start: {
        Args: {
          p_contact_target?: string
          p_entity_id: string
          p_method: Database["public"]["Enums"]["claim_method"]
        }
        Returns: string
      }
      entity_counts_by_kind: {
        Args: { p_user_id: string }
        Returns: {
          count: number
          kind: string
        }[]
      }
      entity_create_unclaimed: {
        Args: {
          p_contributor_user_id?: string
          p_display_name: string
          p_handle?: string
          p_kind: Database["public"]["Enums"]["entity_kind"]
          p_provenance?: Json
          p_window_key?: string
        }
        Returns: string
      }
      entry_submit: {
        Args: {
          p_class_id: string
          p_horse_entity_id?: string
          p_opts?: Json
          p_rider_user_id: string
        }
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      fail_discovery_item: {
        Args: { p_error: string; p_id: string; p_token: string }
        Returns: undefined
      }
      fail_event: {
        Args: { p_error: string; p_id: string; p_token: string }
        Returns: undefined
      }
      favorite_toggle: {
        Args:
          | {
              p_fav_type: string
              p_note?: string
              p_ref_id: string
              p_tags?: string[]
            }
          | { p_fav_type: string; p_ref_id: string }
        Returns: Json
      }
      favorites_check: {
        Args: { p_items: Json }
        Returns: {
          is_favorited: boolean
          ref_id: string
        }[]
      }
      favorites_list: {
        Args:
          | { p_fav_type?: string; p_limit?: number; p_offset?: number }
          | { p_fav_type?: string; p_user_id: string }
        Returns: {
          created_at: string
          fav_type: string
          id: string
          note: string
          ref_id: string
          tags: string[]
        }[]
      }
      feature_introspect: {
        Args: {
          p_introspect_all?: boolean
          p_rpcs?: string[]
          p_tables?: string[]
        }
        Returns: Json
      }
      feature_probe: {
        Args: { p_functions: string[]; p_tables: string[] }
        Returns: Json
      }
      feed_fusion_home: {
        Args:
          | {
              p_cursor?: number
              p_lane: string
              p_limit?: number
              p_profile_id: string
            }
          | {
              p_cursor?: string
              p_lane: string
              p_limit?: number
              p_user_id: string
            }
          | {
              p_cursor_id?: string
              p_cursor_ts?: string
              p_limit?: number
              p_mode?: string
              p_user_id: string
            }
        Returns: {
          created_at: string
          entity_id: string
          item_id: string
          item_type: string
          next_cursor_id: string
          next_cursor_ts: string
          payload: Json
          rank: number
        }[]
      }
      feed_fusion_home_rate_limited: {
        Args: {
          p_cursor?: string
          p_lane: string
          p_limit?: number
          p_user_id: string
        }
        Returns: Json
      }
      feed_fusion_profile: {
        Args:
          | { p_cursor?: number; p_limit?: number; p_profile_id: string }
          | {
              p_cursor?: string
              p_entity_id: string
              p_lane: string
              p_limit?: number
              p_user_id: string
            }
          | {
              p_cursor_id?: string
              p_cursor_ts?: string
              p_entity_id: string
              p_limit?: number
              p_mode?: string
            }
        Returns: {
          created_at: string
          item_id: string
          item_type: string
          payload: Json
          score: number
        }[]
      }
      feed_hide: {
        Args:
          | { p_entity_id: string; p_post_id: string }
          | { p_entity_id: string; p_post_id: string; p_reason?: string }
        Returns: undefined
      }
      feed_pending_targets: {
        Args:
          | { p_cursor?: string; p_entity_id: string; p_limit?: number }
          | { p_entity_id: string }
        Returns: {
          approved: boolean
          created_at: string
          post_id: string
          reason: string
          source_post_id: string
          target_entity_id: string
        }[]
      }
      feed_unhide: {
        Args: { p_entity_id: string; p_post_id: string }
        Returns: undefined
      }
      flag_content: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_details?: string
          p_reason: string
        }
        Returns: string
      }
      follow_and_pin: {
        Args: { p_apps?: string[]; p_business_id: string }
        Returns: Json
      }
      gc_intent_signals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gc_learning_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_message_summary: {
        Args: { p_date?: string; p_thread_id: string; p_user_id: string }
        Returns: Json
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_ai_preferences: {
        Args: { p_user_id: string }
        Returns: {
          confirm_threshold: number | null
          created_at: string | null
          dnd_end: string | null
          dnd_start: string | null
          id: string
          live_question_cadence: string | null
          max_questions_per_thread: number | null
          silence_ms: number | null
          snoozed_until: string | null
          super_mode: boolean | null
          updated_at: string | null
          user_id: string
          voice_enabled: boolean | null
        }
      }
      get_dashboard_upcoming_events: {
        Args: { p_horizon?: string; p_user_id: string }
        Returns: Json
      }
      get_downline_leaderboard: {
        Args: { p_limit?: number; p_metric?: string }
        Returns: {
          display_name: string
          party_id: string
          party_kind: string
          rank: number
          total_orders: number
          total_sales: number
        }[]
      }
      get_entitlements: {
        Args: { p_user_id?: string }
        Returns: {
          feature_id: string
        }[]
      }
      get_event_viewable: {
        Args: { p_event_id: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          end_at: string
          host_avatar: string
          host_name: string
          host_profile_id: string
          id: string
          location: Json
          start_at: string
          title: string
        }[]
      }
      get_feature_flag: {
        Args: { flag_key: string }
        Returns: boolean
      }
      get_guardrail_settings: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_knowledge_scope_filter: {
        Args: { p_tenant_id?: string; p_user_id: string }
        Returns: string
      }
      get_my_commission_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          payable: number
          pending: number
          total_earned: number
          total_orders: number
          type_breakdown: Json
        }[]
      }
      get_my_downline_tree: {
        Args: { p_max_depth?: number }
        Returns: {
          commission_earned: number
          depth: number
          party_id: string
          party_kind: string
          path: string[]
          total_orders: number
          total_sales: number
          user_id: string
        }[]
      }
      get_price_suggestions: {
        Args: { p_listing_id: string }
        Returns: Json
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_tables_rls_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          policies: Json
          risk_level: string
          rls_enabled: boolean
          table_name: string
          table_schema: string
        }[]
      }
      get_user_aggregate_counts: {
        Args: { p_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
          likes_count: number
        }[]
      }
      get_user_connection_kernels: {
        Args: { p_user_id?: string }
        Returns: {
          context_data: Json
          kernel_type: string
          object_id: string
          priority: number
          source: string
        }[]
      }
      get_user_kernels: {
        Args: { p_user_id?: string }
        Returns: {
          context_data: Json
          context_entity_id: string
          entity_display_name: string
          kernel_id: string
          kernel_type: string
          priority: number
          source: string
        }[]
      }
      get_user_network: {
        Args: { p_user_id: string }
        Returns: {
          entity_id: string
          rel: string
          updated_at: string
          weight: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_workspaces: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_kind"]
          handle: string
          is_owner: boolean
          role: string
        }[]
      }
      get_workspace_summary: {
        Args: { p_entity_id: string }
        Returns: Json
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_app_role: {
        Args: { p_role: string }
        Returns: boolean
      }
      has_calendar_access: {
        Args: {
          cal_id: string
          min_role?: Database["public"]["Enums"]["calendar_role"]
          user_id: string
        }
        Returns: boolean
      }
      has_collection_access: {
        Args: {
          coll_id: string
          min_role?: Database["public"]["Enums"]["calendar_role"]
          user_id: string
        }
        Returns: boolean
      }
      has_feature: {
        Args: { p_feature_id: string; p_user_id?: string }
        Returns: boolean
      }
      has_incentive_action: {
        Args: { p_horse_id: string; p_incentive_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args:
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
          | { _role: string; _user_id: string }
        Returns: boolean
      }
      has_site_opt_in: {
        Args: { p_tenant: string; p_user: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      incentive_nominate: {
        Args: { p_horse_id: string; p_incentive_id: string; p_metadata?: Json }
        Returns: string
      }
      increment_job_attempt: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      increment_pin_use: {
        Args: { p_pin_id: string; p_unlock_threshold?: number }
        Returns: Json
      }
      install_app: {
        Args: { p_app_key: string; p_config?: Json; p_entity_id: string }
        Returns: undefined
      }
      interest_catalog_browse: {
        Args: { p_domain?: string; p_limit?: number; p_locale?: string }
        Returns: {
          category: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          locale: string
          sort_order: number | null
          tag: string
        }[]
      }
      interest_catalog_search: {
        Args: { p_limit?: number; p_locale?: string; p_q: string }
        Returns: {
          category: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          locale: string
          sort_order: number | null
          tag: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { _user_id: string }
        Returns: boolean
      }
      is_biz_member: {
        Args: { _business_id: string; _min_role?: string; _user_id: string }
        Returns: boolean
      }
      is_pin_locked: {
        Args: { p_pin_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never> | { _user_id: string }
        Returns: boolean
      }
      is_user_hidden_from_admin: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      lease_discovery_items: {
        Args: { p_limit: number; p_ttl_seconds: number }
        Returns: {
          attempts: number
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          interest_id: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          reason: string
          status: string
          updated_at: string
        }[]
      }
      lease_events: {
        Args: { p_limit: number; p_topic: string; p_ttl_seconds: number }
        Returns: {
          attempts: number
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          interest_id: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          reason: string
          status: string
          updated_at: string
        }[]
      }
      link_chunks_to_files: {
        Args: Record<PropertyKey, never>
        Returns: {
          linked_count: number
        }[]
      }
      linked_account_upsert: {
        Args: {
          p_display_name?: string
          p_handle: string
          p_metadata?: Json
          p_profile_url?: string
          p_proof_url?: string
          p_provider: string
        }
        Returns: string
      }
      linked_account_verify: {
        Args: {
          p_account_id: string
          p_proof_data?: Json
          p_verification_method: string
        }
        Returns: Json
      }
      list_apps: {
        Args: { p_entity_id?: string; p_q?: string }
        Returns: Json
      }
      lock_next_job: {
        Args: { p_pool: string; p_topics: string[] }
        Returns: {
          attempts: number
          id: string
          max_attempts: number
          payload: Json
          priority: number
          region: string
          tenant_id: string
          topic: string
        }[]
      }
      log_metric: {
        Args: {
          p_action: string
          p_hit5: boolean
          p_latency_ms: number
          p_low_conf: boolean
          p_mrr: number
          p_retrieved_ids: string[]
          p_scores: number[]
          p_tokens_in: number
          p_tokens_out: number
          p_user_id: string
        }
        Returns: number
      }
      log_usage_event_v2: {
        Args: {
          p_duration_ms?: number
          p_event_type: string
          p_item_id: string
          p_item_kind: string
          p_lane?: string
          p_meta?: Json
          p_position?: number
          p_session_id: string
          p_surface: string
        }
        Returns: undefined
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      marketplace_suggestions_for_user: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          category_id: string
          currency: string
          image_url: string
          interest_id: string
          price_cents: number
          score: number
          source: string
          title: string
          url: string
        }[]
      }
      match_kb_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          content: string
          doc_id: string
          id: string
          similarity: number
          title: string
          uri: string
        }[]
      }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          idx: number
          item_id: string
          similarity: number
          text: string
        }[]
      }
      match_knowledge_items: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          id: string
          scope: string
          similarity: number
          subcategory: string
          summary: string
          tags: string[]
          title: string
          uri: string
        }[]
      }
      match_market_chunks: {
        Args: { match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          similarity: number
        }[]
      }
      match_private_chunks: {
        Args: {
          match_count: number
          org_id_in: string
          query_embedding: string
        }
        Returns: {
          content: string
          doc_id: string
          id: string
          similarity: number
        }[]
      }
      match_rocker_memory_vec: {
        Args: { match_count?: number; q: string; thread?: string }
        Returns: {
          chunk_index: number
          content: string
          created_at: string
          id: string
          meta: Json
          similarity: number
          user_id: string
        }[]
      }
      needs_kyc: {
        Args: { _business_id: string }
        Returns: boolean
      }
      notif_mark_all_read: {
        Args: { p_lane?: string }
        Returns: undefined
      }
      notif_mark_read: {
        Args: { p_ids: string[] }
        Returns: undefined
      }
      notif_send: {
        Args:
          | {
              p_body: string
              p_category: Database["public"]["Enums"]["notification_category"]
              p_link?: string
              p_priority?: number
              p_title: string
              p_user_ids: string[]
            }
          | {
              p_body: string
              p_category: string
              p_link?: string
              p_payload?: Json
              p_title: string
              p_user_id: string
            }
        Returns: string
      }
      order_reverse_unlabeled: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      order_start_from_cart: {
        Args: { p_cart_id: string; p_idempotency_key: string }
        Returns: {
          order_id: string
          stripe_payment_intent_id: string
        }[]
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      payout_compute: {
        Args: { p_class_id: string }
        Returns: Json
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      post_approve_target: {
        Args: { p_entity_id: string; p_post_id: string }
        Returns: Json
      }
      post_attribution_chain: {
        Args: { p_post_id: string }
        Returns: {
          author_id: string
          created_at: string
          level: number
          post_id: string
          repost_count: number
        }[]
      }
      post_create: {
        Args: {
          p_body: string
          p_entity_id?: string
          p_media?: Json
          p_visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Returns: string
      }
      post_publish: {
        Args: {
          p_author_entity_id: string
          p_body: string
          p_media?: Json
          p_tag_entity_ids?: string[]
          p_target_entity_ids?: string[]
        }
        Returns: string
      }
      post_reject_target: {
        Args: { p_entity_id: string; p_post_id: string; p_reason?: string }
        Returns: Json
      }
      post_repost: {
        Args:
          | {
              p_by_entity_id: string
              p_original_post_id: string
              p_target_entity_ids?: string[]
            }
          | {
              p_caption?: string
              p_source_post_id: string
              p_target_entity_ids?: string[]
            }
        Returns: string
      }
      post_target_approve: {
        Args: { p_entity_id: string; p_post_id: string }
        Returns: undefined
      }
      post_target_reject: {
        Args: { p_entity_id: string; p_post_id: string }
        Returns: undefined
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      prune_ghost_entity_pins: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      queue_campaign_messages: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      recall_long_memory: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          content: string
          id: string
          key: string
          kind: string
          score: number
          value: Json
        }[]
      }
      recall_memories: {
        Args: { p_k?: number; p_query: string }
        Returns: {
          content: string
          id: string
          importance: number
          kind: string
          score: number
          tags: string[]
          title: string
        }[]
      }
      recompute_profile_embedding: {
        Args: { p_user_id: string }
        Returns: Json
      }
      record_view: {
        Args: { p_listing_id: string; p_session_id?: string }
        Returns: undefined
      }
      release_business_handle: {
        Args: { p_handle: string }
        Returns: boolean
      }
      remove_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      reorder_pins: {
        Args: { p_pin_positions: Json; p_profile_id: string }
        Returns: undefined
      }
      reposts_list: {
        Args: { p_limit?: number; p_offset?: number; p_user_id?: string }
        Returns: {
          caption: string
          created_at: string
          repost_count: number
          repost_id: string
          repost_post_id: string
          source_author_id: string
          source_body: string
          source_post_id: string
        }[]
      }
      requeue_failed_job: {
        Args: { p_error: string; p_job_id: string }
        Returns: undefined
      }
      requires_step_up: {
        Args: { action_name: string }
        Returns: boolean
      }
      reservation_check_in: {
        Args: { p_qr: string }
        Returns: boolean
      }
      reservation_issue_qr: {
        Args: { p_res_id: string }
        Returns: string
      }
      reservations_export_csv: {
        Args: { p_event_id: string }
        Returns: string
      }
      reserve_business_handle: {
        Args: { p_handle: string; p_minutes?: number }
        Returns: boolean
      }
      reset_auth_rate_limit: {
        Args: { p_identifier: string }
        Returns: undefined
      }
      resolve_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      result_record: {
        Args: { p_entry_id: string; p_payload: Json; p_round: number }
        Returns: undefined
      }
      revoke_sessions: {
        Args: { target_user_id?: string }
        Returns: Json
      }
      rocker_check_consent: {
        Args: { p_action_type: string; p_user_id: string }
        Returns: Json
      }
      rocker_create_category: {
        Args: {
          p_category_type: string
          p_color?: string
          p_icon?: string
          p_name: string
          p_parent_id?: string
        }
        Returns: string
      }
      rocker_dm: {
        Args: { p_channel?: string; p_text: string; p_user_id: string }
        Returns: undefined
      }
      rocker_generate_followup_list: {
        Args: { p_days_idle?: number }
        Returns: {
          contact_id: string
          name: string
          reason: string
        }[]
      }
      rocker_get_category_path: {
        Args: { p_category_id: string }
        Returns: string
      }
      rocker_log_action: {
        Args:
          | {
              p_action: string
              p_agent: string
              p_correlation_id?: string
              p_input?: Json
              p_output?: Json
              p_result?: string
              p_user_id: string
            }
          | {
              p_action: string
              p_agent: string
              p_entity_id?: string
              p_input?: Json
              p_output?: Json
              p_reason?: string
              p_result?: string
              p_user_id: string
            }
        Returns: string
      }
      rocker_next_best_actions: {
        Args: { p_user_id: string }
        Returns: Json
      }
      rpc_create_post: {
        Args: {
          p_content: string
          p_idempotency_key: string
          p_media_urls?: string[]
          p_visibility?: string
        }
        Returns: string
      }
      rpc_metrics: {
        Args: { p_window_minutes?: number }
        Returns: {
          avg_ms: number
          calls: number
          error_rate_pct: number
          p50_ms: number
          p95_ms: number
          p99_ms: number
          rpc_name: string
        }[]
      }
      rpc_observe: {
        Args: {
          p_duration_ms: number
          p_error_code?: string
          p_meta?: Json
          p_rpc_name: string
          p_status: string
        }
        Returns: undefined
      }
      rpc_slowest: {
        Args: { p_limit?: number; p_window_minutes?: number }
        Returns: {
          avg_ms: number
          calls: number
          error_rate_pct: number
          p50_ms: number
          p95_ms: number
          p99_ms: number
          rpc_name: string
        }[]
      }
      save_item: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      save_memory: {
        Args: {
          p_content: string
          p_expires_at?: string
          p_importance?: number
          p_kind?: string
          p_tags?: string[]
          p_title: string
        }
        Returns: string
      }
      search_entities: {
        Args: { p_limit?: number; p_query: string; p_tenant_id: string }
        Returns: {
          entity_id: string
          entity_type: string
          image_url: string
          is_public: boolean
          metadata: Json
          name: string
          similarity_score: number
        }[]
      }
      search_hybrid: {
        Args: {
          alpha?: number
          k?: number
          q_text: string
          q_vec: string
          thread?: string
        }
        Returns: {
          chunk_index: number
          content: string
          created_at: string
          id: string
          meta: Json
          score: number
          similarity: number
          user_id: string
        }[]
      }
      search_profiles_prefix: {
        Args: { lim?: number; q: string }
        Returns: {
          avatar_url: string
          display_name: string
          handle: string
          user_id: string
        }[]
      }
      search_unclaimed_profiles: {
        Args: { p_limit?: number; p_type: string }
        Returns: {
          description: string
          entity_type: string
          id: string
          name: string
        }[]
      }
      set_appearance: {
        Args: {
          p_screensaver: Json
          p_subject_id: string
          p_subject_type: string
          p_wallpaper: string
        }
        Returns: undefined
      }
      set_feature_flag: {
        Args: { flag_enabled: boolean; flag_key: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_user_acquisition: {
        Args: { p_payload: Json }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      slugify: {
        Args: { p_text: string }
        Returns: string
      }
      sp_reveal_prediction: {
        Args: { p_prediction_json: Json; p_round_id: string; p_salt: string }
        Returns: undefined
      }
      sp_score_round: {
        Args: { p_round_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      start_price_test: {
        Args: { p_listing_id: string; p_variants: Json }
        Returns: string
      }
      start_rocker_thread: {
        Args: { p_title?: string }
        Returns: string
      }
      super_admin_has_capability: {
        Args: { _capability: string; _user_id: string }
        Returns: boolean
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unfollow_options: {
        Args: { p_business_id: string; p_mode: string }
        Returns: Json
      }
      uninstall_app: {
        Args: { p_app_key: string; p_entity_id: string }
        Returns: undefined
      }
      unlock_expired_pins: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      unsave_item: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      update_prediction_accuracy: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      upsert_business_profile: {
        Args: { p_kind: string; p_meta?: Json; p_name: string }
        Returns: string
      }
      upsert_entity: {
        Args: { p_kind: string; p_meta?: Json; p_name: string }
        Returns: string
      }
      user_aggregate_social_stats: {
        Args: { p_user_id: string }
        Returns: {
          total_followers: number
          total_following: number
          total_likes: number
        }[]
      }
      user_interests_remove: {
        Args: { p_interest_id: string }
        Returns: undefined
      }
      user_interests_upsert: {
        Args: { p_items: string }
        Returns: undefined
      }
      validate_business_handle: {
        Args: { p_handle: string }
        Returns: {
          available: boolean
          normalized: string
          suggestions: string[]
        }[]
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      ai_channel: "snackbar" | "dm" | "email" | "push"
      ai_game_kind: "yn" | "mcq" | "scale"
      app_role:
        | "admin"
        | "moderator"
        | "business_owner"
        | "rider"
        | "breeder"
        | "owner"
        | "guest"
        | "super_admin"
        | "user"
      calendar_role: "owner" | "writer" | "reader"
      calendar_type: "personal" | "business" | "horse" | "event" | "custom"
      claim_method: "email" | "sms" | "manual"
      claim_status: "pending" | "approved" | "rejected" | "canceled"
      conversation_type: "direct" | "group"
      discount_type: "percent" | "amount"
      draft_kind: "post" | "listing" | "event"
      draft_status: "draft" | "scheduled" | "published"
      entity_kind: "person" | "business" | "horse" | "event" | "ai"
      entity_status: "unclaimed" | "claimed" | "verified"
      entity_type:
        | "profile"
        | "horse"
        | "business"
        | "breeder"
        | "owner"
        | "rider"
        | "stable"
        | "event"
      event_kind: "race" | "incentive" | "clinic" | "sale" | "other"
      event_visibility: "public" | "private" | "busy"
      memory_type:
        | "preference"
        | "fact"
        | "goal"
        | "note"
        | "policy"
        | "schema"
        | "relationship"
        | "family"
        | "family_member"
        | "personal_info"
        | "interest"
        | "hobby"
        | "skill"
        | "project"
        | "project_context"
        | "notification_preference"
      notification_category:
        | "social"
        | "orders"
        | "events"
        | "crm"
        | "ai"
        | "system"
      pin_type: "entity" | "app" | "route" | "folder"
      post_visibility: "public" | "followers" | "private"
      promotion_kind: "discount" | "boost"
      recurrence_freq: "daily" | "weekly" | "monthly" | "yearly"
      task_status: "open" | "done" | "cancelled"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_channel: ["snackbar", "dm", "email", "push"],
      ai_game_kind: ["yn", "mcq", "scale"],
      app_role: [
        "admin",
        "moderator",
        "business_owner",
        "rider",
        "breeder",
        "owner",
        "guest",
        "super_admin",
        "user",
      ],
      calendar_role: ["owner", "writer", "reader"],
      calendar_type: ["personal", "business", "horse", "event", "custom"],
      claim_method: ["email", "sms", "manual"],
      claim_status: ["pending", "approved", "rejected", "canceled"],
      conversation_type: ["direct", "group"],
      discount_type: ["percent", "amount"],
      draft_kind: ["post", "listing", "event"],
      draft_status: ["draft", "scheduled", "published"],
      entity_kind: ["person", "business", "horse", "event", "ai"],
      entity_status: ["unclaimed", "claimed", "verified"],
      entity_type: [
        "profile",
        "horse",
        "business",
        "breeder",
        "owner",
        "rider",
        "stable",
        "event",
      ],
      event_kind: ["race", "incentive", "clinic", "sale", "other"],
      event_visibility: ["public", "private", "busy"],
      memory_type: [
        "preference",
        "fact",
        "goal",
        "note",
        "policy",
        "schema",
        "relationship",
        "family",
        "family_member",
        "personal_info",
        "interest",
        "hobby",
        "skill",
        "project",
        "project_context",
        "notification_preference",
      ],
      notification_category: [
        "social",
        "orders",
        "events",
        "crm",
        "ai",
        "system",
      ],
      pin_type: ["entity", "app", "route", "folder"],
      post_visibility: ["public", "followers", "private"],
      promotion_kind: ["discount", "boost"],
      recurrence_freq: ["daily", "weekly", "monthly", "yearly"],
      task_status: ["open", "done", "cancelled"],
    },
  },
} as const
