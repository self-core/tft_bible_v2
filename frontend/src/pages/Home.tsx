import { Link } from 'react-router-dom'
import { Swords, Users, Package, Star, Zap, Target, TrendingUp, Sword, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useCompositionsStore, useChampionsStore } from '../stores'
import { Composition, Champion } from '../lib/api'
import { proxyUrl } from '../lib/imageProxy'

const Home = () => {
  const { theme } = useTheme();

  const [trendingCompositions, setTrendingCompositions] = useState<Composition[]>([]);
  const [trendingCompositionsLoading, setTrendingCompositionsLoading] = useState(false);
  const [trendingCompositionsError, setTrendingCompositionsError] = useState<string | null>(null);

  const [trendingChampions, setTrendingChampions] = useState<Champion[]>([]);
  const [trendingChampionsLoading, setTrendingChampionsLoading] = useState(false);
  const [trendingChampionsError, setTrendingChampionsError] = useState<string | null>(null);

  // Fetch trending compositions using Zustand store
  useEffect(() => {
    const fetchTrendingCompositions = async () => {
      setTrendingCompositionsLoading(true);
      setTrendingCompositionsError(null);
      try {
        // Use the compositions store to fetch data
        await useCompositionsStore.getState().fetchCompositions();
        const state = useCompositionsStore.getState();
        setTrendingCompositions(state.compositions || []);
      } catch (error: any) {
        setTrendingCompositionsError(error.message || 'Failed to fetch trending compositions');
      } finally {
        setTrendingCompositionsLoading(false);
      }
    };

    fetchTrendingCompositions();
  }, []);

  // Fetch trending champions using Zustand store
  useEffect(() => {
    const fetchTrendingChampions = async () => {
      setTrendingChampionsLoading(true);
      setTrendingChampionsError(null);
      try {
        // Use the champions store to fetch data
        await useChampionsStore.getState().fetchChampions();
        const state = useChampionsStore.getState();
        setTrendingChampions(state.champions || []);
      } catch (error: any) {
        setTrendingChampionsError(error.message || 'Failed to fetch trending champions');
      } finally {
        setTrendingChampionsLoading(false);
      }
    };

    fetchTrendingChampions();
  }, []);

  const features = [
    {
      icon: Swords,
      title: 'Team Compositions',
      description: 'Discover winning TFT strategies and team builds with detailed breakdowns',
      link: '/compositions',
      color: 'text-tft-gold'
    },
    {
      icon: Target,
      title: 'Team Builder',
      description: 'Create and customize your own compositions with our intuitive builder',
      link: '/team-builder',
      color: 'text-tft-gold'
    },
    {
      icon: Users,
      title: 'Champion Database',
      description: 'Complete champion information including stats, abilities, and trait synergies',
      link: '/champions',
      color: 'text-tft-gold'
    },
    {
      icon: Package,
      title: 'Item Encyclopedia',
      description: 'Comprehensive item database with stats, recipes, and build recommendations',
      link: '/items',
      color: 'text-tft-gold'
    }
  ];

  const stats = [
    { label: 'Compositions', value: '2,500+', icon: Swords, accent: 'text-tft-gold' },
    { label: 'Champions', value: '65', icon: Users, accent: 'text-tft-gold' },
    { label: 'Items', value: '250+', icon: Package, accent: 'text-tft-gold' },
    { label: 'Active Users', value: '10K+', icon: Star, accent: 'text-tft-gold' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-tft-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-tft-blue/10 rounded-full blur-3xl"></div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-100 font-mono">
              Master <span className="tech-highlight">Teamfight Tactics</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your ultimate companion for TFT success. Discover winning compositions, master champion synergies,
              and optimize your item builds with <span className="tech-highlight">intelligent automation</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compositions"
              className="btn-cimplic accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-tft-gold/90 transition-all duration-300 transform hover:scale-105"
            >
              <Swords className="h-5 w-5 mr-2" />
              Browse Compositions
            </Link>
            <Link
              to="/champions"
              className="btn-cimplic text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              <Users className="h-5 w-5 mr-2" />
              Explore Champions
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-accent1" />
              <span>Algorithm-to-Silicon Mapping</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-accent2" />
              <span>Trending Compositions</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-accent3" />
              <span>Custom Team Builder</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card-cimplic p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="text-center group">
              <Icon className={`h-8 w-8 ${accent} mx-auto mb-3 transition-transform group-hover:scale-110`} />
              <div className="text-2xl font-bold text-gray-100 font-mono">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Compositions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title-cimplic" style={{ color: 'var(--text-primary)' }}>
            Trending Compositions
          </h2>
          <Link
            to="/compositions"
            className="text-sm font-medium hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent1)' }}
          >
            View All <Zap className="h-4 w-4" />
          </Link>
        </div>

        {trendingCompositionsLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
          </div>
        )}

        {trendingCompositionsError && (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load compositions. Please try again.</p>
          </div>
        )}

        {!trendingCompositionsLoading && !trendingCompositionsError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCompositions.map((comp: Composition) => (
              <Link
                key={comp.id}
                to={`/compositions/${comp.id}`}
                className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
                style={{
                  background: 'var(--bg-accent)',
                  border: '1px solid var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {comp.title}
                    </h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {comp.difficulty || 'N/A'}
                    </span>
                  </div>

                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {comp.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1"><Star className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> Set {comp.setId}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {comp.championIds?.length || 0} champions</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {trendingCompositions.length === 0 && !trendingCompositionsLoading && !trendingCompositionsError && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No compositions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Trending Champions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title-cimplic" style={{ color: 'var(--text-primary)' }}>
            Trending Champions
          </h2>
          <Link
            to="/champions"
            className="text-sm font-medium hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent1)' }}
          >
            View All <Zap className="h-4 w-4" />
          </Link>
        </div>

        {trendingChampionsLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
          </div>
        )}

        {trendingChampionsError && (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load champions. Please try again.</p>
          </div>
        )}

        {!trendingChampionsLoading && !trendingChampionsError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingChampions.map((champ: Champion) => (
              <div
                key={champ.id}
                className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
                style={{
                  background: 'var(--bg-accent)',
                  border: '1px solid var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="p-6">
                  {/* Champion icon display with gradient background based on cost */}
                  <div className={`relative mb-4 rounded-lg p-2 ${
                    champ.cost === 1 ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-l-2 border-gray-600' :
                    champ.cost === 2 ? 'bg-gradient-to-br from-green-800/50 to-green-900/50 border-l-2 border-green-600' :
                    champ.cost === 3 ? 'bg-gradient-to-br from-blue-800/50 to-blue-900/50 border-l-2 border-blue-600' :
                    champ.cost === 4 ? 'bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-l-2 border-purple-600' : 'bg-gradient-to-br from-yellow-800/50 to-yellow-900/50 border-l-2 border-yellow-600'
                  }`}>
                    {champ.iconUrl ? (
                      <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gray-800">
                        <img
                          src={proxyUrl(champ.iconUrl)}
                          alt={champ.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-home-champ') as HTMLElement | null;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gray-800">
                        <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center fallback-home-champ">
                          <span className="text-2xl font-bold">{champ.name.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    {/* Cost badge */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      champ.cost === 1 ? 'bg-gray-800 border-gray-600 text-gray-300' :
                      champ.cost === 2 ? 'bg-green-800 border-green-600 text-green-300' :
                      champ.cost === 3 ? 'bg-blue-800 border-blue-600 text-blue-300' :
                      champ.cost === 4 ? 'bg-purple-800 border-purple-600 text-purple-300' : 'bg-yellow-800 border-yellow-600 text-yellow-300'
                    }`}>
                      {champ.cost}
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors text-center w-full" style={{ color: 'var(--text-primary)' }}>
                      {champ.name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Sword className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                      <span>AD: {champ.stats?.damage ? champ.stats.damage.toFixed(0) : 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Shield className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                      <span>HP: {champ.stats?.hp ? champ.stats.hp.toFixed(0) : 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Zap className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                      <span>{champ.ability?.name || 'N/A'}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {champ.traits?.slice(0, 3).map((trait_name, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--bg-accent)'
                          }}
                        >
                          {trait_name}
                        </span>
                      ))}
                      {champ.traits && champ.traits.length > 3 && (
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--bg-accent)'
                          }}
                        >
                          +{champ.traits.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {trendingChampions.length === 0 && !trendingChampionsLoading && !trendingChampionsError && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No champions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="space-y-12">
        <h2 className="section-title-cimplic text-center">Everything You Need to Win</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, title, description, link, color }) => (
            <Link
              key={title}
              to={link}
              className="card-cimplic p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-12 w-12 ${color} transition-transform group-hover:scale-110`} />
                <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded-full text-gray-300">
                  {theme === 'dark' ? 'Dark Mode' : `${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-tft-gold transition-colors font-mono">
                {title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden rounded-xl p-8 text-white text-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-tft-gold/30 via-tft-blue/30 to-tft-green/30 animate-pulse"></div>
        </div>

        <div className="relative z-10">
          <Star className="h-12 w-12 mx-auto mb-4 text-tft-gold" />
          <h3 className="text-2xl font-bold mb-4 font-mono">Ready to Climb the Ladder?</h3>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Join thousands of TFT players who use TFT Bible to improve their game with
            <span className="tech-highlight"> cutting-edge analytics</span> and
            <span className="tech-highlight"> intelligent insights</span>.
          </p>
          <Link
            to="/compositions"
            className="btn-cimplic accent bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-white transition-all duration-300 inline-flex items-center"
          >
            <Swords className="h-5 w-5 mr-2" />
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;