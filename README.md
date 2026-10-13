# XTREN CMS · Dynamic Landing Pages, Adsterra Monetization & Social Broadcast Engine

A full-stack, production-ready CMS built with **Next.js (App Router)**, **Tailwind CSS**, and **Firebase Cloud Firestore**, designed to publish high-converting landing pages for Adsterra monetization and broadcast them automatically to **Telegram Channels** and **X (Twitter)** with rich Open Graph link previews.

---

## 🚀 Key Features

1. **Centralized Admin Dashboard (`/admin`)**:
   - **X (Twitter) OAuth Login**: Direct account authentication for posting tweets.
   - **Telegram Channel Broadcasting**: 1-click broadcast of media + custom captions + inline button linking directly to `/p/[slug]`.
   - **Landing Page Management**:
     - Custom URL Slug (`/p/slug`)
     - Model/Page Title & Description
     - Media URL with direct preview (Images or MP4 Videos)
     - Media Type Selector (`image` / `video`)
     - Adsterra Ad Code/Script snippet container with presets (Social Bar, 300x250 Native Banner, Popunder)
     - Action Buttons: *Publish to Firestore*, *Post to X*, *Post to Telegram*, *Copy Link*, *Live Preview*
   - **Configuration Panel**: In-app input for Telegram Bot Token, Telegram Channel ID, Twitter API credentials, and Base URL.

2. **Dynamic Public Landing Page (`/p/[slug]`)**:
   - Server-side dynamic Open Graph (OG) & Twitter Card tags (`og:title`, `og:image`, `og:video`, `twitter:card`, `twitter:player`) for attractive social cards on X and Telegram.
   - Mobile-first, responsive media container (high-res image viewer or custom video player).
   - Safe injection and execution of Adsterra ad scripts without breaking hydration.
   - High-CTR CTA conversion buttons.

3. **Database Schema (Firestore `pages` collection)**:
   - `slug`: String (Document ID)
   - `title`: String
   - `mediaUrl`: String
   - `mediaType`: String (`image` | `video`)
   - `adCode`: String
   - `ctaText`: String
   - `ctaLink`: String
   - `views`: Number
   - `createdAt`: Timestamp

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the homepage, or [http://localhost:3000/admin](http://localhost:3000/admin) for the Admin Dashboard.

---

## 📲 Telegram Channel Integration Setup
1. Open [@BotFather](https://t.me/BotFather) on Telegram and create a new bot using `/newbot`.
2. Copy your **HTTP API Token** (e.g., `123456789:ABCdefGhIJKlmNoPQRstuVWXyz`).
3. Add your Bot as an **Administrator** to your Telegram Channel with permission to *Post Messages*.
4. In the **Admin Dashboard Settings** (`/admin`), paste your **Bot Token** and **Channel Username** (e.g. `@my_channel_username`).

---

## 🐦 Twitter / X Integration Setup
70: 1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).
71: 2. Create a project and an App.
72: 3. In **User authentication settings**, enable **OAuth 2.0**:
73:    - Type of App: **Web App**
74:    - Callback URL: `https://xtren-hub-2026.web.app/api/x/callback` (or `http://localhost:3000/api/x/callback` for localhost)
75:    - Permissions: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
76: 4. Copy the **Client ID** and **Client Secret** into your `.env.local` or enter your API keys directly in the Admin Dashboard Settings.
77: 
78: ---
79: 
80: ## ☁️ Deployment to Firebase
81: 1. Make sure Firebase CLI is logged in:
82:    ```bash
83:    firebase login
84:    ```
85: 2. Enable webframeworks experiment:
86:    ```bash
87:    firebase experiments:enable webframeworks
88:    ```
89: 3. Deploy to Firebase:
90:    ```bash
91:    firebase deploy --only hosting,firestore
92:    ```
93: 4. Your site will be live at:
94:    `https://xtren-hub-2026.web.app`
