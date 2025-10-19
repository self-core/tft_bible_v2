pub mod compositions;
pub mod champions;
pub mod items;
// pub mod augments; // TODO: Implement when needed
// pub mod traits;   // TODO: Implement when needed
// pub mod sets;     // TODO: Implement when needed
pub mod search;
pub mod health;

// Re-export all handler functions
pub use compositions::*;
pub use champions::*;
pub use items::*;
// pub use augments::*; // TODO: Implement when needed
// pub use traits::*;   // TODO: Implement when needed
// pub use sets::*;     // TODO: Implement when needed
pub use search::*;
pub use health::*;