import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  User,
  Clock,
  Award,
  Target,
  Users,
  Sword,
  Zap,
  TrendingUp
} from 'lucide-react';
import {
  riotApi,
  RiotMatch
} from '../lib/api';

const RiotProfile = () => {
  const { puuid } = useParams<{ puuid: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview');

  // Fetch summoner data
  const { data: summonerData, isLoading: summonerLoading, error: summonerError } = useQuery({
    queryKey: ['riot-summoner', puuid],
    queryFn: () => riotApi.getSummonerByPuuid(puuid!).then(res => res.data),
    enabled: !!puuid,
  });

  // Fetch match history
  const { data: matchListData, isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ['riot-match-history', puuid],
    queryFn: () => riotApi.getMatchHistory(puuid!).then(res => res.data),
    enabled: !!puuid,
  });

  // Fetch detailed match data (first few matches for overview)
  const firstMatchIds = matchListData?.match_ids?.slice(0, 5) || [];
  const matchQueries = useQuery({
    queryKey: ['riot-matches-detailed', firstMatchIds],
    queryFn: async () => {
      if (firstMatchIds.length === 0) return [];
      
      const matchPromises = firstMatchIds.map(matchId => 
        riotApi.getMatchDetails(matchId).then(res => res.data as RiotMatch)
      );
      
      return Promise.all(matchPromises);
    },
    enabled: firstMatchIds.length > 0,
  });

  const isLoading = summonerLoading || matchesLoading;
  const hasError = summonerError || matchesError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    );
  }

  if (hasError || !summonerData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load summoner data. Please try again.</p>
      </div>
    );
  }

  // Calculate statistics from match data
  const calculateStats = () => {
    if (!matchQueries.data?.length) return null;

    const placements = matchQueries.data.map(match => {
      const participant = match.info.participants.find(p => p.puuid === puuid);
      return participant ? participant.placement : 0;
    }).filter(p => p > 0); // Only valid placements

    const avgPlacement = placements.length > 0 
      ? (placements.reduce((sum, p) => sum + p, 0) / placements.length).toFixed(1)
      : 'N/A';

    const top4Rate = placements.filter(p => p <= 4).length / placements.length * 100 || 0;
    const top1Rate = placements.filter(p => p === 1).length / placements.length * 100 || 0;

    return {
      avgPlacement,
      top4Rate: top4Rate.toFixed(1),
      top1Rate: top1Rate.toFixed(1),
      totalMatches: placements.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Summoner Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
            {/* In a real app, we'd show the profile icon */}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{summonerData.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Level {summonerData.summoner_level}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>PUUID: {summonerData.puuid.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <button className="btn-cimplic bg-tft-gold text-white px-4 py-2 rounded-lg">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-cimplic p-4 text-center">
            <TrendingUp className="h-6 w-6 text-tft-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.avgPlacement}</div>
            <div className="text-sm text-gray-600">Avg Placement</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Target className="h-6 w-6 text-tft-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.top1Rate}%</div>
            <div className="text-sm text-gray-600">Top 1 Rate</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Users className="h-6 w-6 text-tft-green mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.top4Rate}%</div>
            <div className="text-sm text-gray-600">Top 4 Rate</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Clock className="h-6 w-6 text-tft-purple mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalMatches}</div>
            <div className="text-sm text-gray-600">Matches</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-tft-gold text-tft-gold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Matches
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'matches'
                ? 'border-tft-gold text-tft-gold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Match History
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Matches</h3>
          
          {matchQueries.data && matchQueries.data.length > 0 ? (
            matchQueries.data.map((match, index) => {
              const participant = match.info.participants.find(p => p.puuid === puuid);
              
              if (!participant) return null;

              // Get the number of traits for this player
              const traitCount = participant.traits.length;

              // Get the number of unique units for this player
              const unitCount = participant.units.length;

              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          participant.placement <= 1 ? 'bg-tft-gold text-white' :
                          participant.placement <= 4 ? 'bg-tft-blue text-white' :
                          participant.placement <= 6 ? 'bg-tft-green text-white' : 'bg-gray-200 text-gray-800'
                        }`}>
                          #{participant.placement}
                        </span>
                        <span className="text-gray-600">
                          {new Date(match.info.game_datetime * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Set {match.info.tft_set_number} • {match.info.tft_game_type}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Sword className="h-4 w-4" />
                        <span>{participant.total_damage_to_players}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{traitCount} traits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>{unitCount} units</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unit preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {participant.units.slice(0, 6).map((unit, idx) => (
                      <div 
                        key={idx} 
                        className={`px-2 py-1 rounded text-xs ${
                          unit.rarity === 3 ? 'bg-purple-100 text-purple-800' :
                          unit.rarity === 2 ? 'bg-blue-100 text-blue-800' :
                          unit.rarity === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {unit.name}
                      </div>
                    ))}
                    {participant.units.length > 6 && (
                      <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                        +{participant.units.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No match data available yet. Matches will appear after data is fetched.
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Match History</h3>
          
          {matchListData?.match_ids && matchListData.match_ids.length > 0 ? (
            <div className="space-y-2">
              {matchListData.match_ids.map((matchId, index) => {
                const match = matchQueries.data?.find(m => m.metadata.match_id === matchId);
                const participant = match?.info.participants.find(p => p.puuid === puuid);
                
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {matchId}
                          </span>
                          {participant && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              participant.placement <= 1 ? 'bg-tft-gold text-white' :
                              participant.placement <= 4 ? 'bg-tft-blue text-white' :
                              participant.placement <= 6 ? 'bg-tft-green text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                              #{participant.placement}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {match && new Date(match.info.game_datetime * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <button className="text-sm text-tft-gold hover:text-tft-gold/80">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No match history available. Use "Refresh Data" to fetch recent matches.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiotProfile;