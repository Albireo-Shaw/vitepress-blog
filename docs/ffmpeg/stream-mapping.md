# 用 `-map` 把音轨选明白

把双语文件换个容器，命令跑完，画面正常，声音也有。把菜单点开才发现，正片音轨没了，只剩导演在解释这场戏。

## 先看流的顺序

```bash
ffprobe -v error -show_entries stream=index,codec_type,codec_name:stream_tags=language,title \
  -of json lesson.mkv
```

假设查到的顺序是视频 `#0:0`、5.1 声道评论 `#0:1`、双声道正片 `#0:2`。执行 `ffmpeg -i lesson.mkv -c copy output.mkv` 时，`copy` 只规定入选的流怎么处理。常规自动选择会挑声道数最多的那条音轨。混得比较热闹的一方赢了。

要留正片，可以直接按索引选。

```bash
ffmpeg -i lesson.mkv -map 0:V:0 -map 0:2 -c copy main.mkv
```

- `0:V:0` 选第一个输入的第一条普通视频流。大写 `V` 会跳过附带的图片、封面和缩略图。
- `0:2` 是第一个输入的全局流索引 2。这个例子也能写成 `0:a:1`，即其中第二条音频流。
- `0:a` 会映射所有音轨。若只取第一条且允许它缺席，写成 `-map '0:a:0?'`。必需的流留着报错就好。

## 设定默认音轨也要用输出索引

两条都想留，可以把正片排在前面，再明确哪条默认播放。

```bash
ffmpeg -i lesson.mkv -map 0:V:0 -map 0:2 -map 0:1 -c copy \
  -disposition:a:0 +default -disposition:a:1 -default both.mkv
```

`-map` 按命令行顺序生成输出流。这里的 `-disposition:a:0` 作用于**输出**的第一条音轨，也就是输入的 `#0:2`。`+default` 和 `-default` 分别添加、移除默认标记，其他标记照旧。播放器仍然可以按自己的语言设置和用户选择播放。

批处理一批来源不同的文件时，最好先确认语言和标题再决定索引。音轨顺序属于文件内容，文件名对此通常守口如瓶。 [FFmpeg 流选择文档](https://ffmpeg.org/ffmpeg.html#Stream-selection)
