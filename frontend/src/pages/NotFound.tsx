import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-7xl sm:text-9xl font-bold text-tft-gold mb-4">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Page Not Found</h2>
          <p className="text-base sm:text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-tft-gold text-gray-900 rounded-lg hover:bg-tft-gold/90 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors"
            style={{
              border: '1px solid var(--bg-accent)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
