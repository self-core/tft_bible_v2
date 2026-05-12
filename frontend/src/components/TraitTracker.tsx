import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TRAITS, GET_CHAMPIONS } from '../lib/graphql';
import { Trait, Champion } from '../types';

interface TraitTrackerProps {
  championsOnBoard: Champion[];
  championsOnBench: Champion[];
}

const TraitTracker: React.FC<TraitTrackerProps> = ({ championsOnBoard, championsOnBench }) => {
  const { data: traitsData, loading: traitsLoading } = useQuery(GET_TRAITS);
  const { data: championsData, loading: championsLoading } = useQuery(GET_CHAMPIONS);

  const [traits, setTraits] = useState<Trait[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [activeTraits, setActiveTraits] = useState<{trait: Trait, count: number, active: boolean}[]>([]);

  useEffect(() => {
    if (traitsData?.traits) {
      setTraits(traitsData.traits);
    }
    if (championsData?.champions) {
      setChampions(championsData.champions);
    }
  }, [traitsData, championsData]);

  useEffect(() => {
    if (traits.length > 0) {
      calculateActiveTraits();
    }
  }, [championsOnBoard, championsOnBench, traits]);

  const calculateActiveTraits = () => {
    const allChampions = [...championsOnBoard, ...championsOnBench].filter(champ => champ !== null);
    const traitCounts = new Map<string, number>();

    // Count traits from all champions
    allChampions.forEach(champion => {
      if (champion && champion.traits) {
        champion.traits.forEach(traitName => {
          const currentCount = traitCounts.get(traitName) || 0;
          traitCounts.set(traitName, currentCount + 1);
        });
      }
    });

    // Calculate active traits based on breakpoints
    const calculatedTraits = traits.map(trait => {
      const count = traitCounts.get(trait.key) || 0;
      const active = trait.breakpoints?.some(breakpoint => count >= breakpoint.count) || false;
      return {
        trait,
        count,
        active
      };
    });

    setActiveTraits(calculatedTraits);
  };

  if (traitsLoading || championsLoading) {
    return <div className="p-4">Loading traits...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trait Tracker</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {activeTraits
          .filter(trait => trait.count > 0) // Only show traits that are present
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .map(({ trait, count, active }, index) => (
            <div
              key={`${trait.key}-${index}`}
              className={`p-3 rounded-lg border text-center ${
                active ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="font-medium text-sm truncate">{trait.key}</div>
              <div className={`text-lg font-bold ${active ? 'text-green-700' : 'text-gray-600'}`}>
                {count}
              </div>
              <div className={`text-xs ${active ? 'text-green-600' : 'text-gray-500'}`}>
                {active ? 'ACTIVE' : 'INACTIVE'}
              </div>
              
              {/* Show breakpoints for this trait */}
              <div className="mt-2 text-xs text-gray-500">
                {trait.breakpoints?.map((bp, idx) => (
                  <div key={idx} className={count >= bp.count ? 'text-green-600 font-medium' : ''}>
                    {bp.count} → {bp.bonus}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Trait activation guide */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-2">Trait Activation Guide</h3>
        <div className="text-sm text-gray-600">
          <p>Each trait has breakpoints that activate when you have enough units with that trait:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Place champions on the board or bench to see active traits</li>
            <li>Green indicates an active trait with bonuses</li>
            <li>Gray indicates an inactive trait</li>
            <li>Hover over traits to see bonus details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TraitTracker;