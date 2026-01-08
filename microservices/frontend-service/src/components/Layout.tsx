import { Link, useLocation } from 'react-router-dom'
import { Swords, Users, Package, Home, Search, Menu, X, Book, Target, Zap, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_SETS } from '../lib/graphql'
import ThemeSwitcher from './ThemeSwitcher'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: setsData, loading: setsLoading } = useQuery(GET_SETS, {
    errorPolicy: 'all'
  })

  // Base navigation items
  const baseNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/compositions', label: 'Compositions', icon: Swords },
    { path: '/builder', label: 'Team Builder', icon: Swords },
    { path: '/trait-tracker', label: 'Trait Tracker', icon: Target },
    { path: '/champions', label: 'Champions', icon: Users },
    { path: '/items', label: 'Items', icon: Package },
    { path: '/sets-info', label: 'Sets & Patches', icon: Book },
    { path: '/summoner-search', label: 'Riot Data', icon: Search },
  ]

  // Add sets to navigation if available
  const navItems = [...baseNavItems]

  if (setsData?.sets && setsData.sets.length > 0) {
    // Add sets to navigation - even if there's just one set
    const setNavItems = setsData.sets.map((set: any) => ({
      path: `/sets/${set.setId}`,
      label: set.setName,
      icon: Book
    }))
    navItems.push(...setNavItems)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header - Cimplic-inspired dark mode with backdrop blur */}
      <header className="backdrop-blur-md sticky top-0 z-50" style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--bg-accent)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Swords className="h-8 w-8" style={{ color: 'var(--accent1)' }} />
                <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>TFT Bible v2</span>
              </Link>
            </div>

            {/* Desktop Navigation - Centered with flex-grow */}
            <nav className="hidden md:flex flex-grow justify-center">
              <div className="flex space-x-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative"
                    style={{
                      color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)',
                      backgroundColor: location.pathname === path ? 'var(--bg-accent)' : 'transparent'
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)' }} />
                    <span>{label}</span>
                    {location.pathname === path && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-full" style={{ background: 'var(--accent1)' }}></div>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Search and Theme Controls - Moved to the right */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block"> {/* Hide search on mobile */}
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-lg transition-all duration-300 w-32 lg:w-48"
                  style={{
                    border: '1px solid var(--bg-accent)',
                    background: 'var(--bg-accent)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* Mobile Menu Toggle - Cimplic-inspired hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
                style={{
                  border: '1px solid var(--bg-accent)',
                  backgroundColor: 'var(--bg-accent)'
                }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Cimplic-inspired slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{
            borderTop: '1px solid var(--bg-accent)',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(20px)'
          }}>
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium transition-all duration-300"
                  style={{
                    color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)',
                    backgroundColor: location.pathname === path ? 'var(--bg-accent)' : 'transparent',
                    borderLeft: location.pathname === path ? '4px solid var(--accent1)' : 'none'
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)' }} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Footer - Enhanced with Cimplic-inspired dark styling */}
      <footer className="mt-16" style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--bg-accent)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-mono text-sm">&copy; 2025 TFT Bible v2. Built with Rust & React.</p>
            <p className="text-xs mt-2 opacity-75">Inspired by modern computing design</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout