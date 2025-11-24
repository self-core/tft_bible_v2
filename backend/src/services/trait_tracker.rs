use std::collections::{HashMap, HashSet, VecDeque};
use crate::models::{Champion, ChampionStats, ChampionAbility, Trait, TraitBreakpoint, StarScaling, StarMultipliers};
use crate::errors::ApiError;

#[derive(Debug, Clone)]
pub struct TraitTrackerResponse {
    pub path: Vec<Champion>,
    pub efficiency: f64,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct TraitRequirement {
    pub trait_name: String,
    pub required_count: u32,
}

pub struct TraitTrackerService;

impl TraitTrackerService {
    /// Find the shortest path to acquire required traits using BFS algorithm
    pub async fn find_shortest_trait_path(
        champions: Vec<Champion>,
        target_traits: Vec<TraitRequirement>,
        current_traits: HashMap<String, u32>,
        traits: Vec<Trait>,
    ) -> Result<TraitTrackerResponse, ApiError> {
        // Create a map of trait names to their breakpoints for quick access
        let trait_breakpoints: HashMap<String, Vec<TraitBreakpoint>> = traits
            .into_iter()
            .map(|trait_data| (trait_data.name.clone(), trait_data.breakpoints))
            .collect();

        // Create a mapping of available champions for quicker access
        let available_champions: Vec<&Champion> = champions.iter().collect();

        // BFS implementation
        // Each state contains:
        // - current traits count
        // - path of champions taken to reach this state
        // - cost of the path

        // Use a queue for BFS
        let mut queue: VecDeque<(HashMap<String, u32>, Vec<Champion>, f64)> = VecDeque::new();

        // Start with current traits
        queue.push_back((current_traits.clone(), Vec::new(), 0.0));

        // Keep track of visited states to avoid cycles
        // Use a set of trait counts as keys (represented as sorted vector of (trait, count) pairs)
        let mut visited: HashSet<String> = HashSet::new();

        // Process the queue
        while let Some((mut current_trait_counts, current_path, current_cost)) = queue.pop_front() {
            // Check if we've already visited this trait combination
            let state_key = self.create_state_key(&current_trait_counts);
            if visited.contains(&state_key) {
                continue;
            }
            visited.insert(state_key);

            // Check if all targets are satisfied
            let all_targets_met = target_traits.iter().all(|req| {
                let current_count = current_trait_counts.get(&req.trait_name).unwrap_or(&0);
                current_count >= &req.required_count
            });

            if all_targets_met {
                return Ok(TraitTrackerResponse {
                    path: current_path,
                    efficiency: self.calculate_efficiency(&current_path, &target_traits),
                });
            }

            // If not all targets met, try adding each available champion
            for champion in &available_champions {
                // Skip if champion is already in the path
                if current_path.iter().any(|c| c.id == champion.id) {
                    continue;
                }

                // Create a new trait count state by adding this champion
                let mut new_trait_counts = current_trait_counts.clone();
                for trait_name in &champion.traits {
                    *new_trait_counts.entry(trait_name.clone()).or_insert(0) += 1;
                }

                // Create new path
                let mut new_path = current_path.clone();
                new_path.push((*champion).clone());

                // Calculate new cost
                let new_cost = current_cost + (champion.cost as f64);

                // Add to queue
                queue.push_back((new_trait_counts, new_path, new_cost));
            }

            // Limit search to prevent excessive computation
            if queue.len() > 10000 {
                break;
            }
        }

        // If we get here without finding a solution, return the path that got closest to the goal
        // For now, return an empty path (in a real implementation you would want to return the best partial solution)
        Ok(TraitTrackerResponse {
            path: Vec::new(),
            efficiency: 0.0,
        })
    }

    /// Alternative implementation using A* algorithm for better efficiency
    pub async fn find_optimal_trait_path(
        champions: Vec<Champion>,
        target_traits: Vec<crate::services::trait_tracker::TraitRequirement>,
        current_traits: HashMap<String, u32>,
        traits: Vec<crate::models::Trait>,
    ) -> Result<TraitTrackerResponse, ApiError> {
        // Create a map of trait names to their breakpoints for quick access
        let trait_breakpoints: HashMap<String, Vec<TraitBreakpoint>> = traits
            .into_iter()
            .map(|trait_data| (trait_data.name.clone(), trait_data.breakpoints))
            .collect();

        // Create a list of champions sorted by a heuristic value (traits gained per cost)
        let mut available_champions: Vec<&Champion> = champions.iter().collect();
        available_champions.sort_by(|a, b| {
            let efficiency_a = self.calculate_champion_efficiency(a, &target_traits, &current_traits, &trait_breakpoints);
            let efficiency_b = self.calculate_champion_efficiency(b, &target_traits, &current_traits, &trait_breakpoints);
            efficiency_b.partial_cmp(&efficiency_a).unwrap_or(std::cmp::Ordering::Equal)
        });

        // Use a greedy approach for now (A* implementation would be more complex)
        let mut current_trait_counts = current_traits;
        let mut selected_champions = Vec::new();
        let mut total_cost = 0;

        // Continue until all targets are met or no more champions can be added
        let mut iteration_count = 0;
        let max_iterations = 50; // Prevent infinite loops

        while iteration_count < max_iterations {
            let mut found_beneficial = false;

            // Check if all targets are satisfied
            let all_targets_met = target_traits.iter().all(|req| {
                let current_count = current_trait_counts.get(&req.trait_name).unwrap_or(&0);
                current_count >= &req.required_count
            });

            if all_targets_met {
                break;
            }

            // Find the best champion to add based on efficiency
            let mut best_champion: Option<&Champion> = None;
            let mut best_efficiency = 0.0;

            for champion in &available_champions {
                // Skip if champion is already selected
                if selected_champions.iter().any(|c: &Champion| c.id == champion.id) {
                    continue;
                }

                let efficiency = self.calculate_champion_efficiency(champion, &target_traits, &current_trait_counts, &trait_breakpoints);

                if efficiency > best_efficiency {
                    best_efficiency = efficiency;
                    best_champion = Some(champion);
                }
            }

            // Add the best champion to the path
            if let Some(champion) = best_champion {
                // Add traits from this champion
                for trait_name in &champion.traits {
                    *current_trait_counts.entry(trait_name.clone()).or_insert(0) += 1;
                }

                selected_champions.push((*champion).clone());
                total_cost += champion.cost as f64;
                found_beneficial = true;
            }

            // If no beneficial champion was found, break
            if !found_beneficial {
                break;
            }

            iteration_count += 1;
        }

        Ok(TraitTrackerResponse {
            path: selected_champions,
            efficiency: self.calculate_efficiency(&selected_champions, &target_traits),
        })
    }

    /// Calculate the efficiency of a champion for reaching target traits
    fn calculate_champion_efficiency(
        &self,
        champion: &Champion,
        target_traits: &[TraitRequirement],
        current_trait_counts: &HashMap<String, u32>,
        trait_breakpoints: &HashMap<String, Vec<TraitBreakpoint>>,
    ) -> f64 {
        let mut trait_value = 0.0;
        
        for trait_name in &champion.traits {
            // Check if this is a target trait
            if let Some(req) = target_traits.iter().find(|r| r.trait_name == *trait_name) {
                let current_count = current_trait_counts.get(trait_name).unwrap_or(&0);
                
                // If we can reach the target with this champion
                if current_count + 1 <= req.required_count {
                    // Higher value for traits closer to their breakpoints
                    trait_value += 1.0;
                    
                    // Bonus if this addition activates a breakpoint
                    if let Some(breakpoints) = trait_breakpoints.get(trait_name) {
                        for breakpoint in breakpoints {
                            if *current_count < breakpoint.count && *current_count + 1 >= breakpoint.count {
                                // This champion activates a breakpoint, add bonus value
                                trait_value += 2.0;
                            }
                        }
                    }
                }
            }
        }

        // Calculate efficiency as trait value per cost
        if champion.cost > 0 {
            trait_value / (champion.cost as f64)
        } else {
            trait_value
        }
    }

    /// Calculate overall efficiency of a path
    fn calculate_efficiency(&self, path: &[Champion], target_traits: &[TraitRequirement]) -> f64 {
        if path.is_empty() {
            return 0.0;
        }

        let total_cost: f64 = path.iter().map(|c| c.cost as f64).sum();
        if total_cost == 0.0 {
            return 0.0;
        }

        // Calculate how many target traits we've satisfied
        let mut satisfied_targets = 0;
        let mut trait_counts: HashMap<String, u32> = HashMap::new();

        // Count traits in the path
        for champion in path {
            for trait_name in &champion.traits {
                *trait_counts.entry(trait_name.clone()).or_insert(0) += 1;
            }
        }

        // Count satisfied targets
        for req in target_traits {
            if let Some(count) = trait_counts.get(&req.trait_name) {
                if count >= &req.required_count {
                    satisfied_targets += 1;
                }
            }
        }

        // Efficiency = satisfied targets / total cost
        satisfied_targets as f64 / total_cost
    }

    /// Create a unique key for a trait state to use in visited set
    fn create_state_key(&self, trait_counts: &HashMap<String, u32>) -> String {
        let mut pairs: Vec<(&String, &u32)> = trait_counts.iter().collect();
        pairs.sort_by_key(|(trait_name, _)| *trait_name);
        pairs.iter()
            .map(|(k, v)| format!("{}:{}", k, v))
            .collect::<Vec<_>>()
            .join(",")
    }
}