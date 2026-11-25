# `-ss` 为什么没剪在那一帧

想从第 3.2 秒开始剪 1.2 秒视频，顺手加个 `-c copy`，文件几乎立刻就出来了。接下来花在确认开头画面上的时间，有时比转码还长。

## 看看输入从哪儿开始解码

```bash
ffmpeg -ss 3.2 -i input.mp4 -t 1.2 -map 0:V:0 -map '0:a:0?' -c copy copy.mp4
```

`-ss` 在 `-i` 前面，FFmpeg 会让解复用器先定位。多数视频只能先跳到目标之前的可寻址点，通常是关键帧。后续帧可能引用前面的画面，解码器得从有足够参考信息的位置起步。

如果上一处关键帧在第 2 秒，流复制可能把第 2 秒到第 3.2 秒之间的包也带过去。容器可以把这些包标在播放起点之前，供解码用。具体看到什么，取决于容器和播放器怎么处理这一段。仅看文件报告的时长，容易把这件事漏过去。

```bash
# 查看原片关键帧的位置
ffprobe -v error -select_streams V:0 -skip_frame nokey -show_frames \
  -show_entries frame=best_effort_timestamp_time -of csv=p=0 input.mp4

# 查看剪完后实际写进文件的视频包
ffprobe -v error -select_streams V:0 -show_packets \
  -show_entries packet=pts_time,dts_time,flags -of csv=p=0 copy.mp4
```

在一段每两秒一个关键帧的测试片上，后一条命令列出的第一个包 PTS 是 `-1.200000` 秒。输出的播放时间可以从零起算，包却已经提前等在那里了。

## 需要准点的时候

```bash
ffmpeg -ss 3.2 -i input.mp4 -t 1.2 -map 0:V:0 -map '0:a:0?' \
  -c:v libx264 -crf 20 -c:a aac exact.mp4
```

同样把 `-ss` 放在 `-i` 前面。转码时默认启用 `-accurate_seek`，从可寻址点开始解码，再丢掉目标时间前的内容。最细能剪到源视频已有的帧。指定了 3.201 秒，源文件也不会临时多出一帧来配合。

把 `-ss` 放到 `-i` 后面，也能在转码时先解码再丢帧，长文件可能多解一大段。保留原编码并且能接受按关键帧选切点时，流复制仍然省事。

[FFmpeg 手册中的 `-ss` 与 `-t`](https://ffmpeg.org/ffmpeg.html#Main-options)
