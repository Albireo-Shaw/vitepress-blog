# MP4 的 faststart 到底快在哪里

同一个 MP4，下载后双击马上能播，放到网页却要等一阵。兼容的编码已经有了，问题也可能出在播放器拿到音视频之前，先得找到索引。

## 把索引挪到前面

普通 MP4 的 `moov` 包含轨道信息和样本索引，`mdat` 放媒体数据。FFmpeg 默认写普通 MP4 时，往往先写媒体数据，等到结束才补上 `moov`。本地播放器能直接跳到文件末尾，顺序下载时则要等那一段数据到手。

```bash
ffmpeg -i input.mp4 -map 0 -c copy -movflags +faststart web.mp4
```

`+faststart` 在封装结束时再跑一遍，把 `moov` 挪到媒体数据之前，并修正相关的偏移。配合 `-c copy` 可以保留原编码。大文件重排仍要花时间，交付时省下的等待，有一部分是打包时先付掉了。

可以看 `ffprobe` 的容器跟踪输出，确认内容顺序。

```bash
ffprobe -v trace -i web.mp4 2>&1 | grep "parent:'root'"
```

关注顶层的 `moov` 是否出现在第一个 `mdat` 之前。HTTP 分段请求也可能让播放器提前拿到尾部索引，实际起播延迟还受网络条件和播放器缓冲策略影响。

## 如果输出是一条管道

`+faststart` 要在写完后回头重排，适合输出到可寻址文件。需要把 MP4 边生成边送进管道时，可以输出分片 MP4。

```bash
ffmpeg -i input.mp4 -map 0:V:0 -map '0:a:0?' -c copy \
  -movflags +empty_moov+frag_keyframe -f mp4 pipe:1
```

开头先写初始化信息，此后用 `moof` 和 `mdat` 成对描述和存放各个分片。这条命令按视频关键帧切分，沿用源文件既有的关键帧间隔。接收端也要支持分片 MP4。交付单个点播文件时，普通 MP4 加 `+faststart` 通常更兼容。 [FFmpeg 的 MP4 封装选项](https://ffmpeg.org/ffmpeg-formats.html#MOV_002fMPEG_002d4_002fISOMBFF-muxers)
