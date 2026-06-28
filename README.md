# CY App Hub

একটি প্রিমিয়াম অ্যাপ ডিসকভারি ও ডাউনলোড প্ল্যাটফর্ম।

## আর্কিটেকচার

```
GitHub Pages
    │
    ▼
CY App Hub Website (HTML/CSS/JS)
    │
    ▼
apps.json (GitHub Repository)
    ▲
    │
Admin Panel
    │
    ▼
GitHub REST API (Personal Access Token)
    │
    ▼
GitHub Repository Update

Image Upload → Cloudinary → Image URL → apps.json
```

## ফিচার

- ✅ GitHub Pages 100% Free
- ✅ Firebase লাগে না
- ✅ Cloudinary (ইমেজ অপ্টিমাইজ)
- ✅ Admin Panel (GitHub Token Login)
- ✅ App Add / Edit / Delete
- ✅ Featured Toggle
- ✅ Multi-Store Links
- ✅ Dark/Light Mode
- ✅ PWA (Installable)
- ✅ SEO (OG Tags, Sitemap)
- ✅ Responsive Design

## সেটআপ

### ১. GitHub রিপোজিটরি

1. GitHub-এ `cy-app-hub` রিপো তৈরি করুন
2. `apps.json` এবং `settings.json` রিপো-তে পুশ করুন

### ২. GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens
2. **Tokens (classic)** → **Generate new token**
3. নাম দিন (যেমন: `cy-app-hub-admin`)
4. Permission: **Contents** → **Read and write** ✅
5. Generate → টোকেন কপি করুন

### ৩. js/main.js ও js/admin.js

`YOUR_GITHUB_USERNAME` কে আপনার GitHub username দিয়ে রিপ্লেস করুন:

```js
initGitHub('YOUR_GITHUB_USERNAME', 'cy-app-hub');
```

### ৪. Cloudinary

1. [cloudinary.com](https://cloudinary.com) → Register
2. Settings → Upload → Upload Presets → **New Preset** → **Unsigned**
3. `js/github-api.js`-এ `uploadPreset` আপডেট করুন

### ৫. GitHub Pages Deploy

1. Repo → Settings → Pages
2. Branch: `main`, Folder: `/ (root)`
3. Save

## ফোল্ডার স্ট্রাকচার

```
cy-app-hub/
├── index.html              # হোম পেজ
├── app-details.html        # অ্যাপ ডিটেলস
├── apps.json               # অ্যাপ ডাটা
├── settings.json           # সাইট কনফিগ
├── admin/index.html        # অ্যাডমিন ড্যাশবোর্ড
├── css/
│   ├── style.css           # প্রধান স্টাইল
│   ├── admin.css           # অ্যাডমিন স্টাইল
│   └── app-details.css     # ডিটেলস স্টাইল
├── js/
│   ├── github-api.js       # GitHub API + Cloudinary
│   ├── main.js             # হোম পেজ লজিক
│   ├── admin.js            # অ্যাডমিন লজিক
│   └── app-details.js      # ডিটেলস লজিক
├── manifest.json           # PWA
├── sw.js                   # Service Worker
└── robots.txt              # SEO
```

## অ্যাডমিন ব্যবহার

1. `/admin/` এ যান
2. GitHub Token দিন
3. Apps যোগ/এডিট/ডিলিট করুন
4. Settings (Hero, Theme, Stores, SEO) পরিবর্তন করুন

## License

MIT
