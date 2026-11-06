pub mod client;
#[allow(dead_code)] // labels and user-facing strings are used by the UI task
pub mod commands;
pub mod error;
#[allow(dead_code)] // typed models and display helpers are used by the UI task
pub mod models;
pub mod overpass;
#[cfg(test)]
mod tests;
