mod api;
mod app;
mod auth;
mod config;
mod ipc;
mod open;
mod paths;
mod state;
mod theme;
mod ui;
mod worker;

fn main() -> eframe::Result {
    let initial_callback = std::env::args().nth(1);
    let sock = ipc::socket_path();
    if let Some(url) = initial_callback
        .as_deref()
        .filter(|a| a.starts_with("volvo-companion://"))
    {
        if ipc::try_forward(&sock, url) {
            return Ok(());
        }
    }
    let callbacks = match ipc::Listener::bind(&sock) {
        Ok(l) => Some(l.into_receiver()),
        Err(e) if e.kind() == std::io::ErrorKind::AddrInUse && initial_callback.is_none() => {
            eprintln!("Vlv Companion is already running.");
            return Ok(());
        }
        Err(e) => {
            eprintln!("cannot listen on {}: {e}", sock.display());
            None
        }
    };
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
    let paths = paths::Paths::from_env();
    let config = config::load_config(&paths);
    let tokens = config::load_tokens(&paths);
    // Without a listener the worker still gets a (never-firing) callback channel.
    let callbacks = callbacks.unwrap_or_else(|| std::sync::mpsc::channel().1);
    eframe::run_native(
        "Vlv Companion",
        options,
        Box::new(move |cc| {
            theme::apply(&cc.egui_ctx);
            let ctx = cc.egui_ctx.clone();
            let ui_config = config.clone();
            let (requests, events) = worker::spawn(paths, config, tokens, callbacks, move || {
                ctx.request_repaint()
            });
            Ok(Box::new(app::App::new(
                ui_config,
                requests,
                events,
                initial_callback,
            )))
        }),
    )
}
