pub mod compositions;
pub mod champions;
pub mod items;
pub mod traits;
pub mod trait_tracker;
// pub mod augments; // TODO: Implement when needed
// pub mod sets;     // TODO: Implement when needed
pub mod search;
pub mod health;
pub mod riot_data;

// Re-export all handler functions
pub use compositions::*;
pub use champions::*;
pub use items::*;
pub use traits::*;
pub use trait_tracker::*;
// pub use augments::*; // TODO: Implement when needed
// pub use sets::*;     // TODO: Implement when needed
pub use search::*;
pub use health::*;
pub use riot_data::*;