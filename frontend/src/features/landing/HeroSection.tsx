import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y1 = useSpring(useTransform(scrollYProgress, [0, 1], [0, -150]), { stiffness: 100, damping: 30 });
  const y2 = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), { stiffness: 100, damping: 30 });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Light gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <motion.div style={{ y: y1 }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-200/40 blur-[120px] animate-pulse-slow" />
        <motion.div style={{ y: y2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-200/30 blur-[100px] animate-pulse-slow" />
        <motion.div style={{ y: y1 }}
          className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-warm-400/10 blur-[80px] animate-float" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(22,163,74,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,0.2) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Content */}
      <motion.div style={{ opacity, scale }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs font-medium text-primary-700">Platform Monitoring Nutrisi v1.0</span>
        </motion.div>

        {/* Heading */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
          Kenali Nutrisi
          <br />
          <span className="gradient-text">Makananmu</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Platform monitoring nutrisi berbasis AI yang membantu Anda memahami
          kandungan makanan secara <span className="text-gray-800 font-medium">real-time</span> dan
          menjalani hidup yang lebih sehat.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/register" className="btn-primary px-8 py-3.5 text-base rounded-2xl group">
            Mulai Gratis
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a href="#features" className="btn-secondary px-8 py-3.5 text-base rounded-2xl">
            Pelajari Lebih Lanjut
          </a>
        </motion.div>

        {/* Stats preview */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '25+', label: 'Data Makanan' },
            { value: 'Real-time', label: 'Deteksi' },
            { value: '100%', label: 'Gratis' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-primary-300 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
