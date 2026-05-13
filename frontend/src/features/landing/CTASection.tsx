import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="cta" className="relative py-32 overflow-hidden bg-white">
      <div ref={ref} className="relative max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl p-[1px] bg-gradient-to-br from-primary-400 via-accent-400 to-primary-500">
          <div className="relative bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-200/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-200/20 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-primary-200 mb-6">
                <span className="text-primary-700 text-sm font-medium">🚀 Siap untuk memulai?</span>
              </motion.div>

              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
                Mulai Pantau Nutrisimu
                <br /><span className="gradient-text">Hari Ini</span>
              </motion.h2>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }}
                className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
                Daftar gratis dan mulai deteksi makanan, analisis nutrisi, dan pantau pola makan Anda secara real-time.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/register" className="btn-primary px-10 py-4 text-base rounded-2xl group">
                  Daftar Gratis Sekarang
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="/login" className="btn-secondary px-10 py-4 text-base rounded-2xl">Sudah Punya Akun</a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
