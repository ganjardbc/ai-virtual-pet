import type { EnergyLabel, FullnessLabel, Mood, PetActivity } from '@ai-virtual-pet/contracts';

// All player-facing words live here so wording can change without touching logic.
// Playtest language: Indonesian (Task 10). Pet voice: casual, warm "aku"; system voice: neutral.
// Debug UI stays in English as a developer tool.

export const copy = {
  egg: {
    prompt: 'Ada sesuatu yang menunggu…',
    hatch: 'Tetaskan',
    hatching: 'Menetas…',
    idleLabel: 'Telur berbintik',
    hatchingLabel: 'Telurnya sedang menetas',
  },
  naming: {
    ask: 'Kamu mau panggil aku apa?',
    label: 'Nama pet',
    placeholder: 'Contoh: Momo',
    submit: 'Beri nama',
    saving: 'Menyimpan…',
    tooLong: (max: number) => `Nama maksimal ${max} karakter.`,
    celebrate: (name: string) => `${name}? Itu aku!`,
    petLabel: 'Pet yang baru menetas',
  },
  actions: {
    group: 'Perawatan',
    feed: 'Beri makan',
    play: 'Main',
    talk: 'Bicara',
    sleep: 'Tidur',
    sleeping: 'Sedang tidur',
    sleepingHint: (name: string) => `${name} sedang tidur.`,
  },
  status: {
    title: 'Kondisi',
    fullness: 'Perut',
    energy: 'Energi',
    mood: 'Mood',
  },
  recap: {
    title: 'Selama kamu pergi',
    dismiss: 'Tutup',
  },
  chat: {
    back: 'Kembali',
    region: (name: string) => `Percakapan dengan ${name}`,
    inputLabel: (name: string) => `Pesan untuk ${name}`,
    placeholder: 'Tulis sesuatu…',
    send: 'Kirim',
    you: 'Kamu',
    listening: (name: string) => `${name} sedang mendengarkan…`,
    empty: (name: string) => `Sapa ${name}!`,
    sending: 'Mengirim…',
    notSent: 'Belum terkirim',
    unavailable: (name: string) => `${name} belum bisa menjawab sekarang.`,
    inProgress: 'Pesan sebelumnya masih ditunggu. Coba lagi sebentar.',
    historyFailed: 'Percakapan belum bisa dimuat.',
    counter: (length: number, max: number) => `${length}/${max}`,
  },
  system: {
    loading: 'Memuat…',
    connection: 'Tidak bisa terhubung ke server game.',
    retry: 'Coba lagi',
    actionFailed: 'Terjadi kesalahan. Coba lagi.',
    conflict: 'Kondisi pet baru saja berubah. Coba lagi.',
  },
} as const;

export const fullnessText: Record<FullnessLabel, string> = {
  VERY_HUNGRY: 'Lapar sekali',
  HUNGRY: 'Lapar',
  OKAY: 'Cukup',
  FULL: 'Kenyang',
  VERY_FULL: 'Kenyang sekali',
};

export const energyText: Record<EnergyLabel, string> = {
  EXHAUSTED: 'Lelah sekali',
  TIRED: 'Lelah',
  OKAY: 'Cukup',
  ENERGETIC: 'Bersemangat',
};

export const RECOVERING_TEXT = 'Memulihkan diri';

export const moodText: Record<Mood, string> = {
  NEUTRAL: 'Tenang',
  HAPPY: 'Senang',
  HUNGRY: 'Lapar',
  SLEEPY: 'Mengantuk',
  EXCITED: 'Gembira',
  BORED: 'Bosan',
};

/** Narration for what the pet is doing on its own. IDLE has no narration. */
export const activityText: Partial<Record<PetActivity, string>> = {
  SLEEPING: 'Sedang tidur…',
  PLAYING_ALONE: 'Bermain sendiri',
  RESTING: 'Beristirahat',
  LOOKING_AROUND: 'Melihat-lihat',
  WAITING: 'Menunggu dengan tenang',
};
