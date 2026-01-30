# 🚀 Quick Start Instructions

## Cara Menjalankan Aplikasi

### Step 1: Install Dependencies (Hanya sekali)
```bash
npm install
```

### Step 2: Start Server

**Option A: Double-click `start.bat`**  
(Paling mudah untuk Windows)

**Option B: Via terminal**
```bash
npm run dev
```

**Option C: Manual**
```bash
http-server . -p 8080 -c-1 --cors
```

### Step 3: Buka Browser
Aplikasi akan otomatis buka di: **http://localhost:8080/src/index.html**

Jika tidak otomatis, manual buka URL tersebut di Chrome/Edge.

---

## ⚠️ Troubleshooting Cepat

### Ortho tiles tidak muncul?

Check di `src/js/config.js` line ~12:
```javascript
orthophotoTilesUrl: '../data/imagery/{z}/{x}/{reverseY}.png'
```

Jika tiles format berbeda (TMS vs XYZ), ganti:
- **XYZ tiles**: `{reverseY}`
- **TMS tiles**: `{y}`

### Verify tiles location:
```
data/imagery/14/xxx/yyy.png  ← Harus ada
```

---

## 📞 Need Help?

Lihat **README.md** untuk troubleshooting lengkap.

Lihat **PRESENTATION_GUIDE.md** untuk persiapan presentasi besok.

---

**Good luck! 🎉**
