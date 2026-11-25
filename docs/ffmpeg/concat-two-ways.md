# 拼接视频的两种 concat

两段 MP4，扩展名一样，甚至都是 H.264 加 AAC。接起来播放，到交界处还是黑了一下，声音也迟到了半拍。扩展名在这件事上作证的能力有限。

## 同一批素材可以试流复制

把下面的清单存成 `parts.ffconcat`，和源文件放在同一目录。

```text
ffconcat version 1.0
file 'intro.mp4'
file 'main.mp4'
```

```bash
ffmpeg -f concat -i parts.ffconcat -map 0 -c copy merged.mp4
```

这个 `concat` 是解复用器，依次读取各文件的包，根据前一段的时长挪动后一段的时间戳。它要求每段的流布局、编码和时间基等参数匹配。用同一套参数分片出来的文件通常适合走这条路。音视频长度相差较大，或前一段的时长信息有误，接缝就可能出现空隙。排查时除了看 `codec_name`，记得比一下 `time_base`、分辨率、采样率和声道布局。 [concat 解复用器文档](https://ffmpeg.org/ffmpeg-formats.html#concat)

## 分辨率各有主见时

假设两段都是常见的方形像素视频，各有一路画面和一路音频。把画面规范到同一尺寸，把每段时间戳移到零，再交给 concat 滤镜。

```bash
ffmpeg -i intro.mp4 -i main.mp4 -filter_complex \
  "[0:v:0]scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,setpts=PTS-STARTPTS[v0]; \
   [1:v:0]scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,setpts=PTS-STARTPTS[v1]; \
   [0:a:0]aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0]; \
   [1:a:0]aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1]; \
   [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
  -map '[v]' -map '[a]' -c:v libx264 -pix_fmt yuv420p -c:a aac merged.mp4
```

这里的顺序是第 0 段画面和声音，然后第 1 段画面和声音。滤镜要求每段提供同样数量的流。某一段无声，要为那一段补一条等长的静音轨，或者把整个输出做成无声视频。把每段画面和声音一起接，滤镜就能在最后一段之前用静音补齐偏短的音轨。一段内部已经错位的音画则需要先校准。 [concat 滤镜文档](https://ffmpeg.org/ffmpeg-filters.html#concat)
