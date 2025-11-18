import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Search,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { riotApi } from '../lib/api';

const SummonerSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'puuid'>('name');
  const queryClient = useQueryClient();

  // Fetch summoner data directly (for immediate results)
  const { data: summonerData, isLoading, error, refetch } = useQuery({
    queryKey: ['riot-summoner-search', searchTerm, searchType],
    queryFn: () => {
      if (!searchTerm.trim()) return Promise.resolve(null);
      
      if (searchType === 'puuid') {
        return riotApi.getSummonerByPuuid(searchTerm).then(res => res.data);
      } else {
        return riotApi.getSummonerByName(searchTerm).then(res => res.data);
      }
    },
    enabled: false, // Only run when manually triggered
  });

  // Mutation to queue summoner fetch in the background
  const queueMutation = useMutation({
    mutationFn: (identifier: string) => riotApi.queueSummonerFetch(identifier).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riot-summoner-search'] });
      alert('Summoner fetch queued successfully! Data will be available soon.');
    },
    onError: (error) => {
      console.error('Error queuing summoner fetch:', error);
      alert('Error queuing summoner fetch. Please try again.');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      refetch();
    }
  };

  const handleQueue = () => {
    if (searchTerm.trim()) {
      queueMutation.mutate(searchTerm.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Riot Summoner Search</h1>
        <p className="text-gray-600">
          Search for TFT summoners and fetch their match data
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="name"
                  checked={searchType === 'name'}
                  onChange={() => setSearchType('name')}
                  className="mr-2"
                />
                Summoner Name
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="puuid"
                  checked={searchType === 'puuid'}
                  onChange={() => setSearchType('puuid')}
                  className="mr-2"
                />
                PUUID
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {searchType === 'name' ? 'Summoner Name' : 'PUUID'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchType === 'name' ? 'Enter summoner name...' : 'Enter PUUID...'}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-cimplic bg-tft-gold text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQueue}
              disabled={queueMutation.isPending || !searchTerm.trim()}
              className="btn-cimplic bg-tft-blue text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Queue Fetch
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                // Clear any displayed results
              }}
              className="btn-cimplic bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {(isLoading || error || summonerData) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Search Results
          </h3>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tft-gold"></div>
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to find summoner. Please check the name/PUUID and try again.</p>
            </div>
          )}

          {summonerData && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{summonerData.name}</h4>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Level: {summonerData.summoner_level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>ID: {summonerData.id.substring(0, 12)}...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      <span>PUUID: {summonerData.puuid.substring(0, 12)}...</span>
                    </div>
                  </div>
                </div>
                
                <button className="btn-cimplic bg-tft-green text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  View Profile
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Action Options</h5>
                  <div className="space-y-2">
                    <button 
                      onClick={handleQueue}
                      disabled={queueMutation.isPending}
                      className="w-full btn-cimplic bg-tft-blue text-white px-3 py-2 rounded-lg text-left disabled:opacity-50 flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      {queueMutation.isPending ? 'Queuing...' : 'Fetch Match History (Background)'}
                    </button>
                    <button className="w-full btn-cimplic bg-tft-gold text-white px-3 py-2 rounded-lg text-left flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      View Recent Matches
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Info</h5>
                  <p className="text-sm text-gray-600">
                    This summoner's data is from Riot Games API. Match history can be fetched in the background 
                    and will be stored in our database for faster access later.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About Data Fetching</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Background Fetching:</strong> Use the "Queue Fetch" button to add summoners to our data processing queue. This allows us to continuously update their data.</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Immediate Search:</strong> Use the search button for immediate lookup, but note that this consumes Riot API calls.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Rate Limits:</strong> The background queue system helps manage Riot's API rate limits efficiently.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SummonerSearch;