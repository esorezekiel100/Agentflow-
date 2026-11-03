import { Bell, BriefcaseBusiness, Menu, Search, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/opportunities', label: 'Browse' },
  { to: '/profile', label: 'Profile' },
  { to: '/tracker', label: 'Tracker' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/agent', label: 'Agent' },
  { to: '/admin', label: 'Admin' },
]

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <defs>
        <linearGradient id="brandBg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="brandStroke" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#brandBg)" />
      <path d="M18 46L31 17L44 46" fill="none" stroke="url(#brandStroke)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22.5 32H39.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M38 18C46 19 51.5 24 53.5 31.5C55.5 38.5 52.5 45 45 47" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M45 18L53.5 18L51.5 26" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#182334]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7e2] bg-[#fbfaf7]/95 shadow-[0_6px_20px_-18px_rgba(27,42,58,0.3)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-[#182334]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
              <BrandMark />
            </span>
            <span className="bg-gradient-to-r from-[#172234] via-[#274b3e] to-[#398767] bg-clip-text text-lg font-black tracking-[0.18em] text-transparent">AGENTFLOW</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-[#e6e8e3] bg-white/80 p-1.5 shadow-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#eaf1eb] text-[#244b39] shadow-sm'
                      : 'text-[#647080] hover:bg-[#f1f4f0] hover:text-[#1d2c37]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden rounded-full border border-[#e1e5e0] bg-white p-2.5 text-[#526172] transition hover:bg-[#f2f5f1] sm:inline-flex" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <Link to="/auth" className="hidden items-center gap-2 rounded-full border border-[#d6e2d9] bg-white px-4 py-2 text-sm font-semibold text-[#315e4b] transition hover:border-[#9bb7a7] hover:bg-[#f3f7f3] sm:inline-flex">
              Sign in
            </Link>
            <Link to="/opportunities" className="hidden items-center gap-2 rounded-full bg-[#1f493b] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1f493b]/15 transition hover:bg-[#173c30] sm:inline-flex">
              <Search className="h-4 w-4" />
              Search
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex rounded-full border border-[#e1e5e0] bg-white p-2.5 text-[#526172] transition hover:bg-[#f2f5f1] md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav id="mobile-navigation" className="border-t border-[#e5e7e2] bg-[#fbfaf7] px-4 py-4 shadow-xl shadow-black/10 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#eaf1eb] text-[#244b39] ring-1 ring-[#c6d9ca]'
                        : 'text-[#647080] hover:bg-[#f1f4f0] hover:text-[#1d2c37]',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#e5e7e2] pt-3">
                <Link to="/auth" className="rounded-xl border border-[#d6e2d9] bg-white px-4 py-3 text-center text-sm font-semibold text-[#315e4b] transition hover:bg-[#f3f7f3]">
                  Sign in
                </Link>
                <Link to="/opportunities" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f493b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173c30]">
                  <Search className="h-4 w-4" />
                  Search
                </Link>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#e5e7e2] bg-[#f0f1ec]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#647080] sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3 text-[#1d2c37]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <span className="font-black tracking-[0.18em]">AGENTFLOW</span>
            </div>
            <p className="max-w-xs text-[#74808b]">Find it. Verify it. Apply to it.</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#1d2c37]">Explore</h3>
            <ul className="space-y-2">
              <li><Link to="/opportunities" className="hover:text-[#315e4b]">Browse opportunities</Link></li>
              <li><Link to="/category/jobs" className="hover:text-[#315e4b]">Jobs</Link></li>
              <li><Link to="/category/scholarships" className="hover:text-[#315e4b]">Scholarships</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#1d2c37]">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/agent" className="hover:text-[#315e4b]">AI assistant</Link></li>
              <li><Link to="/tracker" className="hover:text-[#315e4b]">Application tracker</Link></li>
              <li><Link to="/dashboard" className="hover:text-[#315e4b]">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#1d2c37]">Community</h3>
            <ul className="space-y-2">
              <li><Link to="/submit-opportunity" className="hover:text-[#315e4b]">Submit opportunity</Link></li>
              <li><Link to="/admin" className="hover:text-[#315e4b]">Moderation desk</Link></li>
              <li><Link to="/agent" className="hover:text-[#315e4b]">Get weekly digest</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { Layout }
