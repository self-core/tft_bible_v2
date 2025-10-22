import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ThumbsUp, Clock, Users, Target } from 'lucide-react'
import { compositionsApi } from '../lib/api'

const CompositionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [isVoting, setIsVoting] = useState(false)

  const { data: composition, isLoading, error } = useQuery({
    queryKey: ['composition', id],
    queryFn: () => compositionsApi.getCompositionById(id!).then(res => res.data),
    enabled: !!id,
  })

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
        <p className="text-red-600">Failed to load composition details. Please try again.</p>
        <Link to="/compositions" className="text-tft-gold hover:underline mt-4 inline-block">
          ← Back to Compositions
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/compositions"
          className="flex items-center gap-2 text-gray-600 hover:text-tft-gold transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Compositions
        </Link>
      </div>

      {/* Title and Meta */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{composition.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(composition.meta.tier)}`}>
                {composition.meta.tier} Tier
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {composition.category}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Difficulty: {composition.meta.difficulty}/5
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {composition.champions.length} Champions
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-tft-gold" />
                {composition.meta.winrate.toFixed(1)}% Win Rate
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
                <div className="text-2xl font-bold text-tft-gold">{composition.views}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{composition.votes.upvotes}</div>
                <div className="text-sm text-gray-600">Upvotes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{composition.votes.downvotes}</div>
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

      {/* Content Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Composition Details</h2>
        <div className="text-gray-600">
          <p className="mb-4">
            This composition features a {composition.category.toLowerCase()} strategy with {composition.champions.length} champions.
            It has a {composition.meta.difficulty <= 2 ? 'low' : composition.meta.difficulty <= 3 ? 'medium' : 'high'} difficulty rating
            and performs well in {composition.meta.playstyle.toLowerCase()} playstyles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
              <ul className="space-y-1 text-sm">
                <li>Win Rate: {composition.meta.winrate.toFixed(1)}%</li>
                <li>Average Placement: {composition.meta.avg_placement.toFixed(1)}</li>
                <li>Play Rate: {(composition.meta.playrate * 100).toFixed(1)}%</li>
                <li>Contest Rate: {(composition.meta.contest_rate * 100).toFixed(1)}%</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Strategy Info</h3>
              <ul className="space-y-1 text-sm">
                <li>Cost: {composition.meta.cost}</li>
                <li>Playstyle: {composition.meta.playstyle}</li>
                <li>Patch: {composition.meta.patch}</li>
                <li>Category: {composition.category}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {composition.tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
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