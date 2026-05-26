# Supabase Auth Configuration

## Google OAuth Setup

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers**
2. Enable the **Google** provider
3. Set the **Authorized redirect URI** (copy this into Google Cloud Console OAuth app):
   ```
   https://aoymkicpvtnfmbspepqn.supabase.co/auth/v1/callback
   ```
4. Paste your Google **Client ID** and **Client Secret** from Google Cloud Console into the Supabase Google provider settings

## Allowed Redirect URLs

In **Authentication** → **URL Configuration**, add the following to **Redirect URLs**:

```
http://localhost:3000
```

Add your production URL here when deploying (e.g. `https://yourdomain.com`).
