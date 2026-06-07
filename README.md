# Qarzlar — Magazin web app

Google Sheet'dagi mijozlar qarzlarini boshqarish uchun web app.
Jadval: **No · Ism · Familiya · Tug‘ilgan yil · Joriy Qarz · Qo'shish · Ayirish**

## Imkoniyatlar
- 🔍 **Qidirish** — ism, familiya, tug‘ilgan yil yoki No bo‘yicha (real vaqtda)
- 📋 **Jadval previev** — barcha mijozlar va joriy qarzi ko‘rinadi
- 🔘 **Filtr tugmalari** — Hammasi · ⚠️ Qarz to‘lamayotganlar · ✅ Qarzi yo‘qlar
- ➕ **Qo'shish** — mijoz qarzini oshirish (yangi xarid)
- ➖ **Ayirish** — qarzni kamaytirish (to‘lov)
- ✏️ **Tahrirlash** — mijozni qidirib, ism/familiya/tug‘ilgan yilini o‘zgartirish
- 👤 **Yangi mijoz** qo‘shish, 🗑 mijozni o‘chirish
- 📊 **Dashboard** — **1 oydan beri qarz to‘lamaganlar** alohida chiroyli kartalarda
  (qancha vaqt to‘lamagani, qarzi va tezkor +/− tugmalari bilan)
- 📱 Telefon va kompyuterga **moslashuvchan (responsive)** dizayn
- 📈 Statistika: mijozlar soni, umumiy qarz, qarzdorlar soni

### "Oxirgi to'lov" sanasi qanday ishlaydi
- Jadvalga **"Oxirgi to‘lov"** ustuni avtomatik qo‘shiladi (qo‘lda qo‘shish shart emas).
- **To‘lov (➖ Ayirish)** qilinganda sana bugungi kunga yangilanadi.
- Yangi qarz qo‘shilganda, agar sana hali bo‘lmasa — boshlanish sanasi yoziladi.
- Dashboard shu sana asosida **30 kundan oshganlar**ni "to‘lamayotganlar" deb ko‘rsatadi.
- Eski mijozlarda sana bo‘lmasa, ular "Sana noma‘lum" sifatida ro‘yxatda chiqadi;
  bir marta to‘lov yoki qo‘shish qilinsa, sana yoziladi.

Barcha o‘zgarishlar to‘g‘ridan-to‘g‘ri Google Sheet'ga yoziladi.

---

## O‘rnatish (5 daqiqa)

### 1. Apps Script loyihasini ochish
1. [Google Sheet](https://docs.google.com/spreadsheets/d/1ThHNVw2ljaogQNCRk5JormjxoJXtiKbT_poVKQEsL_Q/edit) ni oching.
2. Yuqoridan **Kengaytmalar (Extensions) → Apps Script** ni bosing.

### 2. Fayllarni nusxalash
1. `Code.gs` faylidagi barcha kodni Apps Script'dagi **Code.gs** ga joylang.
2. Chap menyudan **+ → HTML** bosib, nomi **`index`** bo‘lgan fayl yarating
   (e'tibor bering: `.html` qo‘shilmaydi, faqat `index`).
3. `index.html` faylidagi barcha kodni shu **index** fayliga joylang.
4. **Saqlash** (💾) bosing.

> Eslatma: `Code.gs` ichida `SHEET_ID` allaqachon sizning jadvalingizga qo‘yilgan.
> Agar skriptni to‘g‘ridan-to‘g‘ri jadval ichidan ochsangiz, `SHEET_ID` ni bo‘sh
> qoldirsangiz ham ishlaydi.

### 3. Web app sifatida joylashtirish (deploy)
1. O‘ng yuqorida **Deploy → New deployment** ni bosing.
2. **⚙️ (Select type) → Web app** ni tanlang.
3. Sozlamalar:
   - **Execute as:** *Me* (siz)
   - **Who has access:** *Anyone* (yoki *Anyone with Google account* — xohishingizga ko‘ra)
4. **Deploy** bosing → Google ruxsat so‘raydi → **Authorize** qiling.
5. Chiqgan **Web app URL** ni nusxalang — bu sizning ilovangiz manzili.

### 4. Ishlatish
- URL'ni telefon yoki kompyuter brauzerida oching.
- Telefonda "Bosh ekranga qo‘shish" qilsangiz, ilova kabi ishlaydi.

---

## Muhim
- Jadvalning **1-qatori sarlavhalar** bo‘lishi kerak (No, Ism, Familiya, ...).
  Kod sarlavha nomlari bo‘yicha ustunlarni avtomatik topadi, shuning uchun
  ustunlar tartibi boshqacha bo‘lsa ham ishlayveradi.
- Kodni o‘zgartirsangiz, qaytadan **Deploy → Manage deployments → Edit → New version**
  qilib yangilang.
