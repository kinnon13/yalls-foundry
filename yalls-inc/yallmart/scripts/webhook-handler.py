"""
Role: Stripe webhook handler for payment events (success, failed, refund)
Path: yalls-inc/yallmart/scripts/webhook-handler.py
Usage: python yalls-inc/yallmart/scripts/webhook-handler.py
"""

import os
import stripe
from http.server import BaseHTTPRequestHandler, HTTPServer

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            return

        payload = self.rfile.read(int(self.headers['Content-Length']))
        sig_header = self.headers.get('Stripe-Signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            print(f"Invalid payload: {e}")
            self.send_response(400)
            self.end_headers()
            return
        except stripe.error.SignatureVerificationError as e:
            print(f"Invalid signature: {e}")
            self.send_response(400)
            self.end_headers()
            return

        # Handle events
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            print(f"✅ Payment successful: {session['id']}")
            # TODO: Update order status, clear cart, send confirmation
            
        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            print(f"❌ Payment failed: {intent['id']}")
            # TODO: Notify user, retry logic
            
        elif event['type'] == 'charge.refunded':
            charge = event['data']['object']
            print(f"💰 Refund processed: {charge['id']}")
            # TODO: Update order status, restore stock

        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), WebhookHandler)
    print("🎧 Webhook listener started on port 8000")
    server.serve_forever()
