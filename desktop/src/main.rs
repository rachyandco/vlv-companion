#[allow(dead_code)] // used by later tasks
mod config;
#[allow(dead_code)] // used by later tasks
mod paths;
#[allow(dead_code)] // remove once later tasks use the whole theme API
mod theme;

fn main() -> eframe::Result {
    let icon = eframe::icon_data::from_png_bytes(include_bytes!("../packaging/icon-256.png"))
        .expect("bundled icon is a valid PNG");
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Vlv Companion")
            .with_app_id("vlv-companion")
            .with_inner_size([1280.0, 860.0])
            .with_min_inner_size([980.0, 700.0])
            .with_icon(icon),
        ..Default::default()
    };
    eframe::run_native(
        "Vlv Companion",
        options,
        Box::new(|cc| {
            theme::apply(&cc.egui_ctx);
            Ok(Box::new(App))
        }),
    )
}

struct App;

impl eframe::App for App {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        ui.centered_and_justified(|ui| {
            ui.label(egui::RichText::new("Vlv Companion").size(28.0));
        });
    }
}
