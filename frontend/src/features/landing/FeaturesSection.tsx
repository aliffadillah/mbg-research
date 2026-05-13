import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FEATURES } from '../../shared/utils/constants';

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-32 overflow-hidden bg-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-100/30 blur-[150px] pointer-events-none" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-center mb-20">
          <span className="text-primary-600 text-sm font-semibold tracking-wider uppercase">Fitur Unggulan</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-5 tracking-tight">Semua yang Anda butuhkan</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Dari deteksi makanan hingga analisis nutrisi mendalam, semuanya dalam satu platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent hover:from-primary-300 hover:to-accent-100 transition-all duration-500">
              <div className="relative bg-white rounded-2xl p-8 h-full transition-all duration-500 group-hover:bg-primary-50/30">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
