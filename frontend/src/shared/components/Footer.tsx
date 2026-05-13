export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                NS
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Nutri<span className="gradient-text">Sight</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              Platform monitoring nutrisi makanan berbasis AI. Kenali apa yang kamu makan,
              pahami nutrisinya, dan jalani hidup yang lebih sehat.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-3">
              {['Dashboard', 'Deteksi Makanan', 'Database Nutrisi', 'Riwayat'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 text-sm hover:text-primary-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Lainnya</h4>
            <ul className="space-y-3">
              {['Tentang Kami', 'Dokumentasi', 'Kebijakan Privasi', 'Kontak'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 text-sm hover:text-primary-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} NutriSight. Dibuat untuk penelitian.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-xs">Dibuat dengan ❤️ di Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
