import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ThumbsUp, Clock, Users, Target, Zap, Shield, Sword, Heart } from 'lucide-react'
import { useCompositionsStore } from '../stores'
import { Composition, ChampionInComposition } from '../lib/api'

const CompositionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [isVoting, setIsVoting] = useState(false)
  
  const { currentComposition: composition, loading: isLoading, error, fetchCompositionById, clearError } = useCompositionsStore()

  // Fetch composition when id changes
  useEffect(() => {
    if (id) {
      fetchCompositionById(id)
    }
  }, [id, fetchCompositionById])

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!composition || isVoting) return

    setIsVoting(true)
    try {
      // TODO: Implement voting API call
      console.log('Voting:', voteType)
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return 'text-tft-gold bg-tft-gold/10'
      case 'A': return 'text-tft-blue bg-tft-blue/10'
      case 'B': return 'text-tft-green bg-tft-green/10'
      case 'C': return 'text-gray-600 bg-gray-100'
      case 'D': return 'text-tft-red bg-tft-red/10'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCostColor = (cost: number) => {
    switch (cost) {
      case 1: return 'text-gray-400'
      case 2: return 'text-green-500'
      case 3: return 'text-blue-500'
      case 4: return 'text-purple-500'
      case 5: return 'text-yellow-500'
      default: return 'text-gray-400'
    }
  }

  const getTraitColor = (trait: string) => {
    const traitColors: Record<string, string> = {
      'Inkborn': 'bg-purple-500/20 text-purple-300',
      'Storyweaver': 'bg-blue-500/20 text-blue-300',
      'Bastion': 'bg-green-500/20 text-green-300',
      'Witchcraft': 'bg-indigo-500/20 text-indigo-300',
      'Dragon': 'bg-red-500/20 text-red-300',
      'Portal': 'bg-teal-500/20 text-teal-300',
      'Fated': 'bg-yellow-500/20 text-yellow-300',
      'Ghostly': 'bg-gray-500/20 text-gray-300',
    }
    return traitColors[trait] || 'bg-gray-500/20 text-gray-300'
  }

  // Render the TFT board with champions positioned correctly
  const renderTFTBoard = () => {
    // Create an 8x4 grid for the TFT board
    const board = Array(4).fill(null).map(() => Array(8).fill(null))
    
    // Place champions on the board
    composition?.champions?.forEach(champion => {
      const { x, y } = champion.position || { x: -1, y: -1 }
      if (y >= 0 && y < 4 && x >= 0 && x < 8) {
        board[y][x] = champion
      }
    })

    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <Sword className="h-5 w-5 mr-2 text-tft-gold" />
          Composition Board
        </h2>
        
        <div className="flex flex-col gap-2">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((champion, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className="w-16 h-16 rounded-lg border-2 border-gray-700 flex items-center justify-center relative"
                >
                  {champion ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Champion avatar with icon */}
                      {champion.icon_url ? (
                        <img 
                          src={champion.icon_url} 
                          alt={champion.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.style.display = 'none';
                            // Show fallback
                            const fallback = target.parentElement?.querySelector('.fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCostColor(champion.cost)} bg-gray-700/50 border border-gray-600 fallback`}>
                          <span className="text-xs font-bold">{champion.name.charAt(0)}</span>
                        </div>
                      )}
                      
                      {/* Star level */}
                      <div className="absolute -top-1 -right-1 flex">
                        {Array(champion.star_level).fill(0).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-tft-gold fill-current" />
                        ))}
                      </div>
                      
                      {/* Core champion indicator */}
                      {champion.is_core && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-tft-gold flex items-center justify-center">
                          <span className="text-[8px] font-bold text-gray-900">★</span>
                        </div>
                      )}
                      
                      {/* Items */}
                      {champion.items && champion.items.length > 0 && (
                        <div className="absolute -bottom-1 left-0 flex">
                          {champion.items.slice(0, 2).map((_: any, i: number) => (
                            <div key={i} className="w-3 h-3 rounded-full bg-tft-blue ml-[-4px] border border-gray-800"></div>
                          ))}
                          {champion.items.length > 2 && (
                            <div className="w-3 h-3 rounded-full bg-gray-600 ml-[-4px] border border-gray-800 flex items-center justify-center">
                              <span className="text-[6px] text-white">+{champion.items.length - 2}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded border border-dashed border-gray-600"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Board legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tft-gold"></div>
            <span className="text-gray-400">Core Champion</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-tft-gold fill-current" />
            <span className="text-gray-400">Star Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tft-blue"></div>
            <span className="text-gray-400">Items</span>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    )
  }

  if (error || !composition) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Composition</h3>
          <p className="text-red-600 mb-4">{error || 'Composition not found'}</p>
          <p className="text-sm text-gray-600 mb-4">
            This composition may not exist or there might be a connection issue with the backend.
          </p>
          <Link
            to="/compositions"
            className="inline-block px-4 py-2 bg-tft-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            ← Back to Compositions
          </Link>
        </div>
      </div>
    )
  }

  // Main return with loading and error handling
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/compositions"
          className="flex items-center gap-2 text-gray-400 hover:text-tft-gold transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Compositions
        </Link>
      </div>

      {/* Title and Meta */}
      <div className="bg-gray-800/50 rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{composition.name}</h1>
              {composition.meta?.tier && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(composition.meta.tier)}`}>
                  {composition.meta.tier} Tier
                </span>
              )}
              {composition.is_verified && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-tft-blue/20 text-tft-blue">
                  Verified
                </span>
              )}
              {composition.is_featured && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-tft-gold/20 text-tft-gold">
                  Featured
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {composition.category || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Difficulty: {composition.meta?.difficulty || 'N/A'}/5
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {composition.champions?.length || 0} Champions
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-tft-gold" />
                {composition.meta?.winrate ? composition.meta.winrate.toFixed(1) : 'N/A'}% Win Rate
              </span>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed">
              {composition.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-tft-gold">{composition.views || 0}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{composition.votes?.upvotes || 0}</div>
                <div className="text-sm text-gray-600">Upvotes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{composition.votes?.downvotes || 0}</div>
                <div className="text-sm text-gray-600">Downvotes</div>
              </div>
            </div>

            {/* Vote Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
              >
                <ThumbsUp className="h-4 w-4" />
                Upvote
              </button>
              <button
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                <ThumbsUp className="h-4 w-4 rotate-180" />
                Downvote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TFT Board Visualization */}
      {renderTFTBoard()}

      {/* Champions */}
      <div className="bg-gray-800/50 rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-tft-gold" />
          Champions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {composition.champions?.map((champion: ChampionInComposition, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                {champion.icon_url ? (
                  <img
                    src={champion.icon_url}
                    alt={champion.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.style.display = 'none';
                      // Show fallback
                      const fallback = target.parentElement?.querySelector('.fallback-champion') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCostColor(champion.cost || 1)} bg-gray-100 border border-gray-200 fallback-champion`}>
                    <span className="text-sm font-medium">{champion.star_level}★</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{champion.name || 'Unknown Champion'}</h3>
                  <p className="text-sm text-gray-600">Priority: {champion.priority || 'N/A'}</p>
                </div>
                {champion.is_core && (
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-tft-gold/20 text-tft-gold rounded-full text-xs font-medium">
                      Core
                    </span>
                  </div>
                )}
              </div>

              {/* Traits */}
              <div className="flex flex-wrap gap-1 mb-3">
                {champion.traits?.map((trait: string, traitIndex: number) => (
                  <span
                    key={traitIndex}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTraitColor(trait)}`}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Champion Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>{champion.health || 'N/A'} HP</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Sword className="h-4 w-4 text-blue-500" />
                  <span>{champion.attack_damage || 'N/A'} AD</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>{champion.ability_name || 'N/A'}</span>
                </div>
              </div>

              {/* Items */}
              {champion.items && champion.items.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                  <div className="flex flex-wrap gap-1">
                    {champion.items.map((item: string, itemIndex: number) => (
                      <span
                        key={itemIndex}
                        className="px-2 py-1 bg-tft-gold/10 text-tft-gold rounded text-xs"
                      >
                        {typeof item === 'string' ? item : (item as any).name || 'Unknown Item'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Position: ({champion.position?.x || 0}, {champion.position?.y || 0})
                {champion.is_core && <span className="ml-2 text-tft-gold">★ Core</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Augments */}
      {composition.augments && composition.augments.preferred && composition.augments.preferred.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-tft-gold" />
            Recommended Augments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-100 mb-3 flex items-center">
                <Star className="h-4 w-4 mr-2 text-tft-gold" />
                Preferred
              </h3>
              <ul className="space-y-2">
                {composition.augments.preferred?.map((augment: string | any, index: number) => (
                  <li key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">
                      {typeof augment === 'string' ? augment : augment.name || 'Unknown Augment'}
                    </div>
                    {typeof augment !== 'string' && augment.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {augment.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {composition.augments?.acceptable && composition.augments.acceptable.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-100 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-tft-blue" />
                  Acceptable
                </h3>
                <ul className="space-y-2">
                  {composition.augments.acceptable.map((augment: string | any, index: number) => (
                    <li key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-900">
                        {typeof augment === 'string' ? augment : augment.name || 'Unknown Augment'}
                      </div>
                      {typeof augment !== 'string' && augment.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {augment.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategy Details */}
      <div className="bg-gray-800/50 rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-tft-gold" />
          Strategy Details
        </h2>
        <div className="text-gray-600">
          <p className="mb-4">
            This composition features a {composition.category.toLowerCase()} strategy with {composition.champions.length} champions.
            It has a {composition.meta?.difficulty && composition.meta.difficulty <= 2 ? 'low' : composition.meta?.difficulty && composition.meta.difficulty <= 3 ? 'medium' : 'high'} difficulty rating
            and performs well in {composition.meta?.playstyle?.toLowerCase() || 'N/A'} playstyles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-tft-gold" />
                Performance Metrics
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Win Rate:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.winrate ? composition.meta.winrate.toFixed(1) : 'N/A'}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Placement:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.avg_placement ? composition.meta.avg_placement.toFixed(1) : 'N/A'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Play Rate:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.playrate ? (composition.meta.playrate * 100).toFixed(1) : 'N/A'}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Contest Rate:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.contest_rate ? (composition.meta.contest_rate * 100).toFixed(1) : 'N/A'}%</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sword className="h-4 w-4 mr-2 text-tft-gold" />
                Strategy Info
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.cost || 'N/A'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Playstyle:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.playstyle || 'N/A'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Patch:</span>
                  <span className="text-gray-900 font-medium">{composition.meta?.patch || 'N/A'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900 font-medium">{composition.category || 'N/A'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {composition.tags && composition.tags.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-tft-gold" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {composition.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CompositionDetail