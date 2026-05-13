import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Scatter, Line } from 'react-chartjs-2';
import { nutritionApi } from '../../shared/lib/apiClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

// ─── Color palette ──────────────────────────────────────────────
const COLORS = {
  protein:     { bg: 'rgba(16,185,129,0.75)', border: '#10b981' },
  karbohidrat: { bg: 'rgba(245,158,11,0.75)', border: '#f59e0b' },
  sayuran:     { bg: 'rgba(34,197,94,0.75)',   border: '#22c55e' },
  buah:        { bg: 'rgba(244,63,94,0.75)',   border: '#f43f5e' },
  pelengkap:   { bg: 'rgba(99,102,241,0.75)',  border: '#6366f1' },
};
const CATEGORY_ORDER = ['protein', 'karbohidrat', 'sayuran', 'buah', 'pelengkap'];
const categoryColor = (cat: string) => (COLORS as any)[cat] || { bg: 'rgba(156,163,175,0.75)', border: '#9ca3af' };

// ─── Shared chart options ───────────────────────────────────────
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: '#6b7280' },
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
    },
  },
};

// ─── Types ──────────────────────────────────────────────────────
interface StatsData {
  totalFoods: number;
  totalMenus: number;
  categoryDistribution: { category: string; count: number }[];
  averageNutrients: { category: string; calories: number; protein: number; fat: number; carbs: number; fiber: number }[];
  menuEnergy: { name: string; largeEnergy: number; smallEnergy: number; largeFat: number; smallFat: number; largeProtein: number; smallProtein: number; largeCarbs: number; smallCarbs: number }[];
  scatterData: { name: string; protein: number; carbs: number; fat: number; calories: number; category: string }[];
}

// ═════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════
export default function NutritionCharts() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await nutritionApi.getStats();
      if (res.data) setStats(res.data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-sm text-gray-400">Gagal memuat data statistik</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">Data Visualization</h2>
        <p className="text-xs text-gray-400 mt-0.5">Analisis visual dari database nutrisi makanan.</p>
      </div>

      {/* Row 1: Doughnut + Average Nutrients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Distribusi Kategori" subtitle="Proporsi makanan per kategori" delay={0}>
          <CategoryDoughnut data={stats.categoryDistribution} />
        </ChartCard>
        <ChartCard title="Rata-rata Nutrisi per Kategori" subtitle="Kalori, protein, lemak, karbohidrat" delay={0.05}>
          <AverageNutrientsBar data={stats.averageNutrients} />
        </ChartCard>
      </div>

      {/* Row 2: Menu Energy + Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Perbandingan Energi Menu" subtitle="Porsi besar vs porsi kecil (kkal)" delay={0.1}>
          <MenuEnergyBar data={stats.menuEnergy} />
        </ChartCard>
        <ChartCard title="Distribusi Makronutrien" subtitle="Protein vs Karbohidrat (bubble = kalori)" delay={0.15}>
          <MacroScatter data={stats.scatterData} />
        </ChartCard>
      </div>

      {/* Row 3: LSTM Prediction (full width) */}
      <ChartCard title="LSTM Nutritional Prediction" subtitle="Prediksi kalori harian — data simulasi (placeholder untuk integrasi model)" delay={0.2} badge="LSTM">
        <LSTMPredictionChart />
      </ChartCard>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Shared Card Wrapper
// ═════════════════════════════════════════════════════════════════
function ChartCard({ title, subtitle, children, delay = 0, badge }: {
  title: string; subtitle: string; children: React.ReactNode; delay?: number; badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{title}</span>
            {badge && (
              <span className="text-[9px] font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full tracking-wide">{badge}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">
        <div className="h-[280px]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 1. Category Distribution — Doughnut
// ═════════════════════════════════════════════════════════════════
function CategoryDoughnut({ data }: { data: StatsData['categoryDistribution'] }) {
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [data]);

  const chartData = {
    labels: sorted.map(d => d.category.charAt(0).toUpperCase() + d.category.slice(1)),
    datasets: [{
      data: sorted.map(d => d.count),
      backgroundColor: sorted.map(d => categoryColor(d.category).bg),
      borderColor: sorted.map(d => categoryColor(d.category).border),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  return (
    <Doughnut data={chartData} options={{
      ...baseOptions,
      cutout: '60%',
      plugins: {
        ...baseOptions.plugins,
        legend: { ...baseOptions.plugins.legend, position: 'right' as const },
      },
    }} />
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. Average Nutrients per Category — Bar
// ═════════════════════════════════════════════════════════════════
function AverageNutrientsBar({ data }: { data: StatsData['averageNutrients'] }) {
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [data]);

  const chartData = {
    labels: sorted.map(d => d.category.charAt(0).toUpperCase() + d.category.slice(1)),
    datasets: [
      { label: 'Kalori (kkal)', data: sorted.map(d => d.calories), backgroundColor: 'rgba(67,97,238,0.7)', borderRadius: 4 },
      { label: 'Protein (g)', data: sorted.map(d => d.protein), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
      { label: 'Lemak (g)', data: sorted.map(d => d.fat), backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4 },
      { label: 'Karbs (g)', data: sorted.map(d => d.carbs), backgroundColor: 'rgba(244,63,94,0.7)', borderRadius: 4 },
    ],
  };

  return (
    <Bar data={chartData} options={{
      ...baseOptions,
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
      },
    }} />
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. Menu Energy Comparison — Bar
// ═════════════════════════════════════════════════════════════════
function MenuEnergyBar({ data }: { data: StatsData['menuEnergy'] }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Porsi Besar (kkal)',
        data: data.map(d => d.largeEnergy),
        backgroundColor: 'rgba(67,97,238,0.75)',
        borderRadius: 4,
      },
      {
        label: 'Porsi Kecil (kkal)',
        data: data.map(d => d.smallEnergy),
        backgroundColor: 'rgba(67,97,238,0.3)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <Bar data={chartData} options={{
      ...baseOptions,
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' }, title: { display: true, text: 'Energi (kkal)', font: { size: 10 }, color: '#9ca3af' } },
      },
    }} />
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. Macronutrient Scatter
// ═════════════════════════════════════════════════════════════════
function MacroScatter({ data }: { data: StatsData['scatterData'] }) {
  const grouped = useMemo(() => {
    const map: Record<string, typeof data> = {};
    for (const item of data) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [data]);

  const chartData = {
    datasets: Object.entries(grouped).map(([cat, items]) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      data: items.map(d => ({ x: d.protein, y: d.carbs, r: Math.max(4, d.calories / 30) })),
      backgroundColor: categoryColor(cat).bg,
      borderColor: categoryColor(cat).border,
      borderWidth: 1.5,
      pointRadius: items.map(d => Math.max(4, d.calories / 30)),
      pointHoverRadius: items.map(d => Math.max(6, d.calories / 25)),
    })),
  };

  return (
    <Scatter data={chartData} options={{
      ...baseOptions,
      scales: {
        x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' }, title: { display: true, text: 'Protein (g)', font: { size: 10 }, color: '#9ca3af' } },
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' }, title: { display: true, text: 'Karbohidrat (g)', font: { size: 10 }, color: '#9ca3af' } },
      },
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            label: (ctx: any) => {
              const raw = ctx.raw;
              const item = grouped[Object.keys(grouped)[ctx.datasetIndex]]?.[ctx.dataIndex];
              return item ? `${item.name}: P=${raw.x}g, K=${raw.y}g, Cal=${item.calories}` : '';
            },
          },
        },
      },
    }} />
  );
}

// ═════════════════════════════════════════════════════════════════
// 5. LSTM Prediction Chart — Simulated Data
// ═════════════════════════════════════════════════════════════════
function LSTMPredictionChart() {
  const days = useMemo(() => {
    const labels: string[] = [];
    const actual: number[] = [];
    const predicted: number[] = [];
    const base = 550;

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 29 + i);
      labels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));

      const val = base + Math.sin(i * 0.5) * 80 + (Math.random() - 0.5) * 60;
      actual.push(Math.round(val));

      if (i < 23) {
        predicted.push(Math.round(val + (Math.random() - 0.5) * 30));
      }
    }

    // Future predictions (last 7 days)
    for (let i = 23; i < 30; i++) {
      const trend = base + Math.sin(i * 0.5) * 80;
      predicted.push(Math.round(trend + (Math.random() - 0.3) * 40));
    }

    return { labels, actual, predicted };
  }, []);

  const chartData = {
    labels: days.labels,
    datasets: [
      {
        label: 'Aktual (kkal)',
        data: days.actual,
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67,97,238,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Prediksi LSTM (kkal)',
        data: days.predicted,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ],
  };

  return (
    <Line data={chartData} options={{
      ...baseOptions,
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 45 } },
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, color: '#9ca3af' }, title: { display: true, text: 'Kalori (kkal)', font: { size: 10 }, color: '#9ca3af' } },
      },
      interaction: { mode: 'index' as const, intersect: false },
    }} />
  );
}
