import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SETS } from '../lib/graphql';
import { Set } from '../types';

const SetPatchInfoPage: React.FC = () => {
  const { data, loading, error } = useQuery(GET_SETS);

  if (loading) return <div className="container mx-auto p-4">Loading set information...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Error loading set information: {error.message}</div>;

  const sets: Set[] = data?.sets || [];

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TFT Set & Patch Information</h1>
        <p className="text-gray-600">Detailed information about current and past TFT sets and patches</p>
      </div>

      <div className="space-y-6">
        {sets.map((set: Set) => (
          <div key={set.setId} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{set.setName}</h2>
                <p className="text-gray-600 mt-1">Set ID: {set.setId}</p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Active
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Champions</h3>
                <p className="text-3xl font-bold text-center text-blue-600">{set.champions.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Traits</h3>
                <p className="text-3xl font-bold text-center text-green-600">{set.traits.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Augments</h3>
                <p className="text-3xl font-bold text-center text-purple-600">{set.augments.length}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Set Mechanics</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">This set features unique mechanics that change gameplay:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Unique board setup or game rules</li>
                  <li>Special item or trait interactions</li>
                  <li>Dynamic gameplay elements</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Patch Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Latest Patch: 16.0</h4>
                  <span className="text-sm text-gray-500">Released: January 2026</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Introduced new champion abilities and balance changes</li>
                  <li>Updated trait synergies and breakpoints</li>
                  <li>Added new augments and reworked existing ones</li>
                  <li>Improved item interactions and combinations</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Meta Compositions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-800">Hyper Carry</h4>
                  <p className="text-sm text-gray-600 mt-1">Focus on scaling carries with item supports</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Gunner</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Ranger</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-800">Sorcerer Control</h4>
                  <p className="text-sm text-gray-600 mt-1">Control the battlefield with magic damage</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Sorcerer</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Arcane</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-800">Ninja Assassin</h4>
                  <p className="text-sm text-gray-600 mt-1">High burst damage with mobility</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Assassin</span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Ninja</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Additional section for patch history */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Patch History</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-800">Patch 15.23</h3>
              <p className="text-gray-600 text-sm">Released: December 2025 - Balance changes and bug fixes</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-800">Patch 15.22</h3>
              <p className="text-gray-600 text-sm">Released: November 2025 - New augments and item adjustments</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-800">Patch 15.21</h3>
              <p className="text-gray-600 text-sm">Released: October 2025 - Set 15 launch with new champions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPatchInfoPage;