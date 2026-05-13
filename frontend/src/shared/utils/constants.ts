export const APP_NAME = 'NutriSight';
export const APP_DESCRIPTION = 'Platform monitoring nutrisi makanan berbasis AI untuk hidup lebih sehat';
export const APP_TAGLINE = 'Kenali Nutrisi, Hidup Lebih Sehat';

export const NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '#features', label: 'Fitur' },
  { href: '#stats', label: 'Statistik' },
  { href: '#cta', label: 'Mulai' },
] as const;

export const DASHBOARD_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard/detection', label: 'Deteksi', icon: 'scan' },
  { href: '/dashboard/nutrition', label: 'Nutrisi', icon: 'apple' },
  { href: '/dashboard/history', label: 'Riwayat', icon: 'clock' },
] as const;

export const FEATURES = [
  {
    title: 'Deteksi Makanan',
    description: 'Identifikasi makanan secara otomatis menggunakan teknologi computer vision RT-DETR',
    icon: '🔍',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Analisis Nutrisi',
    description: 'Dapatkan informasi kalori, protein, lemak, dan karbohidrat secara detail',
    icon: '📊',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Riwayat & Tracking',
    description: 'Pantau pola makan harian dan lihat tren nutrisi dari waktu ke waktu',
    icon: '📈',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Prediksi LSTM',
    description: 'Prediksi kebutuhan nutrisi masa depan menggunakan model deep learning',
    icon: '🧠',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Database Makanan',
    description: '1000+ data makanan Indonesia lengkap dengan informasi nutrisi terperinci',
    icon: '🗄️',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    title: 'Laporan Personal',
    description: 'Dapatkan insight personal tentang pola makan dan rekomendasi nutrisi',
    icon: '📋',
    gradient: 'from-rose-500 to-amber-500',
  },
] as const;
