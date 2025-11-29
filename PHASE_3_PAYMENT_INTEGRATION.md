# 💳 Phase 3: Payment Integration Guide

## Overview

This phase implements payment processing for web (Stripe) and mobile (Google Play Billing + Apple In-App Purchases).

---

## Part 1: Stripe Integration (Web Payments)

### 1.1 Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

### 1.2 Create Stripe Products and Prices

1. Go to https://dashboard.stripe.com
2. Create Products:
   - **Basic Plan** ($29/month, $290/year)
   - **Premium Plan** ($99/month, $990/year)
3. Copy the Price IDs and add to `.env`

### 1.3 Backend: Stripe Webhook Handler

Create `api/stripe-webhook.ts`:

```typescript
import Stripe from "stripe";
import { supabase } from "../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export default async function handler(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { customer, status, current_period_end, metadata } = subscription;

  // Update organization subscription
  await supabase.from("subscriptions").upsert({
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer as string,
    organization_id: metadata.organization_id,
    status: status as any,
    current_period_end: new Date(current_period_end * 1000).toISOString(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  await supabase.from("payment_transactions").insert({
    organization_id: invoice.metadata.organization_id,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "succeeded",
    payment_method: "stripe",
    stripe_payment_intent_id: invoice.payment_intent as string,
    invoice_url: invoice.hosted_invoice_url,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  await supabase.from("payment_transactions").insert({
    organization_id: invoice.metadata.organization_id,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: "failed",
    payment_method: "stripe",
  });
}
```

### 1.4 Frontend: Stripe Checkout

Update `src/contexts/SaaSContext.tsx`:

```typescript
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const createSubscription = async (data: CreateSubscriptionRequest) => {
  if (!currentOrganization) throw new Error("No organization");

  try {
    // Call your backend to create Stripe Checkout Session
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: currentOrganization.id,
        plan_id: data.plan_id,
        billing_cycle: data.billing_cycle,
      }),
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    const { error } = await stripe!.redirectToCheckout({ sessionId });

    if (error) throw error;
  } catch (err) {
    console.error("Subscription creation error:", err);
    throw err;
  }
};
```

### 1.5 Deploy Webhook Endpoint

Add to `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/stripe-webhook",
      "destination": "/api/stripe-webhook.ts"
    }
  ]
}
```

Configure webhook in Stripe Dashboard:

- URL: `https://your-domain.com/api/stripe-webhook`
- Events: `customer.subscription.*`, `invoice.*`

---

## Part 2: Google Play Billing (Android)

### 2.1 Install Dependencies

```bash
npm install react-native-iap
npx cap sync android
```

### 2.2 Configure Android

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.1.0'
}
```

### 2.3 Create Products in Google Play Console

1. Go to Google Play Console > Your App > Monetization > Products
2. Create Subscription Products:
   - `basic_monthly` ($29/month)
   - `basic_yearly` ($290/year)
   - `premium_monthly` ($99/month)
   - `premium_yearly` ($990/year)

### 2.4 Implement IAP in React

Create `src/utils/iap.ts`:

```typescript
import RNIap, {
  Product,
  Purchase,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
} from "react-native-iap";
import { Platform } from "react-native";

const productIds = Platform.select({
  android: [
    "basic_monthly",
    "basic_yearly",
    "premium_monthly",
    "premium_yearly",
  ],
  ios: [
    "com.alkalam.basic.monthly",
    "com.alkalam.basic.yearly",
    "com.alkalam.premium.monthly",
    "com.alkalam.premium.yearly",
  ],
});

export const initIAP = async () => {
  try {
    await RNIap.initConnection();
    console.log("IAP connection initialized");
  } catch (err) {
    console.error("IAP init error:", err);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await RNIap.getSubscriptions({ skus: productIds! });
    return products;
  } catch (err) {
    console.error("Get products error:", err);
    return [];
  }
};

export const purchaseProduct = async (productId: string) => {
  try {
    await requestPurchase({ sku: productId });
  } catch (err) {
    console.error("Purchase error:", err);
    throw err;
  }
};

export const restorePurchases = async () => {
  try {
    const purchases = await getAvailablePurchases();
    return purchases;
  } catch (err) {
    console.error("Restore purchases error:", err);
    return [];
  }
};

// Listen for purchase updates
export const purchaseUpdateSubscription = (
  callback: (purchase: Purchase) => void
) => {
  return RNIap.purchaseUpdatedListener(callback);
};

export const purchaseErrorSubscription = (callback: (error: any) => void) => {
  return RNIap.purchaseErrorListener(callback);
};
```

### 2.5 Server-Side Receipt Verification

Create `api/verify-android-purchase.ts`:

```typescript
import { google } from "googleapis";

const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.JWT(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
    undefined,
    process.env.GOOGLE_PLAY_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/androidpublisher"]
  ),
});

export default async function handler(req: Request) {
  const { purchaseToken, productId, packageName } = await req.json();

  try {
    const result = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });

    const { data } = result;

    // Verify purchase is valid
    if (data.paymentState === 1) {
      // Update subscription in database
      // ...

      return new Response(JSON.stringify({ valid: true, data }), {
        status: 200,
      });
    }

    return new Response(JSON.stringify({ valid: false }), { status: 400 });
  } catch (err) {
    console.error("Android verification error:", err);
    return new Response("Verification failed", { status: 500 });
  }
}
```

---

## Part 3: Apple In-App Purchases (iOS)

### 3.1 Configure iOS

Add to `ios/App/App/Info.plist`:

```xml
<key>SKPaymentTransactions</key>
<true/>
```

### 3.2 Create Products in App Store Connect

1. Go to App Store Connect > Your App > Features > In-App Purchases
2. Create Auto-Renewable Subscriptions:
   - `com.alkalam.basic.monthly` ($29/month)
   - `com.alkalam.basic.yearly` ($290/year)
   - `com.alkalam.premium.monthly` ($99/month)
   - `com.alkalam.premium.yearly` ($990/year)

### 3.3 Server-Side Receipt Verification

Create `api/verify-ios-purchase.ts`:

```typescript
import jwt from "jsonwebtoken";

export default async function handler(req: Request) {
  const { receiptData, transactionId } = await req.json();

  try {
    // Verify with Apple's servers
    const appleResponse = await fetch(
      "https://buy.itunes.apple.com/verifyReceipt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "receipt-data": receiptData,
          password: process.env.APPLE_SHARED_SECRET,
        }),
      }
    );

    const data = await appleResponse.json();

    if (data.status === 0) {
      // Valid receipt
      return new Response(JSON.stringify({ valid: true, data }), {
        status: 200,
      });
    }

    return new Response(JSON.stringify({ valid: false }), { status: 400 });
  } catch (err) {
    console.error("iOS verification error:", err);
    return new Response("Verification failed", { status: 500 });
  }
}
```

---

## Testing

### Stripe Testing

1. Use test mode cards: `4242 4242 4242 4242`
2. Test webhook events with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

### Google Play Testing

1. Add test account in Google Play Console
2. Use test cards in sandbox mode

### Apple IAP Testing

1. Create sandbox tester account in App Store Connect
2. Sign out of production Apple ID on device
3. Sign in with sandbox account when prompted

---

## Security Checklist

- [ ] Never expose API keys in frontend code
- [ ] Always verify purchases server-side
- [ ] Implement receipt validation
- [ ] Use HTTPS for all webhook endpoints
- [ ] Validate webhook signatures
- [ ] Store sensitive keys in environment variables
- [ ] Implement rate limiting on payment endpoints
- [ ] Log all payment transactions for audit trail

---

## Next Steps

After completing payment integration:

1. Test all payment flows thoroughly
2. Implement subscription lifecycle (upgrades, downgrades, cancellations)
3. Add payment failure handling
4. Create admin dashboard for revenue tracking
5. Move to Phase 4: Testing & Security Audit
