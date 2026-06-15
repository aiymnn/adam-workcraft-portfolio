# TikTok Developer Portal Integration Guide

This guide describes the complete, step-by-step process of configuring a TikTok Developer Application, whitelisting Redirect URIs, obtaining API credentials, and configuring your web application to sync your TikTok profile metrics and video feeds.

---

## Step 1: Create a TikTok Developer Account

1. Go to the [TikTok for Developers Portal](https://developers.tiktok.com/).
2. Log in using your existing TikTok account or create a new developer login.
3. Complete your developer profile profile checks (e.g., verifying your email if prompted).

---

## Step 2: Create a Web Application

1. In the TikTok Developer Console, click on **My Apps** or **Create App**.
2. Choose **Web App / Website** as the platform type.
3. Fill in the app details:
   - **App Name**: e.g., `Adam Workcraft Portfolio`
   - **App Icon**: (Optional) Upload your profile image or logo.
   - **Category**: Portfolio / Creator Tool.
   - **Description**: e.g., `A photography and videography portfolio website showcasing client works, client reviews, and direct social media integrations.`

---

## Step 3: Request API Scopes (Permissions)

To fetch user details and list your videos, you must request specific API scopes in the TikTok developer dashboard:

1. Locate the **Products** or **APIs** section inside your app console.
2. Add and request the following products:
   - **TikTok Login / User Info**: Grants access to basic profile statistics (`user.info.basic`).
   - **Video List / Creator API**: Grants access to retrieve your public videos and statistics (`video.list` / Content API).

> [!NOTE]
> When your app is in **Sandbox / Development** mode, you can immediately test using your own connected developer account. For public users to use the app, TikTok requires an app review, but since this is your personal portfolio site, keeping the app in developer/sandbox mode is sufficient for syncing your own personal account.

---

## Step 4: Configure Redirect URIs (Whitelisting)

TikTok strictly restricts authentication callback redirection. You must add the redirect URLs of your site to the whitelist:

1. Scroll down to the **App Settings** or **OAuth Settings** tab of your app in the TikTok Developer Portal.
2. Find the **Redirect URIs** configuration input.
3. Add the following URLs (add both if you want to test locally and on production):
   - **For Production (VPS):**
     `https://aizzlive.tech/api/admin/social/tiktok/callback`
   - **For Local Development (Localhost):**
     `http://localhost:3000/api/admin/social/tiktok/callback`
4. Click **Save Changes**.

---

## Step 5: Retrieve and Configure App Credentials

1. Go to the credentials area of your TikTok application card.
2. Retrieve the following two values:
   - **Client Key**
   - **Client Secret**

3. Open the `.env` configuration file on your system (locally in your project root, and on the production VPS at `/root/adam-workcraft/.env` or `~/adam-workcraft-portfolio/.env`):
4. Add the keys to the bottom of the `.env` file:

```env
# ==========================================
# TikTok Developer Integration
# ==========================================
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

*(Replace `your_tiktok_client_key` and `your_tiktok_client_secret` with the actual strings from the portal).*

---

## Step 6: Deploy and Apply Changes on VPS

If you are updating your production server, perform these steps to load the new environment variables:

1. SSH into your VPS:
   ```bash
   ssh root@159.89.193.92
   ```
2. Navigate to your project folder:
   ```bash
   cd ~/adam-workcraft-portfolio
   ```
3. Open your env file and add the TikTok credentials:
   ```bash
   nano .env
   ```
4. Save and exit (`Ctrl + X`, then `Y`, then `Enter`).
5. Restart your Docker containers to load the updated `.env` keys:
   ```bash
   sudo docker compose -f docker-compose.production.yml restart
   ```

---

## Step 7: Authorize & Synchronize Your Account

1. Log into your portfolio admin dashboard at `https://aizzlive.tech/admin`.
2. Navigate to **Social Media** -> **TikTok Dashboard** in the sidebar.
3. Click the **Sign In with TikTok** button.
4. You will be redirected to TikTok to sign in and authorize permissions.
5. Once authorized, you will automatically be redirected back to the dashboard showing your real-time follower counts, likes, and custom analytics charts.

---

## Technical Design Details (For Developers)

- **Access Token Auto-Refresh**: TikTok access tokens expire every 24 hours. The application automatically detects expired tokens and uses the stored `refresh_token` to retrieve a new one in the background on API requests.
- **Robust Mock Fallback**: If TikTok Developer credentials are not set, or the API call returns error codes (sandbox restrictions), the dashboard gracefully renders high-fidelity mock charts, ensuring the layout never breaks and is always visually ready.
