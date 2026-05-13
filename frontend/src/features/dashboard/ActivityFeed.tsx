import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { historyApi } from '../../shared/lib/apiClient';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await historyApi.getAll(1, 5);
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setActivities(items);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
    } catch { return d; }
  };

  if (loading) {
    return (
      <div className="py-6 text-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-1">Belum ada aktivitas</p>
        <p className="text-[10px] text-gray-400">Scan makanan untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity: any, index: number) => {
        const foods = activity.detectedFoods ?? activity.nutritionResult?.foods ?? activity.foods ?? [];
        const foodNames = Array.isArray(foods)
          ? foods.map((f: any) => f.label || f.food || f.name || f).join(', ')
          : 'Deteksi makanan';
        return (
          <motion.a key={activity.id} href="/dashboard/history"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors group">
            <div className="w-6 h-6 rounded bg-gray-100 text-gray-400 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-800 truncate">{foodNames}</div>
              <div className="text-[10px] text-gray-400">{formatDate(activity.createdAt)}</div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
