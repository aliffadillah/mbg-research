import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { nutritionApi } from '../../shared/lib/apiClient';

export default function StatsGrid() {
  const [counts, setCounts] = useState({ foods: 0, categories: 0, menus: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [foodsRes, catsRes, menusRes] = await Promise.all([
        nutritionApi.getAll(),
        nutritionApi.getCategories(),
        nutritionApi.getMenus(),
      ]);
      setCounts({
        foods: foodsRes.data?.length || 0,
        categories: catsRes.data?.length || 0,
        menus: menusRes.data?.length || 0,
      });
    };
    fetchStats();
  }, []);

  const stats = [
    {
      label: 'Makanan',
      value: counts.foods,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" /></svg>,
    },
    {
      label: 'Kategori',
      value: counts.categories,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>,
    },
    {
      label: 'Menu Harian',
      value: counts.menus,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
    {
      label: 'Status',
      value: 'Online',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" /></svg>,
      isText: true,
    },
  ];

  return (
    <div className="flex flex-wrap gap-6">
      {stats.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
            {stat.icon}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{String(stat.value)}</div>
            <div className="text-[11px] text-gray-400">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
