# 🏗️ SaaS Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LENZRO SAAS PLATFORM                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Android App │  │   iOS App    │              │
│  │  (React +    │  │  (Capacitor) │  │  (Capacitor) │              │
│  │   Vite)      │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Load Balancer  │
                    └────────┬─────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                  APPLICATION LAYER                                    │
├────────────────────────────┼──────────────────────────────────────────┤
│                             │                                          │
│  ┌─────────────────────────▼──────────────────────────┐              │
│  │           React Application (SPA)                   │              │
│  ├──────────────────────────────────────────────────────┤             │
│  │                                                      │              │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │              │
│  │  │ AuthContext  │  │ SaaSContext  │  │CartContext│ │              │
│  │  │ (User Auth)  │  │(Subscription)│  │  (Store)  │ │              │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │              │
│  │                                                      │              │
│  │  ┌──────────────────────────────────────────────┐  │              │
│  │  │           Component Layer                     │  │              │
│  │  ├──────────────────────────────────────────────┤  │              │
│  │  │ • OnboardingFlow                             │  │              │
│  │  │ • SubscriptionManagement                     │  │              │
│  │  │ • OrganizationSettings                       │  │              │
│  │  │ • Dashboard, Inventory, Sales, etc.          │  │              │
│  │  └──────────────────────────────────────────────┘  │              │
│  │                                                      │              │
│  └──────────────────────────────────────────────────────┘             │
│                             │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   API Gateway    │
                    └────────┬─────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                      BACKEND LAYER                                    │
├────────────────────────────┼──────────────────────────────────────────┤
│                             │                                          │
│  ┌─────────────────────────▼──────────────────────────┐              │
│  │              SUPABASE PLATFORM                      │              │
│  ├──────────────────────────────────────────────────────┤             │
│  │                                                      │              │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │              │
│  │  │Supabase Auth │  │  Supabase DB │  │Supabase  │ │              │
│  │  │   (JWT)      │  │ (PostgreSQL) │  │ Storage  │ │              │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │              │
│  │                                                      │              │
│  │  ┌──────────────────────────────────────────────┐  │              │
│  │  │           Edge Functions                      │  │              │
│  │  ├──────────────────────────────────────────────┤  │              │
│  │  │ • Stripe Webhook Handler                     │  │              │
│  │  │ • Google Play Verification                   │  │              │
│  │  │ • Apple IAP Verification                     │  │              │
│  │  │ • Send Notifications                         │  │              │
│  │  └──────────────────────────────────────────────┘  │              │
│  │                                                      │              │
│  └──────────────────────────────────────────────────────┘             │
│                             │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                       DATABASE LAYER                                  │
├────────────────────────────┼──────────────────────────────────────────┤
│                             │                                          │
│  ┌─────────────────────────▼──────────────────────────┐              │
│  │         PostgreSQL Database (Multi-Tenant)         │              │
│  ├──────────────────────────────────────────────────────┤             │
│  │                                                      │              │
│  │  ┌─────────────────────────────────────────────┐   │              │
│  │  │         TENANT ISOLATION (RLS)              │   │              │
│  │  ├─────────────────────────────────────────────┤   │              │
│  │  │                                             │   │              │
│  │  │  ┌────────────────┐  ┌─────────────────┐  │   │              │
│  │  │  │  Organization  │  │ Organization    │  │   │              │
│  │  │  │     Table      │  │   Members       │  │   │              │
│  │  │  └────────────────┘  └─────────────────┘  │   │              │
│  │  │                                             │   │              │
│  │  │  ┌────────────────┐  ┌─────────────────┐  │   │              │
│  │  │  │ Subscriptions  │  │  Subscription   │  │   │              │
│  │  │  │     Table      │  │     Plans       │  │   │              │
│  │  │  └────────────────┘  └─────────────────┘  │   │              │
│  │  │                                             │   │              │
│  │  │  ┌────────────────┐  ┌─────────────────┐  │   │              │
│  │  │  │    Payment     │  │  Usage          │  │   │              │
│  │  │  │  Transactions  │  │  Tracking       │  │   │              │
│  │  │  └────────────────┘  └─────────────────┘  │   │              │
│  │  │                                             │   │              │
│  │  └─────────────────────────────────────────────┘   │              │
│  │                                                      │              │
│  │  ┌─────────────────────────────────────────────┐   │              │
│  │  │         BUSINESS DATA (Multi-Tenant)        │   │              │
│  │  ├─────────────────────────────────────────────┤   │              │
│  │  │                                             │   │              │
│  │  │  • products (+ organization_id)             │   │              │
│  │  │  • sales (+ organization_id)                │   │              │
│  │  │  • orders (+ organization_id)               │   │              │
│  │  │  • returns (+ organization_id)              │   │              │
│  │  │  • expenses (+ organization_id)             │   │              │
│  │  │  • customer_credits (+ organization_id)     │   │              │
│  │  │                                             │   │              │
│  │  └─────────────────────────────────────────────┘   │              │
│  │                                                      │              │
│  └──────────────────────────────────────────────────────┘             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   Stripe   │  │  Firebase  │  │Google Play │  │  Apple IAP │   │
│  │  (Web Pay) │  │   (FCM)    │  │  Billing   │  │            │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  SendGrid  │  │   Sentry   │  │   Google   │  │  PostHog   │   │
│  │  (Email)   │  │  (Errors)  │  │ Analytics  │  │ (Product)  │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                         DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════

1. USER SIGNUP & ONBOARDING
───────────────────────────────
   User → Web/Mobile App → Supabase Auth
                         ↓
                  Create User Profile
                         ↓
              Show OnboardingFlow Component
                         ↓
          Create Organization (RPC Function)
                         ↓
              Add as Organization Member
                         ↓
           Set Current Organization in Profile
                         ↓
                 Show Dashboard


2. CREATING A SALE (Multi-Tenant)
──────────────────────────────────
   User → Sale Form → SaaSContext (get current org)
                         ↓
          Sales Table Insert (+ organization_id)
                         ↓
            RLS Policy Check (user in org?)
                         ↓
                 If YES: Insert
                 If NO: Reject
                         ↓
                Update Inventory
                         ↓
              Update Usage Tracking


3. SUBSCRIPTION UPGRADE
───────────────────────────
   User → Choose Plan → SubscriptionManagement
                         ↓
            Redirect to Stripe Checkout
                         ↓
                Payment Processed
                         ↓
           Webhook → Supabase Function
                         ↓
        Update Subscription Table
                         ↓
     Update Organization Limits
                         ↓
          Send Confirmation Email


4. TEAM MEMBER INVITATION
─────────────────────────────
   Admin → Invite Form → InviteMember Function
                         ↓
           Create Invitation Record
                         ↓
          Generate Unique Token
                         ↓
         Send Email (SendGrid)
                         ↓
      User Clicks Link → Accept Invitation
                         ↓
        Add to Organization Members
                         ↓
           User Can Access Org Data


═══════════════════════════════════════════════════════════════════════
                        SECURITY BOUNDARIES
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                    Row Level Security (RLS)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Every query automatically filtered by:                              │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  WHERE organization_id IN (                                   │  │
│  │    SELECT organization_id                                     │  │
│  │    FROM organization_members                                  │  │
│  │    WHERE user_id = auth.uid()                                 │  │
│  │  )                                                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Result: Users can ONLY access their organization's data            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                      SUBSCRIPTION FLOW
═══════════════════════════════════════════════════════════════════════

┌──────────────┐
│ Free Trial   │  14 days
│ (Default)    │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
  ┌────▼─────┐      ┌────▼────┐
  │  Upgrade │      │ Expire  │
  │  (Paid)  │      │ (Free)  │
  └────┬─────┘      └────┬────┘
       │                 │
  ┌────▼─────┐           │
  │  Active  ◄───────────┘
  │  Paying  │
  └────┬─────┘
       │
       ├──────────────────┬─────────────────┐
       │                  │                 │
  ┌────▼─────┐      ┌─────▼────┐    ┌─────▼────┐
  │ Upgrade  │      │ Downgrade│    │  Cancel  │
  │ (Higher) │      │ (Lower)  │    │(End Sub) │
  └──────────┘      └──────────┘    └──────────┘


═══════════════════════════════════════════════════════════════════════
                        ROLE HIERARCHY
═══════════════════════════════════════════════════════════════════════

Owner (Highest)
  ├─ Create/Delete Organization
  ├─ Manage Subscription
  ├─ Manage All Members
  └─ All Permissions

Admin
  ├─ Manage Members
  ├─ Manage Settings
  └─ All Data Access

Manager
  ├─ Manage Products
  ├─ Process Sales
  └─ View Reports

Staff
  ├─ Process Sales
  ├─ Update Inventory
  └─ Basic Operations

Viewer (Lowest)
  └─ Read-Only Access


═══════════════════════════════════════════════════════════════════════

This architecture provides:
✅ Complete tenant isolation
✅ Scalable to millions of users
✅ Secure by default (RLS)
✅ Easy to maintain
✅ Cost-effective
✅ Mobile-ready
✅ Payment-ready (Phase 3)

```
