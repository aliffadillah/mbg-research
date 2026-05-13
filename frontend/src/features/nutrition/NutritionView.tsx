import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { nutritionApi } from '../../shared/lib/apiClient';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  category: string;
}

export default function NutritionView() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [foodsRes, catsRes] = await Promise.all([
        nutritionApi.getAll(),
        nutritionApi.getCategories(),
      ]);
      if (foodsRes.data) setFoods(foodsRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = foods.filter((item) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) && (category === 'semua' || item.category === category);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari makanan..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#4361ee] focus:ring-1 focus:ring-[#4361ee]/20 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCategory('semua')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${category === 'semua' ? 'bg-[#4361ee] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>Semua</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${category === cat ? 'bg-[#4361ee] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Data Makanan</span>
          <span className="text-xs text-gray-400">{filtered.length} items</span>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-100 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Nama</div>
          <div className="col-span-1 text-right">Kalori</div>
          <div className="col-span-2 text-right">Protein</div>
          <div className="col-span-2 text-right">Lemak</div>
          <div className="col-span-2 text-right">Karbs</div>
          <div className="col-span-2 text-right">Kategori</div>
        </div>
        {/* Table rows */}
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 text-sm hover:bg-gray-50 transition-colors">
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.category === 'protein' ? 'bg-emerald-500' :
                    item.category === 'karbohidrat' ? 'bg-amber-500' :
                      item.category === 'buah' ? 'bg-rose-500' :
                        item.category === 'sayuran' ? 'bg-green-500' :
                          'bg-gray-400'
                  }`} />
                <span className="truncate font-medium text-gray-900 text-[13px]">{item.name}</span>
              </div>
              <div className="col-span-1 text-right text-gray-700 font-semibold text-[13px]">{item.calories}</div>
              <div className="col-span-2 text-right text-gray-500 text-[13px]">{item.protein}g</div>
              <div className="col-span-2 text-right text-gray-500 text-[13px]">{item.fat}g</div>
              <div className="col-span-2 text-right text-gray-500 text-[13px]">{item.carbs}g</div>
              <div className="col-span-2 text-right">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${item.category === 'protein' ? 'bg-emerald-50 text-emerald-600' :
                    item.category === 'karbohidrat' ? 'bg-amber-50 text-amber-600' :
                      item.category === 'buah' ? 'bg-rose-50 text-rose-600' :
                        item.category === 'sayuran' ? 'bg-green-50 text-green-600' :
                          'bg-gray-50 text-gray-500'
                  }`}>{item.category}</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada makanan ditemukan</div>
          )}
        </div>
      </div>
    </div>
  );
}
