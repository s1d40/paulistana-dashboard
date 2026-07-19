# E-commerce Webhooks & n8n Integration Guide

This document outlines the strategy for connecting our Headless E-commerce (Supabase) to external payment gateways (Stripe, Mercado Pago) via n8n.

## Architecture

We are using a "fat-database / thin-backend" approach for the e-commerce infrastructure:
1. **Frontend (Next.js)** handles UI and direct reads/writes via Supabase REST API (for CRUD operations).
2. **Supabase (PostgreSQL)** acts as the source of truth, managing state and multi-tenancy rules (RLS).
3. **n8n** handles complex orchestrations, external API calls, and webhook listening.

## Handling Payment Webhooks

When a payment is processed in Stripe or Mercado Pago, the gateway will send an HTTP POST request (Webhook) indicating the event (e.g., `payment.created`, `payment.approved`, `payment.failed`).

### 1. n8n Webhook Node
You should create a workflow in n8n starting with a **Webhook Node**.
- Method: POST
- URL: The public webhook URL provided by n8n.
- Point the payment gateway (Stripe/Mercado Pago) to this n8n Webhook URL.

### 2. Processing the Event in n8n
Inside the n8n workflow:
- Extract the `order_id` (usually stored in the payment gateway's metadata when the checkout session is created) and the `status` from the payload.
- Map the gateway's status to our internal statuses: `pending`, `approved`, `rejected`.

### 3. Updating Supabase
Use the **Supabase Node** (or a simple HTTP Request Node calling the Supabase REST API) in n8n to update the `ecommerce_orders` table.

```json
{
  "payment_status": "{{$json.mapped_status}}",
  "status": "{{$json.mapped_status == 'approved' ? 'paid' : 'pending'}}"
}
```

## Internal Triggers (Supabase -> n8n)

Sometimes, when an order is updated in Supabase (e.g., marked as `paid`), we might want to trigger post-purchase actions (sending an email, granting access to a digital product/astrology map).

We can do this using Supabase Database Webhooks.

### SQL Template for Supabase Trigger to n8n

Run this in your Supabase SQL Editor to create a function that calls an n8n webhook whenever an order status changes to `paid`.

```sql
-- 1. Create the function that calls n8n
CREATE OR REPLACE FUNCTION notify_n8n_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the status changed to 'paid'
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN

    -- Using the built-in pg_net extension (ensure it's enabled in Supabase)
    -- select * from pg_extension where extname = 'pg_net';

    PERFORM net.http_post(
      url:='https://YOUR_N8N_INSTANCE_URL/webhook/order-paid',
      body:=json_build_object(
        'order_id', NEW.id,
        'client_id', NEW.client_id,
        'customer_email', NEW.customer_email,
        'total_amount', NEW.total_amount
      )::jsonb,
      headers:='{"Content-Type": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on the orders table
DROP TRIGGER IF EXISTS on_order_paid_trigger ON public.ecommerce_orders;
CREATE TRIGGER on_order_paid_trigger
  AFTER UPDATE ON public.ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION notify_n8n_order_paid();
```
