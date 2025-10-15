/**
 * Tool execution logic
 * Handles all tool calls from the AI agent
 */

export async function executeTool(
  toolName: string,
  args: any,
  supabaseClient: any,
  userId: string
): Promise<any> {
  console.log(`[Tool: ${toolName}]`, args);

  try {
    switch (toolName) {
      // ========== USER & IDENTITY ==========
      case 'get_current_user': {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError) throw authError;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('display_name, bio')
          .eq('user_id', userId)
          .maybeSingle();

        const fullName = (user as any)?.user_metadata?.full_name;
        const emailName = user.email?.split('@')[0];
        const friendlyName = profile?.display_name || fullName || emailName || null;

        return {
          success: true,
          user_id: user.id,
          email: user.email,
          display_name: friendlyName,
          bio: profile?.bio || null,
          message: `You are currently talking to ${friendlyName || user.email}`
        };
      }

      // ========== NAVIGATION ==========
      case 'navigate': {
        if (!args || !args.path) {
          return {
            success: false,
            error: 'Navigation path is required'
          };
        }
        return {
          success: true,
          path: args.path,
          action: 'navigate',
          message: `Navigating to ${args.path}`
        };
      }

      // ========== MEMORY & CONTEXT ==========
      case 'write_memory': {
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'write_memory',
            entry: {
              tenant_id: '00000000-0000-0000-0000-000000000000',
              user_id: userId,
              ...args
            }
          }
        });

        if (error) throw error;
        return { success: true, message: 'Memory saved', ...data };
      }

      case 'recall_user_context': {
        const results: any = { success: true };

        // Get profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        results.profile = profile;

        // Get memories if requested
        if (args.include_memory !== false) {
          const { data: memData } = await supabaseClient.functions.invoke('rocker-memory', {
            body: {
              action: 'search_memory',
              limit: 20
            }
          });
          results.memories = memData?.memories || [];
        }

        // Get analytics if requested
        if (args.include_analytics) {
          const { data: analytics } = await supabaseClient
            .from('ai_user_analytics')
            .select('*')
            .eq('user_id', userId)
            .order('calculated_at', { ascending: false })
            .limit(10);
          results.analytics = analytics || [];
        }

        return results;
      }

      // ========== ENTITY SEARCH ==========
      case 'search_entities': {
        const { data, error } = await supabaseClient.functions.invoke('entity-lookup', {
          body: { action: 'search', ...args }
        });

        if (error) throw error;
        return data;
      }

      // ========== BUSINESS ==========
      case 'get_business_data': {
        const { data: business, error } = await supabaseClient
          .from('businesses')
          .select('*, business_team(*)')
          .eq('id', args.business_id)
          .single();

        if (error) throw error;
        return { success: true, business };
      }

      case 'create_business': {
        const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const { data, error } = await supabaseClient
          .from('businesses')
          .insert({
            name: args.name,
            slug,
            description: args.description || args.name,
            owner_id: userId,
            created_by: userId
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          message: `Created business "${args.name}"!`,
          businessId: data.id,
          slug
        };
      }

      // ========== MLM ==========
      case 'get_mlm_stats': {
        const { data: referrals, error } = await supabaseClient
          .from('affiliate_subscriptions')
          .select('*')
          .eq('referrer_user_id', userId);

        if (error) throw error;

        const activeCount = referrals?.filter((r: any) => r.status === 'active').length || 0;
        const totalCommission = referrals?.reduce((sum: number, r: any) => {
          return sum + (r.commission_rate || 0);
        }, 0) || 0;

        return {
          success: true,
          stats: {
            total_referrals: referrals?.length || 0,
            active_referrals: activeCount,
            total_commission_rate: totalCommission
          }
        };
      }

      // ========== CALENDAR ==========
      case 'create_calendar_event': {
        // Get or create personal calendar
        let calendarId = args.calendar_id;

        if (!calendarId) {
          const { data: existingCal } = await supabaseClient
            .from('calendars')
            .select('id')
            .eq('owner_profile_id', userId)
            .eq('calendar_type', 'personal')
            .maybeSingle();

          if (existingCal) {
            calendarId = existingCal.id;
          } else {
            const { data: newCal, error: calError } = await supabaseClient
              .from('calendars')
              .insert({
                owner_profile_id: userId,
                name: 'My Calendar',
                calendar_type: 'personal',
                color: '#3b82f6'
              })
              .select()
              .single();

            if (calError) throw calError;
            calendarId = newCal.id;
          }
        }

        // Create event
        const metadata: any = { ...args.metadata };
        if (args.tts_message || args.voice_message) {
          metadata.tts_message = args.tts_message || args.voice_message || args.title;
        }

        const { data: event, error: eventError } = await supabaseClient
          .from('calendar_events')
          .insert({
            calendar_id: calendarId,
            title: args.title,
            description: args.description || args.title,
            starts_at: args.starts_at,
            ends_at: args.ends_at || args.starts_at,
            all_day: args.all_day || false,
            created_by: userId,
            metadata
          })
          .select()
          .single();

        if (eventError) throw eventError;

        // Create reminder if specified
        if (args.reminder_minutes !== undefined) {
          const reminderTime = new Date(args.starts_at);
          reminderTime.setMinutes(reminderTime.getMinutes() - args.reminder_minutes);

          await supabaseClient
            .from('calendar_event_reminders')
            .insert({
              event_id: event.id,
              profile_id: userId,
              trigger_at: reminderTime.toISOString()
            });
        }

        return {
          success: true,
          message: `Created calendar event "${args.title}"`,
          eventId: event.id
        };
      }

      // ========== SOCIAL ==========
      case 'save_post': {
        const { data, error } = await supabaseClient.functions.invoke('save-post', {
          body: args
        });
        if (error) throw error;
        return data;
      }

      case 'reshare_post': {
        const { data, error } = await supabaseClient.functions.invoke('reshare-post', {
          body: args
        });
        if (error) throw error;
        return data;
      }

      case 'recall_content': {
        const { data, error } = await supabaseClient.functions.invoke('recall-content', {
          body: args
        });
        if (error) throw error;
        return data;
      }

      // ========== EVENT MANAGEMENT ==========
      case 'create_event': {
        const { data, error } = await supabaseClient.functions.invoke('generate-event-form', {
          body: {
            eventRules: `Create a ${args.event_type || 'general'} event`,
            formType: 'registration'
          }
        });
        if (error) throw error;
        return { success: true, message: 'Event builder started', form: data };
      }

      // ========== CRM ==========
      case 'create_crm_contact': {
        const { data, error } = await supabaseClient
          .from('crm_contacts')
          .insert({
            business_id: args.business_id,
            name: args.name,
            email: args.email || null,
            phone: args.phone || null,
            notes: args.notes || null,
            status: 'lead'
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          message: `Added ${args.name} to CRM!`,
          contactId: data.id
        };
      }

      // ========== PROFILE MANAGEMENT ==========
      case 'edit_profile': {
        const updates: Record<string, any> = {};
        if (args.display_name) updates.display_name = args.display_name;
        if (args.bio) updates.bio = args.bio;
        if (args.avatar_url) updates.avatar_url = args.avatar_url;

        const { error } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('user_id', userId);

        if (error) throw error;

        return {
          success: true,
          message: 'Profile updated!'
        };
      }

      case 'claim_entity': {
        const { error } = await supabaseClient
          .from('entity_profiles')
          .update({
            claimed_by: userId,
            is_claimed: true
          })
          .eq('id', args.entity_id)
          .eq('entity_type', args.entity_type);

        if (error) throw error;

        return {
          success: true,
          message: `Claimed ${args.entity_type}!`
        };
      }

      // ========== FILE OPERATIONS (DEVELOPER TOOLS) ==========
      case 'read_file':
      case 'edit_file':
      case 'search_files':
      case 'analyze_file':
        return {
          success: false,
          error: 'Developer tools are not yet implemented in this version'
        };

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[Tool: ${toolName}] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
