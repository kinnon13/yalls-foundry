/**
 * Tool execution logic
 * Handles all tool calls from the AI agent
 */

const PLATFORM_TOUR = {
  home: {
    path: '/',
    title: 'Home Dashboard',
    description: 'Your central hub for all platform activities. From here you can access posts, marketplace, events, and connect with the community.',
    highlights: [
      'Feed of recent posts and updates',
      'Quick navigation to all major features',
      'Personalized content recommendations',
      'Global header with search and profile access'
    ]
  },
  marketplace: {
    path: '/marketplace',
    title: 'Marketplace',
    description: 'Browse and discover items, services, and opportunities shared by the community.',
    highlights: [
      'Filter by categories and search',
      'View detailed listings with images',
      'Flag inappropriate content',
      'Request new categories'
    ]
  },
  calendar: {
    path: '/calendar',
    title: 'Calendar & Events',
    description: 'Manage your schedule, create events, and coordinate with others.',
    highlights: [
      'View events in calendar format',
      'Create and manage your events',
      'RSVP to community events',
      'Set reminders for important dates'
    ]
  },
  horses: {
    path: '/horses',
    title: 'Horse Registry',
    description: 'Comprehensive horse management and tracking system.',
    highlights: [
      'Register and claim horses',
      'Track lineage and ownership',
      'Manage incentive programs',
      'View complete horse profiles'
    ]
  },
  dashboard: {
    path: '/dashboard',
    title: 'Personal Dashboard',
    description: 'Your personalized overview with AI-powered insights and quick actions.',
    highlights: [
      'Rocker AI assistant integration',
      'Personalized suggestions',
      'Quick access to your content',
      'Activity overview'
    ]
  },
  'ai-management': {
    path: '/ai-management',
    title: 'AI Management',
    description: 'Control what Rocker knows about you and manage AI interactions.',
    highlights: [
      'View and manage your memories',
      'Control data sharing preferences',
      'See what Rocker has learned',
      'Privacy controls for AI data'
    ]
  },
  admin: {
    path: '/admin/control-room',
    title: 'Admin Control Room',
    description: 'Comprehensive admin dashboard for platform management and diagnostics.',
    highlights: [
      'Feature flag management',
      'Security scanning and RLS policies',
      'Platform health monitoring',
      'User feedback and moderation tools',
      'Code audit and testing panels',
      'AI analytics and insights'
    ]
  }
};

export async function executeTool(
  toolName: string,
  args: any,
  supabaseClient: any,
  userId: string,
  actorRole: 'user' | 'admin' | 'knower' = 'user'
): Promise<any> {
  console.log(`[Tool: ${toolName}] [Mode: ${actorRole}]`, args);

  // ADMIN-ONLY TOOL GATING
  const ADMIN_ONLY_TOOLS = new Set([
    'read_raw_events',
    'export_csv',
    'ban_user',
    'impersonate',
    'moderate_content',
    'view_all_users',
    'system_config'
  ]);

  // KNOWER-ONLY TOOL GATING
  const KNOWER_ONLY_TOOLS = new Set([
    'aggregate_patterns',
    'analyze_trends',
    'optimize_models',
    'cross_user_insights'
  ]);

  // Block admin tools in user mode
  if (actorRole === 'user' && ADMIN_ONLY_TOOLS.has(toolName)) {
    return {
      success: false,
      error: `Tool "${toolName}" requires admin role. Switch to Admin Mode in the Control Room to use this.`
    };
  }

  // Block knower tools in user mode
  if (actorRole === 'user' && KNOWER_ONLY_TOOLS.has(toolName)) {
    return {
      success: false,
      error: `Tool "${toolName}" requires knower role. This is a system-level analytics function.`
    };
  }

  // Block knower tools in admin mode (privacy separation)
  if (actorRole === 'admin' && KNOWER_ONLY_TOOLS.has(toolName)) {
    return {
      success: false,
      error: `Tool "${toolName}" is only available in Knower (Andy) mode for privacy-preserving analytics.`
    };
  }

  // Tool implementations start here
  try {
    switch (toolName) {
      // ========== TOUR ==========
      case 'start_tour': {
        const tourOverview = Object.entries(PLATFORM_TOUR).map(([key, stop]) => 
          `• **${stop.title}**: ${stop.description}`
        ).join('\n');
        
        return {
          success: true,
          action: 'navigate',
          path: '/',
          message: `Welcome to the y'all's platform! Let me show you around.\n\n${tourOverview}\n\nI'll start at the Home Dashboard. Ready?`
        };
      }
      
      case 'navigate_to_tour_stop': {
        const section = args.section;
        const stop = PLATFORM_TOUR[section as keyof typeof PLATFORM_TOUR];
        
        if (!stop) {
          return {
            success: false,
            error: `Tour stop "${section}" not found`
          };
        }
        
        const highlightsList = stop.highlights.map(h => `• ${h}`).join('\n');
        
        return {
          success: true,
          action: 'navigate',
          path: stop.path,
          message: `📍 **${stop.title}**\n\n${stop.description}\n\n**Key Features:**\n${highlightsList}\n\nWhat would you like to explore here?`
        };
      }
      
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
        // Get tenant from user profile
        const { data: userProfile } = await supabaseClient
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        const tenantId = userProfile?.tenant_id || userId;
        
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'write_memory',
            entry: {
              tenant_id: tenantId,
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

      case 'generate_invite_link': {
        // Generate referral code from user ID
        const referralCode = userId.slice(0, 8).toUpperCase();
        
        // Create invite link with referral tracking
        const inviteLink = `${Deno.env.get('VITE_SUPABASE_URL')?.replace('//', '//app.')}/signup?ref=${referralCode}`;
        
        const inviteeName = args.invitee_name || 'them';
        const relationship = args.relationship || 'person';
        
        // Create pre-filled message
        const shareMessage = `Hey! I'm using y'all's and thought you might like it too. Join with my link and we can connect: ${inviteLink}`;
        
        // Create sharing URLs
        const smsLink = `sms:?&body=${encodeURIComponent(shareMessage)}`;
        const emailLink = `mailto:?subject=${encodeURIComponent("Join me on y'all's!")}&body=${encodeURIComponent(shareMessage)}`;
        
        return {
          success: true,
          invite_link: inviteLink,
          referral_code: referralCode,
          sms_link: smsLink,
          email_link: emailLink,
          message: `Here's your personalized invite link for ${inviteeName}:\n\n${inviteLink}\n\nWhen ${inviteeName} signs up with this link:\n✓ You'll get credit as their referrer\n✓ You can connect and share memories together\n✓ They'll benefit from your family network\n\nReady to share? I can open:\n📱 [Text message](${smsLink})\n📧 [Email](${emailLink})\n\nOr just copy the link and share it however you'd like!`
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

      case 'create_or_find_profile': {
        const slug = args.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 50);

        // Search for existing profile
        const { data: existingProfiles } = await supabaseClient
          .from('entity_profiles')
          .select('*')
          .eq('entity_type', args.entity_type)
          .ilike('name', `%${args.name}%`)
          .limit(5);

        // If exact match found, return it
        const exactMatch = existingProfiles?.find(
          (p: any) => p.name.toLowerCase() === args.name.toLowerCase()
        );

        if (exactMatch) {
          // Store relationship in memory if provided
          if (args.relationship) {
            // Get tenant from user profile
            const { data: userProfile } = await supabaseClient
              .from('profiles')
              .select('tenant_id')
              .eq('user_id', userId)
              .maybeSingle();
            
            const tenantId = userProfile?.tenant_id || userId;
            
            await supabaseClient.functions.invoke('rocker-memory', {
              body: {
                action: 'write_memory',
                entry: {
                  tenant_id: tenantId,
                  user_id: userId,
                  key: `relationship.${args.entity_type}.${slug}`,
                  value: {
                    name: args.name,
                    relationship: args.relationship,
                    profile_id: exactMatch.id
                  },
                  type: 'fact',
                  tags: ['relationship', args.entity_type]
                }
              }
            });
          }

          return {
            success: true,
            found: true,
            profile: exactMatch,
            message: `Found existing profile for ${args.name}${exactMatch.is_claimed ? ' (claimed)' : ' (unclaimed)'}`,
            action: exactMatch.is_claimed ? 'connect' : 'invite'
          };
        }

        // Create unclaimed profile
        const newProfile = {
          entity_type: args.entity_type,
          name: args.name,
          slug,
          is_claimed: false,
          owner_id: null,
          created_by: userId,
          description: `Profile for ${args.name}`,
          custom_fields: {
            contact_info: args.contact_info || {},
            created_via: 'rocker_mention',
            mentioned_by: userId
          }
        };

        const { data: profile, error: createError } = await supabaseClient
          .from('entity_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;

        // Store relationship in memory
        if (args.relationship) {
          // Get tenant from user profile
          const { data: userProfile } = await supabaseClient
            .from('profiles')
            .select('tenant_id')
            .eq('user_id', userId)
            .maybeSingle();
          
          const tenantId = userProfile?.tenant_id || userId;
          
          await supabaseClient.functions.invoke('rocker-memory', {
            body: {
              action: 'write_memory',
              entry: {
                tenant_id: tenantId,
                user_id: userId,
                key: `relationship.${args.entity_type}.${slug}`,
                value: {
                  name: args.name,
                  relationship: args.relationship,
                  profile_id: profile.id
                },
                type: 'fact',
                tags: ['relationship', args.entity_type]
              }
            }
          });
        }

        return {
          success: true,
          created: true,
          profile,
          message: `Created unclaimed profile for ${args.name}`,
          suggestions: [
            `I can help ${args.name} create an account and claim this profile`,
            `Would you like to send them an invitation?`,
            args.contact_info?.email ? `I have their email: ${args.contact_info.email}` : 'If you share their contact info, I can send an invite'
          ]
        };
      }

      case 'create_memory_share_request': {
        // First check if users are mutually connected (implement mutual follow check)
        // For now, allow sharing between any users

        const { data: shareRequest, error: shareError } = await supabaseClient
          .from('memory_share_requests')
          .insert({
            memory_id: args.memory_id,
            from_profile_id: userId,
            to_profile_id: args.to_profile_id,
          })
          .select(`
            *,
            from_profile:profiles!memory_share_requests_from_profile_id_fkey(display_name),
            to_profile:profiles!memory_share_requests_to_profile_id_fkey(display_name)
          `)
          .single();

        if (shareError) throw shareError;

        // Update memory with moderation data if provided
        if (args.moderation_result) {
          await supabaseClient
            .from('ai_user_memory')
            .update({
              toxicity: args.moderation_result.toxicity_score,
              safety_category: args.moderation_result.safety_category,
              tone: args.moderation_result.decision === 'ok' ? 'positive' : 'negative'
            })
            .eq('id', args.memory_id);
        }

        return {
          success: true,
          request_id: shareRequest.id,
          message: `Share request sent to ${shareRequest.to_profile?.display_name || 'user'}. They'll be notified.`
        };
      }

      case 'respond_to_share_request': {
        const { data: request, error: fetchError } = await supabaseClient
          .from('memory_share_requests')
          .select('*, memory:ai_user_memory(*)')
          .eq('id', args.request_id)
          .eq('to_profile_id', userId)
          .single();

        if (fetchError) throw fetchError;

        if (args.action === 'accept') {
          // Create memory link
          const { error: linkError } = await supabaseClient
            .from('memory_links')
            .insert({
              source_memory_id: request.memory_id,
              visible_to_profile_id: userId,
              can_edit: false
            });

          if (linkError && linkError.code !== '23505') throw linkError; // Ignore duplicate

          // Update request status
          await supabaseClient
            .from('memory_share_requests')
            .update({ 
              status: 'accepted', 
              decided_at: new Date().toISOString() 
            })
            .eq('id', args.request_id);

          // Update memory shared_with array
          const { data: memory } = await supabaseClient
            .from('ai_user_memory')
            .select('shared_with')
            .eq('id', request.memory_id)
            .single();

          const sharedWith = memory?.shared_with || [];
          if (!sharedWith.includes(userId)) {
            await supabaseClient
              .from('ai_user_memory')
              .update({
                shared_with: [...sharedWith, userId],
                visibility: 'linked'
              })
              .eq('id', request.memory_id);
          }

          return {
            success: true,
            message: 'Memory accepted and saved to your Shared Memories! ✅'
          };
        } else {
          // Decline
          await supabaseClient
            .from('memory_share_requests')
            .update({ 
              status: 'declined', 
              decided_at: new Date().toISOString() 
            })
            .eq('id', args.request_id);

          return {
            success: true,
            message: 'Share request declined. The sender will be notified.'
          };
        }
      }

      case 'get_pending_share_requests': {
        let query = supabaseClient
          .from('memory_share_requests')
          .select(`
            *,
            memory:ai_user_memory(key, value, type),
            from_profile:profiles!memory_share_requests_from_profile_id_fkey(display_name, avatar_url),
            to_profile:profiles!memory_share_requests_to_profile_id_fkey(display_name, avatar_url)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (args.direction === 'received') {
          query = query.eq('to_profile_id', userId);
        } else if (args.direction === 'sent') {
          query = query.eq('from_profile_id', userId);
        } else {
          query = query.or(`from_profile_id.eq.${userId},to_profile_id.eq.${userId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
          success: true,
          requests: data || [],
          count: data?.length || 0
        };
      }

      case 'revoke_memory_share': {
        // Delete memory link
        const { error: linkError } = await supabaseClient
          .from('memory_links')
          .delete()
          .eq('source_memory_id', args.memory_id)
          .eq('visible_to_profile_id', args.revoke_from_profile_id);

        if (linkError) throw linkError;

        // Update memory shared_with array
        const { data: memory } = await supabaseClient
          .from('ai_user_memory')
          .select('shared_with')
          .eq('id', args.memory_id)
          .single();

        if (memory?.shared_with) {
          const updatedSharedWith = memory.shared_with.filter(
            (id: string) => id !== args.revoke_from_profile_id
          );

          await supabaseClient
            .from('ai_user_memory')
            .update({
              shared_with: updatedSharedWith,
              visibility: updatedSharedWith.length > 0 ? 'linked' : 'private'
            })
            .eq('id', args.memory_id);
        }

        return {
          success: true,
          message: 'Memory share revoked. User will no longer have access.'
        };
      }

      // ========== DOM AGENT TOOLS ==========
      case 'click_element': {
        return {
          success: true,
          action: 'dom_click',
          element_name: args.element_name,
          message: `Clicking "${args.element_name}"...`
        };
      }

      case 'fill_field': {
        return {
          success: true,
          action: 'dom_fill',
          field_name: args.field_name,
          value: args.value,
          message: `Filling "${args.field_name}" with "${args.value}"...`
        };
      }

      case 'create_post': {
        // Use DOM agent to fill and click
        return {
          success: true,
          action: 'dom_create_post',
          content: args.content,
          message: `Creating post: "${args.content.substring(0, 50)}${args.content.length > 50 ? '...' : ''}"`
        };
      }

      case 'get_page_info': {
        return {
          success: true,
          action: 'dom_get_page_info',
          message: 'Reading page content...'
        };
      }

      case 'scroll_page': {
        return {
          success: true,
          action: 'dom_scroll',
          direction: args.direction,
          amount: args.amount || 'screen',
          message: `Scrolling ${args.direction}...`
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
