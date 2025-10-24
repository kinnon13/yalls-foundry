#!/usr/bin/env python3
"""
Daily Revenue Aggregation Script
Batch process revenue by cohort, update business_metrics table
Run via cron: 0 2 * * * /path/to/daily-aggregate.py
"""

import os
import sys
from datetime import datetime, timedelta
from supabase import create_client, Client

# Stub: Load Supabase credentials from env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def aggregate_revenue():
    """Aggregate revenue for yesterday"""
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"[daily-aggregate] Processing revenue for {yesterday}")

    # Stub: Query invoices paid yesterday
    response = supabase.table("invoices") \
        .select("business_id, amount") \
        .eq("status", "paid") \
        .gte("updated_at", f"{yesterday}T00:00:00") \
        .lt("updated_at", f"{yesterday}T23:59:59") \
        .execute()

    if not response.data:
        print("[daily-aggregate] No invoices found for yesterday")
        return

    # Aggregate by business
    aggregates = {}
    for inv in response.data:
        bid = inv["business_id"]
        aggregates[bid] = aggregates.get(bid, 0) + inv["amount"]

    # Upsert to business_metrics
    for bid, total in aggregates.items():
        supabase.table("business_metrics").upsert({
            "business_id": bid,
            "date": yesterday,
            "revenue": total,
        }).execute()
        print(f"[daily-aggregate] Business {bid}: ${total:.2f}")

    print(f"[daily-aggregate] Processed {len(aggregates)} businesses")

if __name__ == "__main__":
    aggregate_revenue()
