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
      ai_feedback: {
        Row: {
          created_at: string | null
          id: string
          kind: string | null
          payload: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind?: string | null
          payload: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string | null
          payload?: Json
          session_id?: string | null
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
          provenance: Json | null
          source: string
          tags: string[] | null
          tenant_id: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key: string
          provenance?: Json | null
          source?: string
          tags?: string[] | null
          tenant_id: string
          type: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          provenance?: Json | null
          source?: string
          tags?: string[] | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["memory_type"]
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
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
      commission_ledger: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          metadata: Json
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
          id?: string
          idempotency_key?: string | null
          metadata?: Json
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
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          settlement_batch_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
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
          phone: string | null
          status: string
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
          phone?: string | null
          status?: string
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
          phone?: string | null
          status?: string
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
      entity_profiles: {
        Row: {
          claimed_by: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          owner_id: string
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          owner_id: string
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          owner_id?: string
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
          claimed_by: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          owner_id: string
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          owner_id: string
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          owner_id?: string
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_profiles_2025_02: {
        Row: {
          claimed_by: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          owner_id: string
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          owner_id: string
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          owner_id?: string
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_profiles_2025_03: {
        Row: {
          claimed_by: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          embedding: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_claimed: boolean
          name: string
          owner_id: string
          search_vector: unknown | null
          slug: string
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name: string
          owner_id: string
          search_vector?: unknown | null
          slug: string
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          embedding?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_claimed?: boolean
          name?: string
          owner_id?: string
          search_vector?: unknown | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          business_id: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
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
          id?: string
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
          id?: string
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
        ]
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
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string | null
          id: string
          kind: string
          media: Json | null
          tenant_id: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string | null
          id?: string
          kind: string
          media?: Json | null
          tenant_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          media?: Json | null
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          calendar_public: boolean | null
          calendar_settings: Json | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          calendar_public?: boolean | null
          calendar_settings?: Json | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          calendar_public?: boolean | null
          calendar_settings?: Json | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      rocker_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
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
        ]
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
    }
    Views: {
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
    }
    Functions: {
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
      aggregate_user_patterns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_user_percentiles: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      can_claim_entity: {
        Args: { entity_id: string }
        Returns: boolean
      }
      can_view_calendar: {
        Args: { calendar_owner_id: string; viewer_id: string }
        Returns: boolean
      }
      claim_entity: {
        Args: { entity_id: string }
        Returns: Json
      }
      cleanup_expired_idempotency: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_memories: {
        Args: Record<PropertyKey, never>
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
      enable_mfa: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
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
      get_knowledge_scope_filter: {
        Args: { p_tenant_id?: string; p_user_id: string }
        Returns: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
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
      has_role: {
        Args: { _role: string; _user_id: string }
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
      is_admin: {
        Args: { p_user: string }
        Returns: boolean
      }
      is_biz_member: {
        Args: { _business_id: string; _min_role?: string; _user_id: string }
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
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      needs_kyc: {
        Args: { _business_id: string }
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
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
      requires_step_up: {
        Args: { action_name: string }
        Returns: boolean
      }
      revoke_sessions: {
        Args: { target_user_id?: string }
        Returns: Json
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
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
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
      app_role:
        | "admin"
        | "moderator"
        | "business_owner"
        | "rider"
        | "breeder"
        | "owner"
        | "guest"
      calendar_role: "owner" | "writer" | "reader"
      calendar_type: "personal" | "business" | "horse" | "event" | "custom"
      entity_type:
        | "profile"
        | "horse"
        | "business"
        | "breeder"
        | "owner"
        | "rider"
        | "stable"
        | "event"
      event_visibility: "public" | "private" | "busy"
      memory_type: "preference" | "fact" | "goal" | "note" | "policy" | "schema"
      recurrence_freq: "daily" | "weekly" | "monthly" | "yearly"
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
      app_role: [
        "admin",
        "moderator",
        "business_owner",
        "rider",
        "breeder",
        "owner",
        "guest",
      ],
      calendar_role: ["owner", "writer", "reader"],
      calendar_type: ["personal", "business", "horse", "event", "custom"],
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
      event_visibility: ["public", "private", "busy"],
      memory_type: ["preference", "fact", "goal", "note", "policy", "schema"],
      recurrence_freq: ["daily", "weekly", "monthly", "yearly"],
    },
  },
} as const
