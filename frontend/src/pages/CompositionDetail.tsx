import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ThumbsUp, Clock, Users, Target, Zap, Shield, Sword, Heart, Swords } from 'lucide-react'
import { useCompositionsStore } from '../stores'
import TFTBoard, { BoardChampion } from '../components/TFTBoard'
import { ChampionInComposition } from '../lib/api'

const CompositionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [isVoting, setIsVoting] = useState(false)

  const {
    currentComposition: composition,
    loading: isLoading,
    error,
    fetchCompositionById,
    clearCurrentComposition
  } = useCompositionsStore()

  useEffect(() => {
    if (id) {
      fetchCompositionById(id)
    }
    return () => clearCurrentComposition()
  }, [id])

  const boardChampions = useMemo((): BoardChampion[] => {
    if (!composition?.champions) return []
    return composition.champions.map((c: ChampionInComposition) => ({
      id: c.id,
      championId: c.id,
      name: c.name,
      cost: c.cost || 1,
      traits: c.traits || [],
      iconUrl: c.icon_url,
      stars: c.star_level || 1,
      items: c.items || [],
      row: c.position?.y ?? -1,
      col: c.position?.x ?? -1,
    }))
  }, [composition?.champions])

  const activeTraits = useMemo(() => {
    const counts: Record<string, number> = {}
    composition?.champions?.forEach((c: ChampionInComposition) => {
      c.traits?.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1 })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [composition?.champions])

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!composition || isVoting) return
    setIsVoting(true)
    try { console.log('Voting:', voteType) } catch (error) { console.error('Failed to vote:', error) }
    finally { setIsVoting(false) }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return { textColor: 'var(--accent1)', bgColor: 'rgba(45, 214, 182, 0.2)' }
      case 'A': return { textColor: 'var(--accent2)', bgColor: 'rgba(55, 111, 180, 0.2)' }
      case 'B': return { textColor: 'var(--accent3)', bgColor: 'rgba(127, 102, 240, 0.2)' }
      default: return { textColor: 'var(--text-secondary)', bgColor: 'var(--bg-accent)' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold" />
      </div>
    )
  }

  if (error || !composition) {
    return (
      <div className="text-center py-12">
        <div className="rounded-lg border p-6 max-w-md mx-auto"
          style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--accent2)' }}>Composition Not Found</h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error || 'The composition does not exist.'}</p>
          <Link to="/compositions" className="inline-block px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent1)', color: 'var(--bg-primary)' }}>
            ← Back to Compositions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/compositions" className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="h-4 w-4" /> Back to Compositions
      </Link>

      {/* Title & Meta */}
      <div className="rounded-xl border p-6"
        style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{composition.name}</h1>
              {composition.meta?.tier && (
                <span className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ color: getTierColor(composition.meta.tier).textColor, backgroundColor: getTierColor(composition.meta.tier).bgColor }}>
                  {composition.meta.tier} Tier
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1"><Target className="h-4 w-4" /> {composition.category || 'N/A'}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Difficulty: {composition.meta?.difficulty || 'N/A'}/5</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {composition.champions?.length || 0} Champions</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> {composition.meta?.winrate?.toFixed(1) || 'N/A'}% WR</span>
            </div>

            <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{composition.description}</p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center"><div className="text-2xl font-bold" style={{ color: 'var(--accent1)' }}>{composition.views || 0}</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Views</div></div>
              <div className="text-center"><div className="text-2xl font-bold" style={{ color: 'var(--accent2)' }}>{composition.votes?.upvotes || 0}</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Upvotes</div></div>
              <div className="text-center"><div className="text-2xl font-bold" style={{ color: 'var(--accent3)' }}>{composition.votes?.downvotes || 0}</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Down</div></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleVote('upvote')} disabled={isVoting}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--bg-primary)' }}>
                <ThumbsUp className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> Upvote
              </button>
              <button onClick={() => handleVote('downvote')} disabled={isVoting}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--bg-primary)' }}>
                <ThumbsUp className="h-4 w-4 rotate-180" style={{ color: 'var(--accent2)' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TFT Board */}
      <TFTBoard champions={boardChampions} editMode={false} title="Composition Board" />

      {/* Active Traits */}
      {activeTraits.length > 0 && (
        <div className="rounded-xl border p-6"
          style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Zap className="h-5 w-5 mr-2" style={{ color: 'var(--accent1)' }} /> Active Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeTraits.map(([trait, count]) => (
              <span key={trait} className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--bg-accent)' }}>
                {trait} <span style={{ color: 'var(--accent1)' }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Champions */}
      <div className="rounded-xl border p-6"
        style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Users className="h-5 w-5 mr-2" style={{ color: 'var(--accent1)' }} /> Champions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {composition.champions?.map((champion: ChampionInComposition, index: number) => (
            <div key={`${champion.id}-${index}`} className="rounded-lg p-4 border"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-primary)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative shrink-0">
                  {champion.icon_url ? (
                    <img src={champion.icon_url} alt={champion.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      style={{ border: `2px solid ${['#6b7280','#10b981','#3b82f6','#a855f7','#eab308'][Math.min(champion.cost - 1, 4)]}` }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-700 text-white font-bold text-sm">
                      {champion.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {champion.star_level > 1 && (
                    <div className="absolute -top-1 -right-1 flex">
                      {Array.from({ length: champion.star_level }).map((_, i) => (
                        <Star key={i} size={10} fill="#fbbf24" stroke="#fbbf24" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{champion.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {['','1⭐','2⭐','3⭐'][Math.min(champion.star_level, 3)]} · {champion.cost} Cost
                    {champion.is_core && <span className="ml-2" style={{ color: 'var(--accent1)' }}>★ Core</span>}
                  </p>
                </div>
              </div>

              {champion.traits && champion.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {champion.traits.map((trait: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-secondary)' }}>{trait}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" style={{ color: 'var(--accent2)' }} /> {champion.health || 'N/A'} HP</span>
                <span className="flex items-center gap-1"><Sword className="h-3 w-3" style={{ color: 'var(--accent1)' }} /> {champion.attack_damage || 'N/A'} AD</span>
                <span className="flex items-center gap-1 col-span-2"><Zap className="h-3 w-3" style={{ color: 'var(--accent3)' }} /> {champion.ability_name || 'N/A'}</span>
              </div>

              {champion.items && champion.items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {champion.items.map((item: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: 'rgba(45, 214, 182, 0.15)', color: 'var(--accent1)' }}>{item}</span>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Pos: ({champion.position?.x ?? '?'}, {champion.position?.y ?? '?'})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Augments */}
      {composition.augments?.preferred && composition.augments.preferred.length > 0 && (
        <div className="rounded-xl border p-6"
          style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Zap className="h-5 w-5 mr-2" style={{ color: 'var(--accent1)' }} /> Recommended Augments
          </h2>
          <div className="flex flex-wrap gap-3">
            {composition.augments.preferred.map((augment: string | any, i: number) => (
              <div key={i} className="px-4 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-primary)' }}>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {typeof augment === 'string' ? augment : augment.name || 'Unknown'}
                </div>
                {typeof augment !== 'string' && augment.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{augment.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Details */}
      <div className="rounded-xl border p-6"
        style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Target className="h-5 w-5 mr-2" style={{ color: 'var(--accent1)' }} /> Strategy Details
        </h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          This {composition.category?.toLowerCase() || 'hybrid'} composition uses {composition.champions?.length || 0} champions.
          {composition.meta?.difficulty ? (composition.meta.difficulty <= 2 ? ' Low difficulty — great for beginners.' : composition.meta.difficulty <= 3 ? ' Medium difficulty — requires some practice.' : ' High difficulty — best for experienced players.') : ''}
          {composition.meta?.playstyle ? ` Optimal playstyle: ${composition.meta.playstyle}.` : ''}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Zap className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> Performance
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex justify-between"><span>Win Rate</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.winrate?.toFixed(1) || 'N/A'}%</span></li>
              <li className="flex justify-between"><span>Avg Placement</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.avg_placement?.toFixed(1) || 'N/A'}</span></li>
              <li className="flex justify-between"><span>Play Rate</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.playrate ? (composition.meta.playrate * 100).toFixed(1) : 'N/A'}%</span></li>
              <li className="flex justify-between"><span>Contest Rate</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.contest_rate ? (composition.meta.contest_rate * 100).toFixed(1) : 'N/A'}%</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Swords className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> Info
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex justify-between"><span>Cost</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.cost || 'N/A'}</span></li>
              <li className="flex justify-between"><span>Playstyle</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.playstyle || 'N/A'}</span></li>
              <li className="flex justify-between"><span>Patch</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.meta?.patch || 'N/A'}</span></li>
              <li className="flex justify-between"><span>Category</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.category || 'N/A'}</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tags */}
      {composition.tags && composition.tags.length > 0 && (
        <div className="rounded-xl border p-6"
          style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Target className="h-5 w-5 mr-2" style={{ color: 'var(--accent1)' }} /> Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {composition.tags.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--bg-accent)' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CompositionDetail
