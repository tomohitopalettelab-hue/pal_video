@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title Pal Video - BGM Mixer

echo.
echo ============================================================
echo   Pal Video  /  BGM ミキサー
echo   render_reels.bat の出力に BGM を追加します
echo ============================================================
echo.

REM ============================================================
REM  【設定】
REM ============================================================
SET VIDEO_IN=output_reels.mp4
SET BGM_IN=bgm.mp3
SET VIDEO_OUT=output_final.mp4
SET FFMPEG=ffmpeg

REM BGM音量（0.0〜1.0）
SET BGM_VOL=0.18

REM 動画終了時のBGMフェードアウト秒数
SET FADE_DUR=2.0

REM ============================================================
REM 動画の長さを取得（BGMフェードアウト開始点の計算用）
REM ============================================================
FOR /F "tokens=*" %%D IN ('
  %FFMPEG% -i "%VIDEO_IN%" 2^>^&1 ^| findstr "Duration"
') DO SET DURATION_LINE=%%D

ECHO  動画情報: %DURATION_LINE%
ECHO.

%FFMPEG% ^
  -i "%VIDEO_IN%" ^
  -stream_loop -1 -i "%BGM_IN%" ^
  -filter_complex "
    [1:a]
      volume=%BGM_VOL%,
      afade=t=out:st=21.0:d=%FADE_DUR%
    [bgm];
    [0:a][bgm] amix=inputs=2:duration=first:dropout_transition=3 [audio]
  " ^
  -map 0:v ^
  -map "[audio]" ^
  -c:v copy ^
  -c:a aac ^
  -b:a 192k ^
  -shortest ^
  -movflags +faststart ^
  "%VIDEO_OUT%"

IF %ERRORLEVEL% EQU 0 (
    ECHO.
    ECHO   完了！  出力ファイル: %VIDEO_OUT%
) ELSE (
    ECHO   [ERROR] BGM追加に失敗しました。
)
PAUSE
