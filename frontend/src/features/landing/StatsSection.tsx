import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { value: 39, suffix: '', label: 'Data Makanan Indonesia', icon: '🍽️' },
    { value: 10, suffix: '', label: 'Menu Harian', icon: '📋' },
    { value: 6, suffix: '', label: 'Kategori Nutrisi', icon: '⚡' },
    { value: 24, suffix: '/7', label: 'Monitoring', icon: '📊' },
  ];

  return (
    <section id="stats" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/50 to-white" />
      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <span className="text-accent-600 text-sm font-semibold tracking-wider uppercase">Dalam Angka</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 tracking-tight">Platform yang Terus Berkembang</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="rounded-2xl p-8 text-center group bg-white border border-primary-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300">
              <div className="text-3xl mb-4 transition-transform group-hover:scale-125">{stat.icon}</div>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
