# Creatomate Template ID Design (pal_video_fixed_v1)

## Scope
- Fixed template by default (pal_video_fixed_v1).
- Up to 7 scenes (15-30s, ~4s per cut).
- Optional assets (logo/image) can be empty.

## Global IDs
- accent_primary
- accent_secondary
- logo_image
- bgm_track

## Scene IDs (1-7)
For each scene N (01..07):
- scene_N_bg
- scene_N_title
- scene_N_sub
- scene_N_duration

Example for scene 1:
- scene_01_bg
- scene_01_title
- scene_01_sub
- scene_01_duration

## Mapping from hearing items
- 制作目的 -> scene_01_title (or purpose label element if added later)
- 秒数 -> scene_N_duration (used to calculate timing)
- 素材 (画像/ロゴ) -> scene_N_bg, logo_image
- 使いたい色 -> accent_primary, accent_secondary
- BGM -> bgm_track

## Notes
- Keep IDs lowercase with underscores.
- For unused scenes, hide elements or set opacity to 0.
- If a dynamic template is used, keep these IDs as a compatibility layer.
