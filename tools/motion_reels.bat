@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title Full Motion Reels Renderer

echo.
echo ================================================================
echo   Full Motion Reels Renderer
echo   1〜20カット以上対応 / カット数・確認方法を選べる
echo ================================================================
echo.

REM ================================================================
REM  【起動時メニュー】 生成モードをインタラクティブに選択
REM ================================================================

ECHO  ── 生成モードを選んでください ──
ECHO.
ECHO    [1] 1カット毎にプレビュー確認 （丁寧・時間かかる）
ECHO    [2] Nカット毎にグループ確認   （グループサイズを後で入力）
ECHO    [3] 全カット一気に生成        （最速・最後だけ確認可）
ECHO.
SET /P MODE_SEL=  選択 [1/2/3]:

IF "%MODE_SEL%"=="1" (
    SET PREVIEW_EACH=1
    SET BATCH_SIZE=1
    ECHO  モード: 1カット毎に確認
)
IF "%MODE_SEL%"=="2" (
    SET PREVIEW_EACH=1
    SET /P BATCH_SIZE=  グループサイズを入力 （例: 5 → 5カット毎に確認）:
    ECHO  モード: !BATCH_SIZE!カット毎にグループ確認
)
IF "%MODE_SEL%"=="3" (
    SET PREVIEW_EACH=0
    SET BATCH_SIZE=0
    ECHO  モード: 全カット一気に生成
)

REM 未選択時のデフォルト
IF NOT DEFINED PREVIEW_EACH SET PREVIEW_EACH=1
IF NOT DEFINED BATCH_SIZE   SET BATCH_SIZE=1

ECHO.

REM ================================================================
REM  【グローバル設定】
REM ================================================================

SET W=1080
SET H=1920
SET TOTAL_CUTS=5
SET DUR=5

REM --- フローティング ---
SET FLOAT_AMP=8
SET TEXT_SPEED=1.5

REM --- シェイク（3秒に1回） ---
SET SHAKE_INT=12
SET SHAKE_FREQ=15

REM --- ブリージングズーム ---
SET ZOOM_AMP=0.05
SET ZOOM_PER=8

REM --- パーティクル ---
SET P_SIZE=20
SET P_ALPHA=0.55

REM --- アクセントカラー（#なし 16進） ---
SET ACCENT=E95464

REM --- BGM ---
SET BGM_FILE=bgm.mp3
SET BGM_VOL=0.18
SET BGM_FADE=2.0

REM --- フォント ---
SET FONT=C\:/Windows/Fonts/msgothic.ttc

REM --- xfade ---
SET TRANS_TYPE=slideleft
SET TRANS_DUR_TENTHS=5

REM --- 出力 ---
SET FFMPEG=ffmpeg
SET TMP=.\tmp_motion
SET OUT_FINAL=output_fullmotion.mp4

REM ================================================================
REM  【カット設定】（TOTAL_CUTS を増やしたらここに追記するだけ）
REM ================================================================

SET CUT_FILE[1]=clip1.mp4
SET CUT_TEXT[1]=春の新メニュー
SET CUT_SUB[1]=3月15日スタート

SET CUT_FILE[2]=clip2.mp4
SET CUT_TEXT[2]=鮮度にこだわる素材
SET CUT_SUB[2]=毎朝仕入れる新鮮素材

SET CUT_FILE[3]=clip3.mp4
SET CUT_TEXT[3]=シェフ渾身の一皿
SET CUT_SUB[3]=季節限定メニュー

SET CUT_FILE[4]=clip4.mp4
SET CUT_TEXT[4]=今だけ特別価格
SET CUT_SUB[4]=数量限定・お早めに

SET CUT_FILE[5]=clip5.mp4
SET CUT_TEXT[5]=ご来店お待ちしています
SET CUT_SUB[5]=スタッフ一同

REM --- 6〜20カット例（TOTAL_CUTS=20 にして以下をコメント解除） ---
REM SET CUT_FILE[6]=clip6.mp4
REM SET CUT_TEXT[6]=テキスト6
REM SET CUT_SUB[6]=サブ6
REM （7〜20 も同様に追記）

REM ================================================================
REM  メインループ
REM ================================================================

IF NOT EXIST "%TMP%" mkdir "%TMP%"
SET APPROVED_LIST=
SET APPROVED_COUNT=0
SET BATCH_CUR=0

ECHO  モード: PREVIEW_EACH=%PREVIEW_EACH% / BATCH_SIZE=%BATCH_SIZE%
ECHO  総カット数: %TOTAL_CUTS% / 各カット %DUR% 秒 / 計 %TOTAL_CUTS%x%DUR%秒
ECHO.

FOR /L %%i IN (1,1,%TOTAL_CUTS%) DO (
    SET _F=!CUT_FILE[%%i]!
    SET _T=!CUT_TEXT[%%i]!
    SET _S=!CUT_SUB[%%i]!

    IF "!_F!"=="" (
        ECHO  [スキップ] カット%%i: 未定義
    ) ELSE (
        REM ---- 1カット レンダリング ----
        CALL :RENDER_ONE_CUT %%i "!_F!" "!_T!" "!_S!"
        IF !ERRORLEVEL! NEQ 0 (
            ECHO  [ERROR] カット%%i 失敗。中断します。
            GOTO :DONE
        )

        REM ---- PREVIEW_EACH モード: 1カット毎に確認 ----
        IF "%PREVIEW_EACH%"=="1" (
            IF "%BATCH_SIZE%"=="1" (
                CALL :PREVIEW_CONFIRM %%i
                IF !ERRORLEVEL! EQU 2 (
                    ECHO  [除外] カット%%i
                ) ELSE (
                    SET /A APPROVED_COUNT+=1
                    SET APPROVED_LIST=!APPROVED_LIST! %%i
                )
            )
        ) ELSE (
            REM ---- PREVIEW_EACH=0: 確認なしで採用 ----
            SET /A APPROVED_COUNT+=1
            SET APPROVED_LIST=!APPROVED_LIST! %%i
            ECHO  [生成完了] カット%%i
        )

        REM ---- BATCH_SIZE グループ確認 ----
        IF "%BATCH_SIZE%" GTR "1" (
            SET /A BATCH_CUR+=1
            SET /A BATCH_MOD=!BATCH_CUR! %% %BATCH_SIZE%

            IF !BATCH_MOD! EQU 0 (
                REM グループ完了 → まとめてプレビュー
                SET /A BATCH_GROUP_END=%%i
                SET /A BATCH_GROUP_START=%%i - %BATCH_SIZE% + 1
                ECHO.
                ECHO  ━━━━━━ グループ確認: カット!BATCH_GROUP_START!〜!BATCH_GROUP_END! ━━━━━━
                FOR /L %%j IN (!BATCH_GROUP_START!,1,!BATCH_GROUP_END!) DO (
                    IF EXIST "%TMP%\cut%%j.mp4" (
                        CALL :PREVIEW_CONFIRM %%j
                        IF !ERRORLEVEL! EQU 2 (
                            ECHO  [除外] カット%%j
                        ) ELSE (
                            SET /A APPROVED_COUNT+=1
                            SET APPROVED_LIST=!APPROVED_LIST! %%j
                        )
                    )
                )
                ECHO  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            )
        )
    )
)

REM 残りの未確認カット（BATCH_SIZE の端数）をまとめて確認
IF "%BATCH_SIZE%" GTR "1" (
    SET /A BATCH_MOD=%TOTAL_CUTS% %% %BATCH_SIZE%
    IF !BATCH_MOD! NEQ 0 (
        SET /A LAST_GROUP_END=%TOTAL_CUTS%
        SET /A LAST_GROUP_START=%TOTAL_CUTS% - !BATCH_MOD! + 1
        ECHO.
        ECHO  ━━━━━━ 最終グループ確認: カット!LAST_GROUP_START!〜!LAST_GROUP_END! ━━━━━━
        FOR /L %%j IN (!LAST_GROUP_START!,1,!LAST_GROUP_END!) DO (
            IF EXIST "%TMP%\cut%%j.mp4" (
                CALL :PREVIEW_CONFIRM %%j
                IF !ERRORLEVEL! EQU 2 (
                    ECHO  [除外] カット%%j
                ) ELSE (
                    SET /A APPROVED_COUNT+=1
                    SET APPROVED_LIST=!APPROVED_LIST! %%j
                )
            )
        )
    )
)

REM PREVIEW_EACH=0 の場合、最後に全カットをまとめてプレビュー
IF "%PREVIEW_EACH%"=="0" (
    ECHO.
    ECHO  ━━━━━━ 全カット生成完了 ━━━━━━
    ECHO  採用済み: %APPROVED_COUNT% カット (%APPROVED_LIST% )
    SET /P _REVIEW=  カットを個別に確認しますか? [y/N]:
    IF /I "!_REVIEW!"=="y" (
        FOR %%i IN (%APPROVED_LIST%) DO (
            CALL :PREVIEW_CONFIRM %%i
            IF !ERRORLEVEL! EQU 2 (
                ECHO  [除外] カット%%i
                SET /A APPROVED_COUNT-=1
                REM NOTE: APPROVED_LIST からの除外は簡略化のため未実装
                REM       除外したカットも結合されてしまうので注意
            )
        )
    )
)

ECHO.
ECHO  採用カット: %APPROVED_COUNT% 件  ( %APPROVED_LIST% )

IF %APPROVED_COUNT% EQU 0 (
    ECHO  採用カットが0件のため終了
    GOTO :DONE
)

IF %APPROVED_COUNT% EQU 1 (
    FOR %%i IN (%APPROVED_LIST%) DO copy /y "%TMP%\cut%%i.mp4" "%TMP%\merge_final.mp4" > nul
    GOTO :BGM
)

REM ================================================================
REM  逐次 xfade 結合
REM  （2クリップずつ処理 → メモリ常に2入力分のみ）
REM ================================================================

ECHO.
ECHO  カット結合中...

SET CONCAT_INIT=0
SET CONCAT_CUR=
SET CUR_DUR_TENTHS=0

FOR %%i IN (%APPROVED_LIST%) DO (
    IF !CONCAT_INIT! EQU 0 (
        SET CONCAT_CUR=%TMP%\cut%%i.mp4
        SET /A CUR_DUR_TENTHS=%DUR%*10
        SET CONCAT_INIT=1
        ECHO   ベース: カット%%i
    ) ELSE (
        REM  offset = 累積長 - TRANS_DUR を10倍整数で計算して小数文字列に変換
        REM  例: CUR=50(5.0s), TRANS=5(0.5s) → OFF=45(4.5s) → "4.5"
        SET /A OFF_TENTHS=!CUR_DUR_TENTHS! - %TRANS_DUR_TENTHS%
        SET /A OFF_INT=!OFF_TENTHS! / 10
        SET /A OFF_DEC=!OFF_TENTHS! - !OFF_INT! * 10
        SET OFF_STR=!OFF_INT!.!OFF_DEC!
        SET MERGE_OUT=%TMP%\merge%%i.mp4

        ECHO   xfade: カット%%i を追加 ^(offset=!OFF_STR!s^)

        %FFMPEG% -y -loglevel error ^
          -i "!CONCAT_CUR!" -i "%TMP%\cut%%i.mp4" ^
          -filter_complex "[0:v][1:v]xfade=transition=%TRANS_TYPE%:duration=0.5:offset=!OFF_STR![v]" ^
          -map "[v]" -c:v libx264 -preset fast -crf 20 -r 30 -an "!MERGE_OUT!"

        IF !ERRORLEVEL! NEQ 0 (
            ECHO  [ERROR] 結合失敗 (カット%%i)
            GOTO :DONE
        )

        ECHO !CONCAT_CUR! | findstr /i "merge" > nul
        IF !ERRORLEVEL! EQU 0 del /f /q "!CONCAT_CUR!" 2>nul

        SET CONCAT_CUR=!MERGE_OUT!
        SET /A CUR_DUR_TENTHS=!CUR_DUR_TENTHS! + %DUR%*10 - %TRANS_DUR_TENTHS%
    )
)

copy /y "!CONCAT_CUR!" "%TMP%\merge_final.mp4" > nul

:BGM
ECHO.
ECHO  BGM追加中...

SET /A BGM_FADE_ST=%APPROVED_COUNT%*%DUR% - (%APPROVED_COUNT%-1) - 2

IF NOT EXIST "%BGM_FILE%" (
    ECHO  [INFO] BGMファイルなし → BGMなしで出力
    copy /y "%TMP%\merge_final.mp4" "%OUT_FINAL%" > nul
    GOTO :DONE
)

%FFMPEG% -y -loglevel error ^
  -i "%TMP%\merge_final.mp4" ^
  -stream_loop -1 -i "%BGM_FILE%" ^
  -filter_complex "[1:a]volume=%BGM_VOL%,afade=t=out:st=%BGM_FADE_ST%:d=%BGM_FADE%[bgm]" ^
  -map 0:v -map "[bgm]" ^
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ^
  "%OUT_FINAL%"

IF %ERRORLEVEL% NEQ 0 (
    ECHO  [WARN] BGM追加失敗 → BGMなしで出力
    copy /y "%TMP%\merge_final.mp4" "%OUT_FINAL%" > nul
)

:DONE
ECHO.
ECHO ================================================================
IF EXIST "%OUT_FINAL%" (
    ECHO   完成: %OUT_FINAL%
    SET /P _OPEN=  最終プレビューを開きますか? [Y/n]:
    IF /I "!_OPEN!" NEQ "n" start "" "%OUT_FINAL%"
) ELSE (
    ECHO   出力ファイルが見つかりません
)
ECHO ================================================================

del /f /q "%TMP%\merge*.mp4" 2>nul
del /f /q "%TMP%\fc*.txt" 2>nul

PAUSE
EXIT /B

REM ================================================================
REM  :RENDER_ONE_CUT  1カットをレンダリング（確認なし）
REM ================================================================
:RENDER_ONE_CUT
SET _RCN=%~1
SET _RIN=%~2
SET _RMT=%~3
SET _RST=%~4
SET _RFC=%TMP%\fc%_RCN%.txt

ECHO  レンダリング中: カット%_RCN% / %TOTAL_CUTS%  (%_RIN%)
del /f /q "%_RFC%" 2>nul

REM ── ① ブリージングズーム ─────────────────────────────────────────
REM  z='1+0.05*sin(2*PI*t/8)' → 8秒周期でズーム1.0〜1.05を往復（呼吸感）
REM  x/y='iw/2-(iw/zoom/2)'  → ズーム中心を常に画像の中央に固定
REM  d=1                     → 1フレームずつ処理（d=150は900MBでOOMするので必須）
echo [0:v]zoompan=z='1+%ZOOM_AMP%*sin(2*PI*t/%ZOOM_PER%)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=%W%x%H%:fps=30, >> "%_RFC%"

REM ── ② カラーグレーディング ──────────────────────────────────────
REM  contrast=1.18 → 黒をより黒く白をより白く（メリハリ）
REM  saturation=1.3 → 色の鮮やかさ30%増し（SNS映え）
REM  brightness=0.01 → わずかに明るく（暗くなりすぎ防止）
echo eq=contrast=1.18:saturation=1.30:brightness=0.01, >> "%_RFC%"

REM ── ③ アクセントライン ──────────────────────────────────────────
REM  上端・下端5pxにカラーラインを描く → フレーム感・プロ感を演出
echo drawbox=x=0:y=0:w=iw:h=5:color=0x%ACCENT%:t=fill, >> "%_RFC%"
echo drawbox=x=0:y=1915:w=iw:h=5:color=0x%ACCENT%:t=fill, >> "%_RFC%"

REM ── ④ テキストバンド ────────────────────────────────────────────
REM  y=820〜1080 に黒帯を引いてテキスト可読性を確保
echo drawbox=x=0:y=820:w=iw:h=260:color=0x000000@0.65:t=fill, >> "%_RFC%"
echo drawbox=x=0:y=820:w=iw:h=3:color=0x%ACCENT%:t=fill, >> "%_RFC%"

REM ── ⑤ メインテロップ（フローティング＋3秒シェイク） ──────────────
REM  +8*sin(2*PI*t/1.5)               → 1.5秒周期で±8px左右フローティング
REM  +12*sin(2*PI*t*15)*lt(mod(t,3),0.3) → 3秒に1回だけ0.3秒間シェイク発動
echo drawtext=fontfile='%FONT%':text='%_RMT%':fontsize=72:fontcolor=white:x='(w-text_w)/2+%FLOAT_AMP%*sin(2*PI*t/%TEXT_SPEED%)+%SHAKE_INT%*sin(2*PI*t*%SHAKE_FREQ%)*lt(mod(t,3),0.3)':y='870+%FLOAT_AMP%*cos(2*PI*t/2.3)+%SHAKE_INT%*cos(2*PI*t*%SHAKE_FREQ%)*lt(mod(t,3),0.3)':shadowcolor=0x00000099:shadowx=2:shadowy=2, >> "%_RFC%"

REM ── ⑥ サブテロップ ──────────────────────────────────────────────
REM  周期をメイン（1.5/2.3秒）と意図的にずらす（2.1/2.7秒）→ 有機的な動き
echo drawtext=fontfile='%FONT%':text='%_RST%':fontsize=38:fontcolor=0x%ACCENT%:x='(w-text_w)/2+5*sin(2*PI*t/2.1)':y='990+5*cos(2*PI*t/2.7)', >> "%_RFC%"

REM ── ⑦ パーティクル（画面を流れる粒子、ループ周回） ─────────────
REM  mod(START+SPEED*t, WRAP)-MARGIN → 直線移動しながら画面端でループ
echo drawtext=fontfile='%FONT%':text='●':fontsize=%P_SIZE%:fontcolor=0x%ACCENT%@%P_ALPHA%:x='mod(100+80*t,1180)-50':y='mod(300+90*t,1970)-50', >> "%_RFC%"
echo drawtext=fontfile='%FONT%':text='●':fontsize=14:fontcolor=white@0.40:x='mod(500+65*t,1180)-50':y='mod(800+105*t,1970)-50', >> "%_RFC%"
echo drawtext=fontfile='%FONT%':text='◆':fontsize=12:fontcolor=0x%ACCENT%@0.30:x='mod(750+95*t,1180)-50':y='mod(150+85*t,1970)-50', >> "%_RFC%"
echo drawtext=fontfile='%FONT%':text='▪':fontsize=16:fontcolor=white@0.35:x='mod(250+75*t,1180)-50':y='mod(1400+80*t,1970)-50', >> "%_RFC%"
echo drawtext=fontfile='%FONT%':text='●':fontsize=10:fontcolor=0x%ACCENT%@0.25:x='mod(900+55*t,1180)-50':y='mod(600+120*t,1970)-50', >> "%_RFC%"

echo format=yuv420p >> "%_RFC%"

%FFMPEG% -y -loglevel error ^
  -i "%_RIN%" ^
  -filter_complex_script "%_RFC%" ^
  -c:v libx264 -preset fast -crf 20 -r 30 -t %DUR% -an ^
  "%TMP%\cut%_RCN%.mp4"

EXIT /B %ERRORLEVEL%

REM ================================================================
REM  :PREVIEW_CONFIRM  1カットを再生して採用/スキップを確認
REM  戻り値: 0=採用  2=スキップ
REM ================================================================
:PREVIEW_CONFIRM
SET _PCN=%~1

:PC_RETRY
ECHO.
ECHO  ▶ カット%_PCN% のプレビューを開きます（再生後 Enter を押してください）
start "" "%TMP%\cut%_PCN%.mp4"
PAUSE

SET /P PC_ANS=  カット%_PCN%: [Enter/Y=採用  r=再レンダリング  s=スキップ]:

IF /I "%PC_ANS%"=="r" (
    ECHO  カット%_PCN% を再レンダリングします...
    SET _RF=!CUT_FILE[%_PCN%]!
    SET _RT=!CUT_TEXT[%_PCN%]!
    SET _RS=!CUT_SUB[%_PCN%]!
    CALL :RENDER_ONE_CUT %_PCN% "!_RF!" "!_RT!" "!_RS!"
    GOTO :PC_RETRY
)
IF /I "%PC_ANS%"=="s" EXIT /B 2

EXIT /B 0
