fn main() {
    // tray.svg → tray.png に変換（OUT_DIR へ出力）
    generate_tray_icon();

    tauri_build::build()
}

fn generate_tray_icon() {
    use resvg::tiny_skia::{Pixmap, Transform};
    use resvg::usvg::{Options, Tree};

    let svg_path = std::path::Path::new("icons/tray.svg");
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let png_path = std::path::Path::new(&out_dir).join("tray.png");

    // SVG が変更されたときだけ再実行
    println!("cargo:rerun-if-changed=icons/tray.svg");

    let svg_data = std::fs::read(svg_path).expect("icons/tray.svg が見つかりません");
    let opt = Options::default();
    let tree = Tree::from_data(&svg_data, &opt).expect("SVG のパースに失敗しました");

    // 44x44 (22pt @2x) で出力
    let size = 44u32;
    let mut pixmap = Pixmap::new(size, size).expect("Pixmap の作成に失敗しました");

    let scale = size as f32 / 24.0; // viewBox は 24x24
    resvg::render(&tree, Transform::from_scale(scale, scale), &mut pixmap.as_mut());

    pixmap.save_png(&png_path).expect("tray.png の保存に失敗しました");
}
