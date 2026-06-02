import { useQuery } from '@apollo/client';
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
  RIOT_SUMMONER_BY_PUUID,
  RIOT_MATCH_HISTORY,
  RIOT_MATCH_DETAIL,
  RiotSummoner,
  RiotMatch
} from '../lib/api';

const RiotProfile = () => {
  const { puuid } = useParams<{ puuid: string }>();

  const { data: summonerData, loading: summonerLoading, error: summonerError } = useQuery(
    RIOT_SUMMONER_BY_PUUID,
    { variables: { puuid }, skip: !puuid }
  );

  const { data: matchListData, loading: matchesLoading, error: matchesError } = useQuery(
    RIOT_MATCH_HISTORY,
    { variables: { puuid, start: 0, count: 20 }, skip: !puuid }
  );

  const firstMatchId = matchListData?.riotMatchHistory?.[0];
  const { data: firstMatchData } = useQuery(
    RIOT_MATCH_DETAIL,
    { variables: { matchId: firstMatchId }, skip: !firstMatchId }
  );

  const isLoading = summonerLoading || matchesLoading;
  const hasError = summonerError || matchesError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load summoner data. Please try again.</p>
      </div>
    );
  }

  const summoner: RiotSummoner | undefined = summonerData?.riotSummonerByPuuid;
  if (!summoner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Summoner not found.</p>
      </div>
    );
  }

  const matchIds: string[] = matchListData?.riotMatchHistory || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{summoner.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Level {summoner.summonerLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>PUUID: {summoner.puuid.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <button className="btn-cimplic bg-tft-gold text-white px-4 py-2 rounded-lg">
            Refresh Data
          </button>
        </div>
      </div>

      {firstMatchData?.riotMatchDetail && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-cimplic p-4 text-center">
            <TrendingUp className="h-6 w-6 text-tft-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {firstMatchData.riotMatchDetail.info.gameDatetime
                ? new Date(firstMatchData.riotMatchDetail.info.gameDatetime * 1000).toLocaleDateString()
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Last Match Date</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Target className="h-6 w-6 text-tft-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              Set {firstMatchData.riotMatchDetail.info.tftSetNumber}
            </div>
            <div className="text-sm text-gray-600">Latest Set</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Users className="h-6 w-6 text-tft-green mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{matchIds.length}</div>
            <div className="text-sm text-gray-600">Recent Matches</div>
          </div>
          <div className="card-cimplic p-4 text-center">
            <Clock className="h-6 w-6 text-tft-purple mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{summoner.summonerLevel}</div>
            <div className="text-sm text-gray-600">Summoner Level</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Match History</h3>

        {firstMatchData?.riotMatchDetail ? (
          (() => {
            const match: RiotMatch = firstMatchData.riotMatchDetail;
            const participant = match.participants?.find(p => p.puuid === puuid);

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        participant && participant.placement <= 1 ? 'bg-tft-gold text-white' :
                        participant && participant.placement <= 4 ? 'bg-tft-blue text-white' :
                        participant && participant.placement <= 6 ? 'bg-tft-green text-white' : 'bg-gray-200 text-gray-800'
                      }`}>
                        #{participant?.placement || '?'}
                      </span>
                      <span className="text-gray-600">
                        {new Date(match.info.gameDatetime * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Set {match.info.tftSetNumber} • {match.info.tftGameType}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Sword className="h-4 w-4" />
                      <span>{participant?.totalDamageToPlayers || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{participant?.traits?.length || 0} traits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>{participant?.units?.length || 0} units</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {participant?.units?.slice(0, 6).map((unit, idx) => (
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
                  {participant && participant.units.length > 6 && (
                    <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      +{participant.units.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-8 text-gray-500">
            No match data available yet.
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-md font-semibold text-gray-900">All Match IDs</h4>
          {matchIds.length > 0 ? (
            matchIds.map((matchId, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{matchId}</span>
                  <button className="text-sm text-tft-gold hover:text-tft-gold/80">
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No match history available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiotProfile;
