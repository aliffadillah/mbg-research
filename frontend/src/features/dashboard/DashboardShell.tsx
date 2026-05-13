import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { removeToken } from '../../shared/lib/apiClient';

const NAV_SECTIONS = [
  {
    title: 'Menu',
    links: [
      {
        href: '/dashboard', label: 'Home',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      },
      {
        href: '/dashboard/detection', label: 'Deteksi',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
    ],
  },
  {
    title: 'Data',
    links: [
      {
        href: '/dashboard/nutrition', label: 'Nutrisi',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 5h16" /></svg>,
      },
      {
        href: '/dashboard/history', label: 'Riwayat',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      },
    ],
  },
];

interface Props { activeRoute: string; children: ReactNode; }

export default function DashboardShell({ activeRoute, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { removeToken(); window.location.href = '/login'; };

  const currentLabel = NAV_SECTIONS.flatMap(s => s.links).find(l => l.href === activeRoute)?.label || 'Home';

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />
        )}
      </AnimatePresence>

      {/* Sidebar — dark like Ultralytics */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-56 bg-[#1a1a2e] z-50 transform transition-transform duration-300 lg:transform-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#4361ee] flex items-center justify-center text-white font-bold text-[10px]">NS</div>
          <span className="text-white font-semibold text-sm">NutriSight</span>
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 text-white/30 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search...
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-2 mb-1.5">{section.title}</div>
              {section.links.map((link) => {
                const isActive = activeRoute === link.href;
                return (
                  <a key={link.href} href={link.href}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                    }`}>
                    {link.icon}
                    {link.label}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-0.5">
          <a href="/" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-white/50 hover:bg-white/5 hover:text-red-400 transition-colors w-full text-left">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar
          </button>

          {/* User */}
          <div className="flex items-center gap-2 px-2 py-2 mt-2 border-t border-white/5 pt-3">
            <div className="w-7 h-7 rounded-full bg-[#4361ee] flex items-center justify-center text-white text-[10px] font-bold">U</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 font-medium truncate">User</div>
              <div className="text-[10px] text-white/30 truncate">NutriSight</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-gray-800 font-medium">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
