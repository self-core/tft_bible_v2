import { Link, useLocation } from 'react-router-dom'
import { Swords, Users, Package, Home, Menu, X, Book, Target, Zap, Eye, FlaskConical, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import { useSetsStore } from '../stores/setsStore'
import type { SetData } from '../lib/api'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/compositions', label: 'Compositions', icon: Swords },
  { path: '/builder', label: 'Team Builder', icon: Swords },
  { path: '/sandbox', label: 'Sandbox', icon: FlaskConical },
  { path: '/trait-tracker', label: 'Trait Tracker', icon: Target },
  { path: '/champions', label: 'Champions', icon: Users },
  { path: '/traits', label: 'Traits', icon: Book },
  { path: '/items', label: 'Items', icon: Package },
  { path: '/augments', label: 'Augments', icon: Zap },
]

const archivedColor = 'color-mix(in srgb, var(--text-secondary) 55%, transparent)'

function statusDot(set: SetData) {
  if (set.status === 'active') return 'var(--accent1)'
  if (set.status === 'upcoming') return 'var(--accent2)'
  return 'color-mix(in srgb, var(--text-secondary) 45%, transparent)'
}

interface SetsMenuProps {
  sets: SetData[]
  currentSetId?: number
}

function SetsMenu({ sets, currentSetId }: SetsMenuProps) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const ordered = [...sets].sort((a, b) => b.setId - a.setId)
  const liveSets = ordered.filter((set) => set.status !== 'archived')
  const archivedSets = ordered.filter((set) => set.status === 'archived')
  const setsAreaActive = location.pathname.startsWith('/sets')

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const renderSet = (set: SetData) => {
    const isCurrent = currentSetId === set.setId
    const archived = set.status === 'archived'
    return (
      <Link
        key={set.setId}
        to={`/sets/${set.setId}`}
        role="menuitem"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--bg-accent)]"
        style={{
          color: archived ? archivedColor : isCurrent ? 'var(--accent1)' : 'var(--text-secondary)',
          backgroundColor: isCurrent && !archived ? 'var(--bg-accent)' : undefined,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: statusDot(set) }}
        />
        <span className="truncate">{set.setName}</span>
        {set.status === 'upcoming' && !archived && (
          <span className="ml-auto text-[10px] uppercase tracking-wide" style={{ color: 'var(--accent2)' }}>
            PBE
          </span>
        )}
        {archived && (
          <span className="ml-auto text-[10px] uppercase tracking-wide" style={{ color: archivedColor }}>
            archived
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Sets"
        title="Sets"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 px-2.5 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[var(--bg-accent)]"
        style={{
          color: setsAreaActive ? 'var(--accent1)' : 'var(--text-secondary)',
          backgroundColor: setsAreaActive ? 'var(--bg-accent)' : 'transparent',
        }}
      >
        <Book className="h-4 w-4 xl:hidden" />
        <span className="hidden xl:inline">Sets</span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Sets"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 rounded-lg border shadow-2xl overflow-hidden py-1.5"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--bg-accent)' }}
        >
          <Link
            to="/sets-info"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--bg-accent)]"
            style={{
              color: location.pathname === '/sets-info' ? 'var(--accent1)' : 'var(--text-secondary)',
              backgroundColor: location.pathname === '/sets-info' ? 'var(--bg-accent)' : undefined,
            }}
          >
            <Eye className="h-4 w-4" />
            Sets &amp; Patches
          </Link>

          {liveSets.length > 0 && (
            <>
              <div className="my-1.5 h-px" style={{ background: 'var(--bg-accent)' }} />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Current
              </p>
              {liveSets.map(renderSet)}
            </>
          )}

          {archivedSets.length > 0 && (
            <>
              <div className="my-1.5 h-px" style={{ background: 'var(--bg-accent)' }} />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Archived
              </p>
              {archivedSets.map(renderSet)}
            </>
          )}

          {sets.length === 0 && (
            <p className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading sets…</p>
          )}
        </div>
      )}
    </div>
  )
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sets = useSetsStore(s => s.sets)
  const fetchSets = useSetsStore(s => s.fetchSets)

  useEffect(() => { fetchSets() }, [fetchSets])
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const currentSetId = sets?.find(s => s.status === 'active')?.setId
  const orderedSets = [...(sets ?? [])].sort((a, b) => b.setId - a.setId)

  const desktopItemClass =
    'flex items-center space-x-1 px-2.5 xl:px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="backdrop-blur-md sticky top-0 z-50" style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--bg-accent)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-3 h-16">
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <Swords className="h-8 w-8" style={{ color: 'var(--accent1)' }} />
                <span className="text-lg sm:text-xl font-bold font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>TFT Bible v2</span>
              </Link>
            </div>

            {/* Laptop: icon rail · Desktop: labels · Mobile/tablet: hamburger */}
            <nav aria-label="Main" className="hidden lg:flex flex-1 justify-center min-w-0">
              <div className="flex items-center space-x-0.5">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    aria-label={label}
                    title={label}
                    className={desktopItemClass}
                    style={{
                      color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)',
                      backgroundColor: location.pathname === path ? 'var(--bg-accent)' : 'transparent'
                    }}
                  >
                    <Icon className="h-4 w-4 xl:hidden" />
                    <span className="hidden xl:inline">{label}</span>
                    {location.pathname === path && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-full" style={{ background: 'var(--accent1)' }}></div>
                    )}
                  </Link>
                ))}
                <SetsMenu sets={sets ?? []} currentSetId={currentSetId} />
              </div>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <ThemeSwitcher />

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
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

        {mobileMenuOpen && (
          <div className="lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto" style={{
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
                    borderLeft: location.pathname === path ? '4px solid var(--accent1)' : '4px solid transparent'
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: location.pathname === path ? 'var(--accent1)' : 'var(--text-secondary)' }} />
                  <span>{label}</span>
                </Link>
              ))}

              <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--bg-accent)' }}>
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  Sets
                </p>
                <Link
                  to="/sets-info"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm font-medium"
                  style={{
                    color: location.pathname === '/sets-info' ? 'var(--accent1)' : 'var(--text-secondary)',
                    backgroundColor: location.pathname === '/sets-info' ? 'var(--bg-accent)' : 'transparent'
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span>Sets &amp; Patches</span>
                </Link>
                {orderedSets.map((set) => {
                  const archived = set.status === 'archived'
                  const isCurrent = currentSetId === set.setId
                  return (
                    <Link
                      key={set.setId}
                      to={`/sets/${set.setId}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm font-medium"
                      style={{
                        color: archived ? archivedColor : isCurrent ? 'var(--accent1)' : 'var(--text-secondary)',
                        backgroundColor: isCurrent && !archived ? 'var(--bg-accent)' : 'transparent'
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: statusDot(set) }} />
                      <span>{set.setName}</span>
                      {set.status === 'upcoming' && (
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--accent2)' }}>PBE</span>
                      )}
                      {archived && (
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: archivedColor }}>archived</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      <footer className="mt-16" style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--bg-accent)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-mono text-sm">&copy; 2025 TFT Bible v2. Built with Rust &amp; React.</p>
            <p className="text-xs mt-2 opacity-75">Inspired by modern computing design</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
