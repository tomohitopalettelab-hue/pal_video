@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title Pal Video - Reels Renderer

echo.
echo ============================================================
echo   Pal Video  /  Instagram Reels 高品質レンダラー
echo   9:16  1080x1920  30fps  H.264
echo ============================================================
echo.

REM ============================================================
REM  【A】素材ファイル設定
REM      ここだけ変更するだけで全カットを差し替えられます
REM      150テンプレート対応: SET CUT1〜CUTn を追加していくだけ
REM ============================================================
SET CUT1=clip1.mp4
SET CUT2=clip2.mp4
SET CUT3=clip3.mp4
SET CUT4=clip4.mp4
SET CUT5=clip5.mp4

REM カット数（CUT1〜CUTn の n を設定）
SET CUT_COUNT=5

REM 各カットの秒数（入力素材はこれ以上の長さが必要）
SET CUT_DUR=5

REM ============================================================
REM  【B】テキストオーバーレイ設定
REM ============================================================
REM メインキャッチコピー（カット2開始1秒後〜カット4終了1秒前 に表示）
SET MAIN_TEXT=心の安らぐ料理が食べたい？

REM サブテキスト（カット3開始〜カット5終了まで）
SET SUB_TEXT=デリバリーサービスあります！

REM ブランド名（全カットを通して左上に常時表示）
SET BRAND_TEXT=シェーナ

REM 右下アノテーション（カット1: タイピング風に出現）
SET NOTE1=NEW OPEN 2025
SET NOTE2=LUNCH 11:00-14:00
SET NOTE3=DELIVERY OK

REM フォントパス（日本語対応フォントのパスを指定）
SET FONT_JP=C:/Windows/Fonts/YuGothB.ttc
SET FONT_EN=C:/Windows/Fonts/Arial.ttf
REM ※ 他の選択肢: meiryo.ttc / msgothic.ttc / NotoSansCJKjp-Bold.otf

REM ============================================================
REM  【C】カラー設定（ブランドカラー）
REM      FFmpeg drawbox/drawtext は 0xRRGGBB 形式
REM ============================================================
SET ACCENT=0xE95464
SET ACCENT_ALPHA=0xE9546480
SET BG_DARK=0x1A1A2E
SET WHITE=0xFFFFFF
SET WHITE_ALPHA=0xFFFFFFCC

REM ============================================================
REM  【D】トランジション設定
REM      種類: fade / wipeup / wipedown / slideleft / slideright
REM            zoomin / pixelize / dissolve / fadewhite / fadeblack
REM            radial / circleopen / circleclose / horzopen / horzclose
REM ============================================================
SET TRANS_1_2=wipeup
SET TRANS_2_3=zoomin
SET TRANS_3_4=dissolve
SET TRANS_4_5=slideleft

REM トランジション時間（秒）
SET TRANS_DUR=0.6

REM ============================================================
REM  【E】出力設定
REM ============================================================
SET OUTPUT=output_reels_%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%.mp4
SET FFMPEG=ffmpeg
SET LOG_LEVEL=warning

REM ============================================================
REM  【F】ランダムシード生成
REM      実行時刻（時×3600 + 分×60 + 秒 + センチ秒）を使用
REM      毎回わずかに異なる手振れ・グリッチ挙動を生成する
REM ============================================================
FOR /F "tokens=1-4 delims=:." %%a IN ("%TIME: =0%") DO (
    SET /A SEED=%%a*3600+%%b*60+%%c+%%d
)
REM シードから各パラメータを算出
SET /A SHAKE_AMP=(%SEED% %% 6) + 2
SET /A SHAKE_FREQ=(%SEED% %% 4) + 3
SET /A GLITCH_R=(%SEED% %% 5) + 2
SET /A GLITCH_B=(%SEED% %% 4) + 1
SET /A ZOOM_SPEED=(%SEED% %% 3) + 1
REM ZOOM_SPEED を小数に変換（1→001, 2→002, 3→003）
SET ZOOM_DELTA=00%ZOOM_SPEED%
SET ZOOM_DELTA=0.0!ZOOM_DELTA:~-1!

ECHO  シード値    : %SEED%
ECHO  手振れ強度  : %SHAKE_AMP%px  周波数: %SHAKE_FREQ%Hz
ECHO  グリッチR   : +%GLITCH_R%px  グリッチB: -%GLITCH_B%px
ECHO  ズーム速度  : %ZOOM_DELTA%/frame
ECHO.

REM ============================================================
REM  入力ファイル存在チェック
REM ============================================================
FOR %%F IN ("%CUT1%" "%CUT2%" "%CUT3%" "%CUT4%" "%CUT5%") DO (
    IF NOT EXIST %%F (
        ECHO [ERROR] 素材ファイルが見つかりません: %%F
        ECHO         SET CUTn= の設定を確認してください。
        PAUSE
        EXIT /B 1
    )
)

ECHO  素材ファイル確認: OK
ECHO  レンダリングを開始します...
ECHO.

REM ============================================================
REM  【G】FFmpeg 実行
REM      filter_complex の構造:
REM
REM      ① 各カットを 1080x1920 にスケール・トリミング
REM      ② カットごとに独自のエフェクトを適用
REM      ③ xfade でカット間トランジション
REM      ④ drawtext でテキストオーバーレイ
REM ============================================================
%FFMPEG% ^
  -i "%CUT1%" ^
  -i "%CUT2%" ^
  -i "%CUT3%" ^
  -i "%CUT4%" ^
  -i "%CUT5%" ^
  -filter_complex "

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ① 各カット共通: スケール + %CUT_DUR%秒トリミング
REM    force_original_aspect_ratio=increase でアスペクト維持して拡大
REM    crop=1080:1920 で 9:16 に切り出し
REM    fps=30 で出力フレームレートを統一
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [0:v] trim=duration=%CUT_DUR%, setpts=PTS-STARTPTS,
        scale=1080:1920:force_original_aspect_ratio=increase,
        crop=1080:1920, fps=30 [raw1];

  [1:v] trim=duration=%CUT_DUR%, setpts=PTS-STARTPTS,
        scale=1080:1920:force_original_aspect_ratio=increase,
        crop=1080:1920, fps=30 [raw2];

  [2:v] trim=duration=%CUT_DUR%, setpts=PTS-STARTPTS,
        scale=1080:1920:force_original_aspect_ratio=increase,
        crop=1080:1920, fps=30 [raw3];

  [3:v] trim=duration=%CUT_DUR%, setpts=PTS-STARTPTS,
        scale=1080:1920:force_original_aspect_ratio=increase,
        crop=1080:1920, fps=30 [raw4];

  [4:v] trim=duration=%CUT_DUR%, setpts=PTS-STARTPTS,
        scale=1080:1920:force_original_aspect_ratio=increase,
        crop=1080:1920, fps=30 [raw5];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ② カット1: ズームイン（中央から拡大）+ 暖色・明るい色調
REM
REM  zoompan フィルタ:
REM    z='min(zoom+%ZOOM_DELTA%,1.4)'
REM      → フレームごとに zoom 値を %ZOOM_DELTA% ずつ増加（最大1.4倍）
REM      → cubic ease に近い動きになるよう d（duration）と合わせて調整
REM    x='iw/2-(iw/zoom/2)'  → 常に画面中央を中心にズーム
REM    y='ih/2-(ih/zoom/2)'  → 同上（縦方向）
REM    d=150                  → 30fps × 5秒 = 150フレーム
REM    fps=30                 → 出力フレームレートを明示
REM
REM  curves フィルタ（暖色・明るさ補正）:
REM    r='0/0.05 0.5/0.65 1/1.0'  → 赤チャンネルをやや持ち上げ（暖色）
REM    g='0/0    0.5/0.52 1/0.96' → 緑チャンネルを微調整
REM    b='0/0    1/0.80'           → 青チャンネルをやや下げ（暖色強化）
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [raw1]
    zoompan=
      z='min(zoom+%ZOOM_DELTA%,1.4)':
      x='iw/2-(iw/zoom/2)':
      y='ih/2-(ih/zoom/2)':
      d=150:fps=30,
    curves=
      r='0/0.05 0.5/0.65 1/1.0':
      g='0/0    0.5/0.52 1/0.96':
      b='0/0    1/0.80'
  [fx1];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ② カット2: 左→右へのパン（カメラが右に流れる）+ モノクロ
REM
REM  zoompan フィルタ（パン）:
REM    z=1.3                       → 固定ズーム1.3倍（パン用に少し拡大）
REM    x='(iw-iw/zoom)*pow(t/T,2)' → quadratic ease-out で左→右にパン
REM      t = 現在の経過時間, T = 総時間（5秒）
REM      pow(t/T, 2) = 0→1 の二次曲線（加速して滑らかに止まる）
REM    y='ih/2-(ih/zoom/2)'        → 縦は常に中央固定
REM
REM  hue フィルタ（モノクロ化）:
REM    s=0 → 彩度を0にしてモノクロに
REM  curves フィルタ（コントラスト強調）:
REM    m='0/0 0.2/0.1 0.8/0.9 1/1' → S字カーブでモノクロのコントラストを強調
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [raw2]
    zoompan=
      z=1.3:
      x='(iw-iw/zoom)*pow(t/5,2)':
      y='ih/2-(ih/zoom/2)':
      d=150:fps=30,
    hue=s=0,
    curves=master='0/0 0.2/0.1 0.8/0.9 1/1'
  [fx2];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ② カット3: 手振れ（ランダムシード使用）+ グリッチ（RGB分離）
REM
REM  crop フィルタ（手振れシミュレーション）:
REM    幅・高さ: 元サイズから SHAKE_AMP*2 ぶん小さくして切り出し余白を作る
REM    x: SHAKE_AMP + sin(t * SHAKE_FREQ * 2π) * SHAKE_AMP
REM       → 毎フレーム正弦波でオフセットを変化（SHAKE_FREQ Hz の振動）
REM    y: SHAKE_AMP + cos(t * SHAKE_FREQ * 1.7 * 2π) * SHAKE_AMP / 2
REM       → 縦は横の半分の振幅で異なる周波数（自然な揺れに見せる）
REM    シード値 %SEED% によって毎回わずかに sin/cos の初期位相が変わる
REM  scale: 手振れで小さくなった分を元サイズに拡大
REM
REM  rgbashift フィルタ（グリッチ: RGB ずらし）:
REM    rh=%GLITCH_R%  → 赤チャンネルを縦方向に %GLITCH_R%px ずらす
REM    bh=-%GLITCH_B% → 青チャンネルを逆方向に %GLITCH_B%px ずらす
REM    rv/bv=0        → 横方向のずらしはなし（縦方向のみでデジタル感）
REM  ※ グリッチは常時適用だが振れ幅が小さいため「ちょうどよい質感」
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [raw3]
    crop=
      w=iw-%SHAKE_AMP%*2:
      h=ih-%SHAKE_AMP%*2:
      x='%SHAKE_AMP%+sin((t+%SEED%*0.01)*%SHAKE_FREQ%*2*PI)*%SHAKE_AMP%':
      y='%SHAKE_AMP%+cos((t+%SEED%*0.007)*%SHAKE_FREQ%*1.7*2*PI)*%SHAKE_AMP%/2',
    scale=1080:1920,
    rgbashift=
      rh=%GLITCH_R%:
      rv=0:
      bh=-%GLITCH_B%:
      bv=0
  [fx3];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ② カット4: ビネット（周辺光量落ち）+ 落ち着いた寒色
REM
REM  vignette フィルタ:
REM    angle=PI/5   → ビネットの角度（小さいほど強い周辺減光）
REM    mode=backward → フレームの端から中央に向かって暗くなる
REM
REM  curves フィルタ（シネマティック寒色）:
REM    r='0/0 0.5/0.45 1/0.90'  → 赤を下げてクール系に
REM    b='0/0.08 0.5/0.55 1/1'  → 青をやや持ち上げ（クール強化）
REM    g='0/0 0.5/0.50 1/0.95'  → 緑はほぼニュートラル
REM
REM  zoompan（ゆっくりズームアウト: 1.3→1.0）:
REM    z='1.3-0.06*t'  → 5秒かけて 1.3→1.0 に変化（ease なし・シンプル）
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [raw4]
    zoompan=
      z='max(1.0, 1.3-0.06*t)':
      x='iw/2-(iw/zoom/2)':
      y='ih/2-(ih/zoom/2)':
      d=150:fps=30,
    vignette=angle=PI/5:mode=backward,
    curves=
      r='0/0 0.5/0.45 1/0.90':
      g='0/0 0.5/0.50 1/0.95':
      b='0/0.08 0.5/0.55 1/1'
  [fx4];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ② カット5: 下から上への縦パン + ライト＆高彩度（エンディング演出）
REM
REM  zoompan（下→上パン + cubic ease-out）:
REM    z=1.25                              → 固定ズーム1.25倍
REM    x='iw/2-(iw/zoom/2)'               → 横は中央固定
REM    y='(ih-ih/zoom)*(1-pow(1-t/T,3))'  → cubic ease-out で下→上パン
REM       pow(1-t/T, 3) = 1→0 で急激に減速しながら上に流れる
REM
REM  eq フィルタ（明るさ・彩度・コントラスト強化）:
REM    brightness=0.08  → わずかに明るく（エンディングらしく）
REM    saturation=1.4   → 彩度 1.4倍（鮮やかに）
REM    contrast=1.1     → コントラストを少し強く
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [raw5]
    zoompan=
      z=1.25:
      x='iw/2-(iw/zoom/2)':
      y='(ih-ih/zoom)*(1-pow(1-t/5,3))':
      d=150:fps=30,
    eq=brightness=0.08:saturation=1.4:contrast=1.1
  [fx5];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ③ カット間トランジション（xfade フィルタ）
REM
REM  xfade の各パラメータ:
REM    transition = トランジション種類（D に設定したもの）
REM    duration   = トランジション時間（秒）
REM    offset     = 「前のカットの開始から何秒後にトランジション開始か」
REM
REM  offset 計算式（カット長5秒、トランジション0.6秒の場合）:
REM    カット1→2 のトランジション開始 = 5.0 - 0.6 = 4.4秒
REM    カット2→3 = 4.4 + 5.0 - 0.6 = 8.8秒  ※ 累積で計算
REM    カット3→4 = 8.8 + 5.0 - 0.6 = 13.2秒
REM    カット4→5 = 13.2 + 5.0 - 0.6 = 17.6秒
REM
REM  ライトリーク風: wipeup + fadewhite の組み合わせで
REM                  「一瞬白く飛ぶ」感覚に近づける
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  REM --- カット1→2: wipeup（下から上に拭き取り）---
  [fx1][fx2]
    xfade=transition=%TRANS_1_2%:duration=%TRANS_DUR%:offset=4.4
  [t12];

  REM --- カット2→3: zoomin（次のカットがズームインで出現）---
  [t12][fx3]
    xfade=transition=%TRANS_2_3%:duration=%TRANS_DUR%:offset=8.8
  [t123];

  REM --- カット3→4: dissolve（ソフトにディゾルブ）---
  [t123][fx4]
    xfade=transition=%TRANS_3_4%:duration=%TRANS_DUR%:offset=13.2
  [t1234];

  REM --- カット4→5: slideleft（左にスライドして次のカットが現れる）---
  [t1234][fx5]
    xfade=transition=%TRANS_4_5%:duration=%TRANS_DUR%:offset=17.6
  [joined];

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM ④ テキストオーバーレイ
REM
REM  【描画順序の重要性】
REM    drawtext は後から描いたものが上に重なる
REM    ブランド < アノテーション < サブテキスト < メインテキスト の順
REM
REM  【enable='between(t,...)'】
REM    enable='between(t, 開始秒, 終了秒)'
REM    カット2開始1秒後（6.0秒）〜カット4終了1秒前（17.4秒）に表示
REM    ※ トランジション時間を考慮して秒数を調整すること
REM
REM  【alpha='if(...)' でフェードイン/フェードアウト】
REM    alpha='if(lt(t, 開始+1), (t-開始)/1, if(gt(t, 終了-1), (終了-t)/1, 1))'
REM    → 開始1秒でフェードイン、終了1秒前からフェードアウト
REM
REM  【タイピング風アノテーション: text_shaping=1 + 時間でクリップ】
REM    text='%NOTE1%' に対し enable='gte(t, 0)' を各文字分ずらして重ねる
REM    ※ 完全なタイピングは複数 drawtext で1文字ずつ制御が必要
REM    ここでは「出現タイミングのずれ」で近似する
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [joined]

  REM ── ブランド名（全体を通して左上に常時表示、控えめなサイズ）──
  drawtext=
    fontfile='%FONT_JP%':
    text='%BRAND_TEXT%':
    fontsize=32:
    fontcolor=%WHITE_ALPHA%:
    x=48:y=72:
    shadowcolor=black@0.5:shadowx=1:shadowy=1,

  REM ── 右下アノテーション1（カット1: 0〜5秒, タイピング風出現）──
  drawtext=
    fontfile='%FONT_EN%':
    text='%NOTE1%':
    fontsize=22:
    fontcolor=%ACCENT%@0.9:
    x=w-tw-40:y=h-96:
    enable='between(t,0.3,4.8)':
    alpha='if(lt(t,1.3),(t-0.3)/1.0,1)':
    box=1:boxcolor=black@0.4:boxborderw=6,

  REM ── 右下アノテーション2（カット2: 5〜9.8秒）──
  drawtext=
    fontfile='%FONT_EN%':
    text='%NOTE2%':
    fontsize=22:
    fontcolor=%ACCENT%@0.9:
    x=w-tw-40:y=h-96:
    enable='between(t,5.5,9.8)':
    alpha='if(lt(t,6.5),(t-5.5)/1.0,if(gt(t,9.0),(9.8-t)/0.8,1))':
    box=1:boxcolor=black@0.4:boxborderw=6,

  REM ── 右下アノテーション3（カット3: 9.8〜14.6秒）──
  drawtext=
    fontfile='%FONT_EN%':
    text='%NOTE3%':
    fontsize=22:
    fontcolor=%ACCENT%@0.9:
    x=w-tw-40:y=h-96:
    enable='between(t,10.2,14.5)':
    alpha='if(lt(t,11.2),(t-10.2)/1.0,if(gt(t,13.6),(14.5-t)/0.9,1))':
    box=1:boxcolor=black@0.4:boxborderw=6,

  REM ── サブテキスト（カット3開始〜カット5まで、スライドアップ + フェード）──
  REM    y の式: h-200 から h-260 に 0.8秒かけて上昇（ease-out）
  REM    cubic ease-out: y = start - move*(1-pow(1-(t-開始)/0.8, 3))*move
  drawtext=
    fontfile='%FONT_JP%':
    text='%SUB_TEXT%':
    fontsize=38:
    fontcolor=white@0.92:
    x='(w-tw)/2':
    y='if(lt(t,10.5), h-200-(60*(1-pow(1-(t-10.0)/0.8,3))), h-260)':
    enable='between(t,10.0,22.4)':
    alpha='if(lt(t,10.8),(t-10.0)/0.8,if(gt(t,21.6),(22.4-t)/0.8,1))':
    shadowcolor=black@0.7:shadowx=2:shadowy=2,

  REM ── メインテキスト（カット跨ぎ: カット2+1秒〜カット4終了-1秒）──
  REM    カットの切り替わりとあえてズレたタイミングで表示
  REM    y の式: カット2開始1秒後（6.0秒）から 0.7秒かけてスライドアップ
  REM    enable='between(t,6.0,17.4)' → トランジション中も表示が続く（意図的）
  drawtext=
    fontfile='%FONT_JP%':
    text='%MAIN_TEXT%':
    fontsize=58:
    fontcolor=white:
    x='(w-tw)/2':
    y='if(lt(t,6.7), h-380+(80*(1-pow(1-(t-6.0)/0.7,3))), h-380)':
    enable='between(t,6.0,17.4)':
    alpha='if(lt(t,6.7),(t-6.0)/0.7,if(gt(t,16.4),(17.4-t)/1.0,1))':
    shadowcolor=black@0.8:shadowx=3:shadowy=3

  [out]

" ^
  -map "[out]" ^
  -c:v libx264 ^
  -preset slow ^
  -crf 18 ^
  -profile:v high ^
  -level 4.2 ^
  -pix_fmt yuv420p ^
  -movflags +faststart ^
  -an ^
  -loglevel %LOG_LEVEL% ^
  -stats ^
  "%OUTPUT%"

REM ============================================================
REM  完了チェック
REM ============================================================
IF %ERRORLEVEL% EQU 0 (
    ECHO.
    ECHO ============================================================
    ECHO   完了！  出力ファイル: %OUTPUT%
    ECHO ============================================================
    ECHO.
    ECHO   次のステップ:
    ECHO    1. 出力動画を確認する
    ECHO    2. BGMを追加する場合は add_bgm.bat を実行
    ECHO    3. 別素材で試す場合は SET CUT1= 等を変更して再実行
    ECHO.
) ELSE (
    ECHO.
    ECHO [ERROR] レンダリングに失敗しました。
    ECHO  よくある原因:
    ECHO   - 入力素材が %CUT_DUR% 秒未満
    ECHO   - FONT_JP のパスが存在しない
    ECHO   - ffmpeg が PATH に通っていない
    ECHO   - rgbashift フィルタが FFmpeg ビルドに含まれていない
    ECHO.
    ECHO  -loglevel warning を -loglevel debug に変更して詳細を確認してください
)

PAUSE
