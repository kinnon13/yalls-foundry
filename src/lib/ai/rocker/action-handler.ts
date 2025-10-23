/**
 * Frontend Action Handler for Rocker Tool Results
 * Executes UI actions returned by backend tools
 */

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface ToolAction {
  success: boolean;
  action?: string;
  path?: string;
  element?: string;
  field?: string;
  value?: string;
  data?: any;
  message?: string;
  error?: string;
}

export class RockerActionHandler {
  private navigate: (path: string) => void;

  constructor(navigate: (path: string) => void) {
    this.navigate = navigate;
  }

  /**
   * Handle tool action returned from backend
   */
  async handleAction(action: ToolAction): Promise<void> {
    if (!action.success) {
      toast.error(action.error || 'Action failed');
      return;
    }

    // Show success message if provided
    if (action.message) {
      toast.success(action.message);
    }

    // Execute action based on type
    switch (action.action) {
      case 'navigate':
        if (action.path) {
          this.navigate(action.path);
          toast.info(`Navigating to ${action.path}`);
        }
        break;

      case 'click':
        if (action.element) {
          this.clickElement(action.element);
        }
        break;

      case 'type':
        if (action.field && action.value) {
          this.fillField(action.field, action.value);
        }
        break;

      case 'scroll':
        this.scrollPage(action.data?.direction, action.data?.amount);
        break;

      case 'get_elements':
        // Return element info to AI for next step
        return;

      case 'get_page_info':
        // Return page info to AI
        return;

      case 'create_post':
        this.navigate('/create-post');
        if (action.data?.content) {
          this.prefillForm('post-content', action.data.content);
        }
        break;

      case 'create_listing':
        this.navigate('/listings/create');
        break;

      case 'create_event':
        this.navigate('/events/create');
        break;

      case 'add_to_cart':
        toast.success('Added to cart');
        break;

      case 'checkout':
        this.navigate('/checkout');
        break;

      case 'register_event':
        if (action.data?.event_id) {
          this.navigate(`/events/${action.data.event_id}/register`);
        }
        break;

      case 'upload_results':
        this.navigate('/events/upload-results');
        break;

      case 'manage_entries':
        this.navigate('/events/manage-entries');
        break;

      case 'start_timer':
        toast.info('Timer started');
        break;

      case 'send_message':
        if (action.data?.recipient_id) {
          this.navigate(`/messages/${action.data.recipient_id}`);
        }
        break;

      case 'reshare_post':
        if (action.data?.post_id) {
          this.navigate(`/post/${action.data.post_id}/reshare`);
        }
        break;

      case 'follow':
        toast.success(`Following user`);
        break;

      case 'unfollow':
        toast.success(`Unfollowed user`);
        break;

      case 'create_pos_order':
        this.navigate('/pos/create-order');
        break;

      case 'manage_inventory':
        this.navigate('/business/inventory');
        break;

      case 'create_shift':
        this.navigate('/business/shifts/create');
        break;

      case 'manage_team':
        this.navigate('/business/team');
        break;

      case 'export_data':
        toast.info(`Exporting ${action.data?.data_type} data...`);
        break;

      case 'bulk_upload':
        this.navigate('/admin/bulk-upload');
        break;

      case 'upload_media':
        this.openFileUpload();
        break;

      case 'upload_file':
        this.openFileUpload();
        break;

      case 'fetch_url':
        toast.info('Fetching URL content...');
        break;

      case 'google_drive_auth':
        window.open('/integrations/google-drive', '_blank');
        break;

      case 'analyze_media':
        toast.info('Analyzing media...');
        break;

      case 'claim_entity':
        if (action.data?.entity_id) {
          this.navigate(`/entities/${action.data.entity_id}/claim`);
        }
        break;

      case 'create_automation':
        this.navigate('/admin/automations/create');
        break;

      case 'start_tour':
        // Trigger product tour
        toast.info('Starting guided tour...');
        break;

      default:
        // Generic success for backend-only tools
        if (action.message) {
          toast.success(action.message);
        }
    }
  }

  /**
   * Click an element by data-rocker-id or aria-label
   */
  private clickElement(elementName: string): void {
    const el = document.querySelector(`[data-rocker-id="${elementName}"]`) ||
               document.querySelector(`[aria-label="${elementName}"]`);
    if (el instanceof HTMLElement) {
      el.click();
      toast.info(`Clicked ${elementName}`);
    } else {
      toast.error(`Element not found: ${elementName}`);
    }
  }

  /**
   * Fill a form field
   */
  private fillField(fieldName: string, value: string): void {
    const el = document.querySelector(`[name="${fieldName}"]`) ||
               document.querySelector(`[data-rocker-field="${fieldName}"]`);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      toast.info(`Filled ${fieldName}`);
    } else {
      toast.error(`Field not found: ${fieldName}`);
    }
  }

  /**
   * Scroll the page
   */
  private scrollPage(direction?: string, amount?: number): void {
    const scrollAmount = amount || 500;
    if (direction === 'down') {
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    } else if (direction === 'up') {
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }
  }

  /**
   * Prefill a form with data
   */
  private prefillForm(fieldName: string, value: string): void {
    setTimeout(() => {
      this.fillField(fieldName, value);
    }, 500);
  }

  /**
   * Open file upload dialog
   */
  private openFileUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => toast.success('File selected');
    input.click();
  }
}

/**
 * React hook for handling Rocker actions
 */
export function useRockerActionHandler() {
  const navigate = useNavigate();
  const handler = new RockerActionHandler(navigate);

  return {
    handleAction: (action: ToolAction) => handler.handleAction(action),
  };
}
