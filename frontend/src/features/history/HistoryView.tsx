import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { historyApi } from '../../shared/lib/apiClient';

export default function HistoryView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    const res = await historyApi.getAll(p, 10);
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setData(items);
      if (res.data.totalPages) setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id: string) => {
    const res = await historyApi.delete(id);
    if (!res.error) setData((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
    } catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 text-center py-12 px-6">
        <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-sm text-gray-600 font-medium mb-1">Belum Ada Riwayat</p>
        <p className="text-xs text-gray-400 mb-4">Scan makanan untuk memulai</p>
        <a href="/dashboard/detection" className="inline-block py-1.5 px-4 bg-[#4361ee] text-white rounded-md text-xs font-medium hover:bg-[#3a56d4] transition-colors">
          New Scan
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Semua Riwayat</span>
        <span className="text-xs text-gray-400">{data.length} items</span>
      </div>
      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-100 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
        <div className="col-span-5">Makanan</div>
        <div className="col-span-3">Waktu</div>
        <div className="col-span-2 text-right">Kalori</div>
        <div className="col-span-2 text-right">Aksi</div>
      </div>
      {data.map((item: any, i: number) => {
        const foods = item.detectedFoods ?? item.nutritionResult?.foods ?? item.foods ?? [];
        const foodNames = Array.isArray(foods)
          ? foods.map((f: any) => f.label || f.food || f.name || f).join(', ')
          : 'Deteksi';
        const nutrition = item.nutritionResult ?? item.nutrition ?? {};
        const totalCalRaw = nutrition?.total_nutrition?.calories
          ?? nutrition?.totalCalories
          ?? nutrition?.total_calories
          ?? nutrition?.calories
          ?? 0;
        const totalCal = Number.isFinite(Number(totalCalRaw)) ? Number(totalCalRaw) : 0;

        return (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-[13px]">
            <div className="col-span-5 text-gray-900 truncate font-medium">{foodNames}</div>
            <div className="col-span-3 text-gray-400 text-xs">{formatDate(item.createdAt)}</div>
            <div className="col-span-2 text-right text-gray-700 font-medium">{totalCal > 0 ? `${totalCal} kkal` : '—'}</div>
            <div className="col-span-2 text-right">
              <button onClick={() => handleDelete(item.id)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </motion.div>
        );
      })}

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-7 h-7 rounded text-xs transition-colors ${page === p ? 'bg-[#4361ee] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
