import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Save, Upload, Download } from 'lucide-react';

const CompositionBuilder = () => {
  const [compositionName, setCompositionName] = useState('');
  const [compositionDescription, setCompositionDescription] = useState('');
  const [champions, setChampions] = useState<any[]>([]);
  const [selectedChampion, setSelectedChampion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tier, setTier] = useState('S');
  const [category, setCategory] = useState('Reroll');
  const [difficulty, setDifficulty] = useState(3);
  const [tags, setTags] = useState('');
  // const [showChampions, setShowChampions] = useState(false);

  const addChampion = (champion: any) => {
    if (!champions.find(c => c.id === champion.id)) {
      setChampions([...champions, champion]);
    }
    // setShowChampions(false);
    setSelectedChampion('');
  };

  const removeChampion = (id: string) => {
    setChampions(champions.filter(c => c.id !== id));
  };

  const addChampionFromSearch = () => {
    if (selectedChampion) {
      // In a real implementation, we would fetch champion details
      const mockChampion = {
        id: selectedChampion,
        name: selectedChampion,
        cost: 1,
        traits: ['Sample Trait'],
        image_url: ''
      };
      addChampion(mockChampion);
    }
  };

  const saveComposition = () => {
    // In a real implementation, we would save the composition
    console.log({
      name: compositionName,
      description: compositionDescription,
      champions,
      tier,
      category,
      difficulty,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
    alert('Composition saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/compositions"
          className="flex items-center gap-2 text-gray-400 hover:text-tft-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Compositions
        </Link>
        <h1 className="text-2xl font-bold text-white">Custom Composition Builder</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Builder Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Composition Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={compositionName}
                  onChange={(e) => setCompositionName(e.target.value)}
                  placeholder="Enter composition name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={compositionDescription}
                  onChange={(e) => setCompositionDescription(e.target.value)}
                  placeholder="Describe your composition strategy..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                  >
                    <option value="S" className="bg-gray-700 text-white">S</option>
                    <option value="A" className="bg-gray-700 text-white">A</option>
                    <option value="B" className="bg-gray-700 text-white">B</option>
                    <option value="C" className="bg-gray-700 text-white">C</option>
                    <option value="D" className="bg-gray-700 text-white">D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                  >
                    <option value="Reroll" className="bg-gray-700 text-white">Reroll</option>
                    <option value="Frontline" className="bg-gray-700 text-white">Frontline</option>
                    <option value="Vertical" className="bg-gray-700 text-white">Vertical</option>
                    <option value="Horizontal" className="bg-gray-700 text-white">Horizontal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                  >
                    <option value="1" className="bg-gray-700 text-white">1 - Very Easy</option>
                    <option value="2" className="bg-gray-700 text-white">2 - Easy</option>
                    <option value="3" className="bg-gray-700 text-white">3 - Medium</option>
                    <option value="4" className="bg-gray-700 text-white">4 - Hard</option>
                    <option value="5" className="bg-gray-700 text-white">5 - Very Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Beginner, Aggressive, Budget..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Champion Search and Add */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Champions</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search champions..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-tft-gold focus:border-transparent"
              />
              <button
                onClick={addChampionFromSearch}
                className="flex items-center gap-2 px-4 py-2 bg-tft-gold text-gray-900 rounded-lg hover:bg-opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-4">
              <p className="text-gray-400 text-sm">Search results will appear here...</p>
            </div>
          </div>

          {/* Selected Champions */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Champions in Composition</h2>
              <span className="text-gray-400">{champions.length} champions</span>
            </div>

            {champions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No champions added yet. Use the search above to add champions to your composition.</p>
            ) : (
              <div className="space-y-3">
                {champions.map((champion) => (
                  <div key={champion.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{champion.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{champion.name}</p>
                        <p className="text-gray-400 text-sm">Cost: {champion.cost}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeChampion(champion.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={saveComposition}
                disabled={!compositionName || champions.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-tft-gold text-gray-900 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                Save Composition
              </button>
              
              <button
                disabled={!compositionName || champions.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                Share Composition
              </button>

              <button
                disabled={!compositionName || champions.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export Build
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{compositionName || 'Untitled Composition'}</h3>
                <p className="text-gray-400 text-sm mb-3">{compositionDescription || 'Add a description to your composition...'}</p>
                
                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300">
                    Tier: {tier}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300">
                    {category}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                    Difficulty: {difficulty}/5
                  </span>
                </div>
              </div>

              {champions.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Champions ({champions.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {champions.map((champion, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-sm"
                        title={`Cost: ${champion.cost}`}
                      >
                        {champion.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompositionBuilder;