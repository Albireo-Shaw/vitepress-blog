# 帧率写着 30，帧却不一定等间隔

一段录屏在播放器里一切如常。导进按 `帧序号 / 30` 算时间的工具，字幕越往后越偏。播放器尊重时间戳，工具尊重除法。两边各有依据，只有字幕被夹在中间。

## 问问帧自己

```bash
ffprobe -v error -select_streams V:0 \
  -show_entries stream=avg_frame_rate,r_frame_rate,time_base -of json screen.mp4

ffprobe -v error -select_streams V:0 -show_frames \
  -show_entries frame=best_effort_timestamp_time -of csv=p=0 screen.mp4
```

`avg_frame_rate` 是平均帧率。`r_frame_rate` 是 FFmpeg 估算的基础帧率，可能足以表示时间戳使用的步长，无法凭它推出每一帧都踩在相邻的格子上。直接读相邻帧的时间差会清楚得多。

例如前几帧在 `0.000000`、`0.033333`、`0.100000` 秒，间隔约为 33 和 67 毫秒。帧序号只加了 1，实际时间跨过了两个 30 fps 的格子。排查时多看几段，容器时间基的取整也可能让恒定帧率出现一两个计时单位的抖动。 [FFmpeg 中的帧率字段](https://ffmpeg.org/doxygen/7.1/structAVStream.html)

## 下游要求恒定帧率

```bash
ffmpeg -i screen.mp4 -map 0:V:0 -map '0:a:0?' -vf fps=30 \
  -c:v libx264 -crf 20 -c:a aac screen-30.mp4
```

`fps=30` 按源帧的播放时间往 30 fps 的格子上放，必要时复制或丢掉帧。相邻画面相同是正常的。输出统一了播放间隔，缺失的运动细节依然缺失。给转码命令加上输入侧的 `-r 30` 则会按帧数重新生成输入时间戳，可能改掉原本的播放速度。

如果下游能读帧时间戳，直接用时间戳做字幕定位即可。决定交付 CFR 之后，再用上面的探针检查输出帧之间的间隔。 [FFmpeg 的 fps 滤镜](https://ffmpeg.org/ffmpeg-filters.html#fps)
