pub mod compositions;
pub mod champions;
pub mod items;
// pub mod augments; // TODO: Implement when needed
// pub mod traits;   // TODO: Implement when needed
// pub mod sets;     // TODO: Implement when needed
pub mod search;
pub mod health;

// Re-export all handler functions
// pub use compositions::*; // Temporarily disabled due to router import issues
// pub use champions::*;    // Temporarily disabled due to router import issues
// pub use items::*;        // Temporarily disabled due to router import issues
// pub use augments::*; // TODO: Implement when needed
// pub use traits::*;   // TODO: Implement when needed
// pub use sets::*;     // TODO: Implement when needed
// pub use search::*;       // Temporarily disabled due to router import issues
pub use health::*;