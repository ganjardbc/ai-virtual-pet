# Prototype 0.1 Playtest Guide

## 1. Purpose

Dokumen ini adalah facilitator kit untuk playtest **Prototype 0.1**.

Playtest ini menjawab satu pertanyaan utama (scope §3):

> **Does the pet feel alive?**

Bukan menguji AI, memory, growth, atau Search.

Metodologi umum ada di `docs/09-playtesting.md`. Dokumen ini adalah versi operasional yang siap dipakai per sesi.

---

# 2. Build Configuration Untuk Playtest Ini

Catat konfigurasi ini di setiap session record.

```text
Build            Prototype 0.1 (catat git commit hash saat sesi)
Player copy      Bahasa Indonesia (Debug tetap English)
Balance          Default GameRules (packages/domain/src/config.ts)
```

Keputusan pre-playtest (project owner, 2026-09-25):

| Keputusan | Nilai | Alasan |
| --- | --- | --- |
| Initial Baby Hunger | 70 (sebelumnya 100) | Feed pertama berhasil ("Nyam!") alih-alih ditolak "kenyang". |
| Pet tidur saat player kembali | Tetap sesuai desain (tidak ada Wake untuk player) | Diamati sebagai watch item, bukan diubah dulu. |
| Bahasa player-facing | Bahasa Indonesia | Sesuai bahasa tester ("Dia lapar."). |

Nilai balancing utama:

```text
Hunger   -2/jam bangun, -1/jam tidur
Energy   -1.5/jam bangun, +12/jam tidur
Auto wake  Energy ≥ 95 (min 30 menit) atau maksimal 8 jam
Tidur sendiri  saat Energy ≤ 10
Play ditolak   saat Energy ≤ 15
Feed ditolak   saat Hunger ≥ 90 (efek berkurang mulai 75)
Happiness      turun hanya saat need sangat rendah, maks -12/hari, tidak di bawah 30
Bond           tidak pernah turun karena waktu
```

---

# 3. Format Sesi

## A. Moderated session (utama)

```text
Durasi     25–35 menit
Lokasi     laptop facilitator
Tester     1 orang per sesi
Absence    disimulasikan facilitator dengan playtest:advance
```

## B. Real-time follow-up (opsional)

Tester menggunakan build yang sama selama 1–3 hari nyata (docs/09 §10).

Hanya jika tester dapat mengakses mesin yang menjalankan build. Hosting/deployment di luar scope Prototype 0.1.

---

# 4. Setup Sebelum Setiap Sesi

```bash
# Terminal 1 (biarkan berjalan)
pnpm dev                      # API :3000 + web :5173

# Terminal 2
pnpm playtest:reset           # hapus pet sebelumnya → mulai dari Egg
```

Checklist:

* [ ] PostgreSQL lokal berjalan (`pg_isready`).
* [ ] `.env` memiliki `ENABLE_DEBUG_API=true` (dibutuhkan `playtest:advance`).
* [ ] `pnpm playtest:reset` → "Reset through the running API (pet, history, and debug time)." (sekaligus mengembalikan debug time ke waktu nyata).
* [ ] Browser dibuka di `http://localhost:5173` dan di-reload, halaman menampilkan Egg.
* [ ] Debug panel **tertutup**. Tester tidak melihat terminal.
* [ ] Ukuran window sesuai tester (desktop atau window sempit seukuran ponsel).
* [ ] Izin mencatat/merekam layar sudah diminta.
* [ ] Lembar observasi (§7) dan session record (`PT-template.md`) siap.

---

# 5. Aturan Facilitator

* Jangan menjelaskan mekanik sebelum tester menemukannya sendiri.
* Jangan menyebut "stat", "Hunger 70", "Energy", "Bond", "AI", atau "simulasi".
* Jangan menyebut tombol mana yang harus ditekan.
* Jika tester bertanya "ini maksudnya apa?", jawab: **"Menurut kamu gimana?"**
* Intervensi hanya jika tester benar-benar macet > 60 detik atau terjadi technical failure.
* Catat perilaku dulu, opini belakangan (docs/09 §57).
* Jangan memperbaiki atau menjelaskan bug di tengah sesi (docs/09 §86). Catat saja.
* Think-aloud boleh diminta di awal, tetapi jangan terus-menerus diingatkan.

---

# 6. Alur Sesi

## 6.1 Pembukaan (≈2 menit)

Bacakan, jangan diimprovisasi:

> "Ini prototype game kecil. Nggak ada jawaban benar atau salah, dan yang diuji itu game-nya, bukan kamu. Silakan coba sesuai keinginanmu. Kalau bisa, sambil cerita apa yang kamu pikirkan. Aku mungkin nggak akan banyak menjelaskan, itu disengaja."

## 6.2 First contact: Egg → Hatch → Name (≈3 menit)

Tidak ada instruksi. Amati saja.

## 6.3 Perawatan bebas (≈6–8 menit)

Biarkan tester berinteraksi sesuai keinginannya.

Jika tester diam lama tanpa aksi, boleh berkata:

> "Silakan lakukan apa pun yang menurutmu perlu."

Jangan memancing Play ditolak. Jika tidak terjadi alami, catat "tidak terjadi".

## 6.4 Waktu berlalu: kembali besok (≈5 menit)

Facilitator berkata:

> "Anggap kamu menutup aplikasinya sekarang, lalu membukanya lagi besok pagi."

Minta tester berpaling sebentar. Di terminal facilitator:

```bash
pnpm playtest:advance 16h
```

Lalu minta tester membuka tab game lagi (atau reload).

Amati reaksi pertama tester terhadap kondisi pet, greeting, dan recap "Selama kamu pergi".

Jika pet sedang tidur saat tester kembali, **jangan dibangunkan**. Amati apa yang tester lakukan (watch item W3).

## 6.5 Long absence (≈4 menit)

> "Sekarang anggap kamu lupa membuka aplikasinya selama seminggu."

```bash
pnpm playtest:advance 7d
```

Amati apakah tester merasa dihukum, dan apakah mereka tahu cara memulihkan pet.

## 6.6 Wawancara (≈8–10 menit)

Lihat §8. Lakukan setelah bermain, bukan di tengah permainan.

---

# 7. Lembar Observasi

Catat timestamp kasar dan kutipan tester apa adanya.

| # | Yang diamati | Catatan |
| --- | --- | --- |
| O1 | Apa yang pertama kali dilihat/ditunjuk tester di Pet Home? (pet vs status vs tombol) | |
| O2 | Apakah tester memahami kondisi pet dari tampilannya? Kutipan: "dia lapar", "capek"… | |
| O3 | Apakah tester tahu aksi apa yang tersedia tanpa bertanya? | |
| O4 | Jika Play ditolak: apakah tester paham alasannya? Apakah terlihat seperti error? | |
| O5 | Apakah tester menyadari waktu telah berlalu? Apa yang pertama mereka komentari? | |
| O6 | Apakah tester peduli/penasaran dengan apa yang pet lakukan saat ditinggal (recap)? | |
| O7 | Apakah tester membicarakan pet sebagai karakter ("dia") atau sebagai sistem ("bar", "angka")? | |
| O8 | Titik ragu/bingung (di mana, berapa lama) | |
| O9 | Technical issue (catat persis, jangan diperbaiki saat sesi) | |

Sinyal sukses (scope §82): "Dia lapar.", "Kayaknya dia capek.", "Dia lagi tidur.", "Tadi dia ngapain pas aku tinggal?", "Kasih makan dulu."

Sinyal gagal (scope §83): "Aku cuma naikin bar.", "Ini dashboard.", "Pet-nya cuma gambar.", "Aku nggak ngerti dia butuh apa.", "Nggak ada bedanya kalau waktu maju.", "Kenapa aku perlu peduli sama pet-nya?"

---

# 8. Pertanyaan Setelah Bermain

Tanyakan pertanyaan utama pertama, dengan kalimat netral. Jangan menyarankan jawaban (docs/09 §56).

**Utama**

1. "Menurutmu, pet-nya terasa hidup atau tidak? Kenapa?"

**Pendukung**

2. "Gimana caramu tahu apa yang dia butuhkan?"
3. "Ada momen yang terasa seperti kamu cuma mengurus angka atau bar?"
4. "Menurutmu, apa yang terjadi selama kamu pergi?"
5. "Ada yang membingungkan?"
6. "Waktu kembali setelah lama pergi, gimana perasaanmu?" (amati apakah ada rasa dihukum atau bersalah)
7. "Kalau kamu lanjut main, apa yang ingin kamu lakukan dengan pet ini selanjutnya?"

Catat jawaban apa adanya. Jangan menjelaskan desain setelah tester menjawab.

---

# 9. Watch List Balancing

Hipotesis yang secara khusus diamati di playtest ini:

| ID | Hipotesis/risiko | Sumber |
| --- | --- | --- |
| W1 | Initial Hunger 70 membuat Feed pertama terasa natural, dan status "Lapar" muncul dalam rentang wajar (±10 jam bangun). | Task 10 |
| W2 | Player bisa membedakan Lapar vs Mengantuk dari wajah, posisi daun, dan kalimat pet. | scope §85 |
| W3 | Pet tidur saat player kembali (Beri makan/Main dinonaktifkan hingga 8 jam) terasa natural ("Dia lagi tidur."), bukan menghalangi. | Task 03 |
| W4 | Happiness cepat mencapai maksimum pada pemain aktif, sehingga Play terasa kurang bermakna. | Task 03 |
| W5 | Recap "Selama kamu pergi" terasa relevan dan tidak seperti event log. | wireframe §52 |
| W6 | Nada copy Bahasa Indonesia (pet: "aku", santai; sistem: netral) terasa sesuai. | Task 10 |
| W7 | Long absence 7 hari tidak terasa menghukum dan jelas cara memulihkannya. | scope §38 |

---

# 10. Setelah Sesi

1. Isi session record dari `docs/playtests/PT-template.md` → simpan sebagai `docs/playtests/PT-001.md`, `PT-002.md`, dst.
2. Klasifikasikan setiap temuan S0–S3 (docs/09 §79–83).
3. Jangan mengubah balancing di antara sesi dalam satu batch, kecuali ada S0/S1 yang memblokir sesi berikutnya.
4. Jalankan `pnpm playtest:reset` sebelum tester berikutnya.

Setelah semua sesi dalam batch selesai:

* Buat `docs/19-prototype-01-findings.md` (implementation plan §128).
* Pisahkan **Observation → Interpretation → Decision**.
* Cari pola berulang. Jangan overfit satu tester (docs/09 §90).
* Saran tester bukan otomatis requirement.

---

# 11. Troubleshooting Cepat

| Gejala | Tindakan |
| --- | --- |
| Layar "Tidak bisa terhubung ke server game." | Pastikan `pnpm dev` berjalan dan PostgreSQL aktif, lalu klik "Coba lagi". |
| `playtest:advance` gagal "PET_NOT_FOUND" | Tester belum menetaskan telur. |
| `playtest:advance` gagal "Could not reach the API" | `pnpm dev` tidak berjalan atau `ENABLE_DEBUG_API` tidak aktif. |
| Pet tidak berubah setelah advance | Minta tester reload halaman. |
| Perlu mulai ulang di tengah sesi | `pnpm playtest:reset`, lalu reload browser. |
