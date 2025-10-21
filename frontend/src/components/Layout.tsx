import { Link, useLocation } from 'react-router-dom'
import { Swords, Users, Package, Home, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/compositions', label: 'Compositions', icon: Swords },
    { path: '/champions', label: 'Champions', icon: Users },
    { path: '/items', label: 'Items', icon: Package },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header - Cimplic-inspired dark mode with backdrop blur */}
      <header className="bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Swords className="h-8 w-8 text-tft-gold" />
                <span className="text-xl font-bold text-gray-100 font-mono">TFT Bible v2</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative ${
                    location.pathname === path
                      ? 'text-tft-gold bg-tft-gold/10'
                      : 'text-gray-300 hover:text-tft-gold hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {location.pathname === path && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-tft-gold rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* Search and Mobile Menu Toggle */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-tft-gold focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Mobile Menu Toggle - Cimplic-inspired hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-300" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Cimplic-inspired slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-md">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium transition-all duration-300 ${
                    location.pathname === path
                      ? 'text-tft-gold bg-tft-gold/10 border-l-4 border-tft-gold'
                      : 'text-gray-300 hover:text-tft-gold hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer - Enhanced with Cimplic-inspired dark styling */}
      <footer className="bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p className="font-mono text-sm">&copy; 2025 TFT Bible v2. Built with Rust & React.</p>
            <p className="text-xs mt-2 opacity-75">Inspired by modern computing design</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout