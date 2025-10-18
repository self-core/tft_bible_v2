import { Link } from 'react-router-dom'
import { Swords, Users, Package, TrendingUp, Star } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Swords,
      title: 'Team Compositions',
      description: 'Browse and discover winning TFT team compositions with detailed strategies and item builds.',
      link: '/compositions',
      color: 'text-tft-gold',
    },
    {
      icon: Users,
      title: 'Champion Database',
      description: 'Complete champion information including stats, abilities, and trait synergies.',
      link: '/champions',
      color: 'text-tft-blue',
    },
    {
      icon: Package,
      title: 'Item Encyclopedia',
      description: 'Comprehensive item database with stats, recipes, and build recommendations.',
      link: '/items',
      color: 'text-tft-green',
    },
  ]

  const stats = [
    { label: 'Compositions', value: '2,500+', icon: Swords },
    { label: 'Champions', value: '65', icon: Users },
    { label: 'Items', value: '250+', icon: Package },
    { label: 'Active Users', value: '10K+', icon: TrendingUp },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Master <span className="text-tft-gold">Teamfight Tactics</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your ultimate companion for TFT success. Discover winning compositions,
          master champion synergies, and optimize your item builds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/compositions"
            className="bg-tft-gold text-white px-8 py-3 rounded-lg font-semibold hover:bg-tft-gold/90 transition-colors"
          >
            Browse Compositions
          </Link>
          <Link
            to="/champions"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Explore Champions
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="h-8 w-8 text-tft-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Everything You Need to Win
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, link, color }) => (
            <Link
              key={title}
              to={link}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
            >
              <Icon className={`h-12 w-12 ${color} mb-4`} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-tft-gold transition-colors">
                {title}
              </h3>
              <p className="text-gray-600">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-tft-blue to-tft-gold rounded-lg p-8 text-white text-center">
        <Star className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4">Ready to Climb the Ladder?</h3>
        <p className="text-lg mb-6 opacity-90">
          Join thousands of TFT players who use TFT Bible to improve their game.
        </p>
        <Link
          to="/compositions"
          className="bg-white text-tft-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}

export default Home