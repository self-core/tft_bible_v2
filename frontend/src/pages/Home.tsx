import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Users, Package, Zap, Palette, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Home = () => {
  const { theme } = useTheme();
  
  const features = [
    {
      icon: Swords,
      title: 'Team Compositions',
      description: 'Discover winning TFT strategies and team builds with detailed breakdowns',
      link: '/compositions',
      color: 'text-tft-gold'
    },
    {
      icon: Users,
      title: 'Champion Database',
      description: 'Complete champion information including stats, abilities, and trait synergies',
      link: '/champions',
      color: 'text-tft-blue'
    },
    {
      icon: Package,
      title: 'Item Encyclopedia',
      description: 'Comprehensive item database with stats, recipes, and build recommendations',
      link: '/items',
      color: 'text-tft-green'
    },
    {
      icon: Palette,
      title: 'Theme Customization',
      description: 'Personalize your experience with multiple color themes and dark mode',
      link: '/theme-test',
      color: 'text-tft-red'
    }
  ];

  const stats = [
    { label: 'Compositions', value: '2,500+', icon: Swords, accent: 'text-tft-gold' },
    { label: 'Champions', value: '65', icon: Users, accent: 'text-tft-blue' },
    { label: 'Items', value: '250+', icon: Package, accent: 'text-tft-green' },
    { label: 'Active Users', value: '10K+', icon: Star, accent: 'text-tft-red' }
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
              <Swords className="h-4 w-4 text-accent2" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center space-x-1">
              <Package className="h-4 w-4 text-accent3" />
              <span>Performance Optimization</span>
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