pub mod compositions;
pub mod champions;
pub mod items;
pub mod augments;
pub mod traits;
pub mod sets;
pub mod search;
pub mod health;

// Re-export all handler functions
pub use compositions::*;
pub use champions::*;
pub use items::*;
pub use augments::*;
pub use traits::*;
pub use sets::*;
pub use search::*;
pub use health::*;