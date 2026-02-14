# App Store Connect Submission Checklist – Wordle MM

Use this checklist to resolve all App Store Connect errors. Copy the values below into the corresponding fields.

---

## 1. Choose a Build

- In **App Store Connect** → your app → **Distribution** → **Prepare for Submission**
- Under **Build**, click **"+"** or **Select a build**
- Select the latest build you uploaded via EAS (after upgrading to React Native 0.81.1)
- If no build appears, run `eas build --platform ios --profile production` and wait for it to finish, then `eas submit --platform ios --latest`

---

## 2. App Store Metadata (English U.S.)

Paste these into the **English (U.S.)** section:

### Description (required, max 4,000 characters)

```
Guess the word in 6 tries! Wordle MM brings the classic word puzzle game to your phone.

HOW TO PLAY
• Each guess must be a valid 5-letter word
• Green = correct letter, correct spot
• Yellow = correct letter, wrong spot  
• Gray = letter not in the word

FEATURES
• One puzzle per day
• Track your stats and streak
• Simple, clean design
• Free to play, no ads
• Play offline

Challenge yourself and share your results with friends. Can you guess today's word?
```

### Keywords (required, max 100 characters, comma-separated, no spaces after commas)

```
wordle,word,puzzle,game,daily,guess,letters
```

### Support URL (required)

Use one of these options:

**Option A – GitHub Pages (free)**  
1. Create a repo (e.g. `wordle-mm-pages`)  
2. Enable GitHub Pages in repo settings  
3. Add the files from `public/` (privacy-policy.html, support.html)  
4. Use: `https://YOUR_USERNAME.github.io/wordle-mm-pages/support.html`

**Option B – Temporary placeholder**  
You can use a generic URL like `https://github.com/YOUR_USERNAME` until you host a real support page, then update it.

**Important:** Replace `http://example.com` with a real HTTPS URL. Apple will reject placeholder URLs.

### Marketing URL (optional)

Leave blank or use your website if you have one.

### Copyright (optional but recommended)

```
2026 [Your Name or Company]
```

---

## 3. Contact Information

- Go to **App Information** (or the contact section in your app’s settings)
- Add **Contact Email** (e.g. support@yourdomain.com or your Apple ID email)
- Add **Contact Phone** if required
- Add **Contact Name** (person or company)

---

## 4. App Privacy

- Open **App Privacy** in the left sidebar
- Click **Get Started** or **Edit**
- Answer the data collection questions:
  - If you only use local storage (e.g. AsyncStorage) and no analytics/tracking, choose **“No, we do not collect data from this app”** or **“Data not linked to you”**
- Add **Privacy Policy URL**:
  - Same path as Support URL but `privacy-policy.html` (e.g. `https://YOUR_USERNAME.github.io/wordle-mm-pages/privacy-policy.html`)

---

## 5. Pricing

- Go to **Pricing** (or **App Store pricing and availability**)
- Choose **Free** or your desired price tier
- Set availability (e.g. all countries)

---

## 6. Previews and Screenshots

- **iPhone 6.5" Display** (required): add at least one screenshot (1284 × 2778 px)
- You can use the iOS Simulator or a physical device to capture screenshots
- Add up to 10 screenshots per device size

---

## Quick Reference – URLs to Prepare

| Field           | Example URL                                                  |
|----------------|---------------------------------------------------------------|
| Support URL    | `https://YOUR_USERNAME.github.io/wordle-mm-pages/support.html` |
| Privacy Policy | `https://YOUR_USERNAME.github.io/wordle-mm-pages/privacy-policy.html` |

**Before submitting:** Update the email addresses in `public/privacy-policy.html` and `public/support.html` to your real support email.
