# 🔧 Vercel Environment Variables Setup

**IMPORTANT**: Add these environment variables in your Vercel Dashboard

## Required Environment Variables

```bash
# Your domain
NEXT_PUBLIC_APP_URL=https://www.onda.click
NEXT_PUBLIC_BASE_URL=https://www.onda.click

# Clerk Auth (you already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[your-key]
CLERK_SECRET_KEY=sk_live_[your-secret]

# Clerk Redirect URLs (add these in Clerk Dashboard)
# - Allowed redirect URLs: https://www.onda.click/*
# - Sign in URL: https://www.onda.click/sign-in
# - Sign up URL: https://www.onda.click/onboarding
# - After sign in URL: https://www.onda.click/onboarding/setup
# - After sign up URL: https://www.onda.click/onboarding/setup
```

## In Clerk Dashboard

1. Go to your Clerk Dashboard
2. Navigate to **Paths** in the left sidebar
3. Update these URLs:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/onboarding`
   - **After sign-in URL**: `/onboarding/setup`
   - **After sign-up URL**: `/onboarding/setup`

4. Navigate to **Redirects** 
5. Add to allowed redirect URLs:
   - `https://www.onda.click/*`
   - `https://www.onda.click/onboarding/setup`
   - `https://www.onda.click/parent`
   - `https://www.onda.click/chat`

## Test the Flow

After updating:

1. Visit `https://www.onda.click/sign-in`
2. Sign in with your account
3. You should be redirected to `/onboarding/setup`
4. Select "I'm a Parent" or "I'm a Kid"
5. You'll be redirected to the appropriate dashboard

## Debug URLs

- `https://www.onda.click/debug-deploy` - Check environment status
- `https://www.onda.click/simple-landing` - Simple landing page
- `https://www.onda.click/onboarding/setup` - User type selection