# 用 loudnorm 做两遍响度归一化

两集播客的最大峰值一样，连着放却要拧两次音量。峰值只记录最响的瞬间，和听众打交道的是完整的一集。

`loudnorm` 按 EBU R128 测量响度。这里拿 `-16 LUFS` 作整段目标，`-1.5 dBTP` 作真峰值上限，`7 LU` 作目标响度范围。目标值按发布要求选，三项各管一件事。

## 第一遍只测量

```bash
ffmpeg -hide_banner -nostats -i episode.wav -map 0:a:0 \
  -af 'loudnorm=I=-16:LRA=7:TP=-1.5:print_format=json' -f null -
```

输出丢给 null，统计 JSON 在标准错误里。记下 `input_i`、`input_lra`、`input_tp`、`input_thresh` 和 `target_offset`。第一遍也会列出 `output_i` 等结果，那是这一次滤镜处理后的读数。第二遍的素材还是原来的 `episode.wav`，于是要填的是前面那组 `input_*`。

## 第二遍写文件

下面是一组示例读数，运行时用上一遍测到的值替换。

```bash
ffmpeg -hide_banner -nostats -i episode.wav -map 0:a:0 \
  -af 'loudnorm=I=-16:LRA=7:TP=-1.5:measured_I=-18.53:measured_LRA=6.00:measured_TP=-13.98:measured_thresh=-28.53:offset=-1.82:linear=true:print_format=json' \
  -ar 48000 -c:a aac -b:a 128k episode-normalized.m4a
```

两次要选同一条音轨，使用相同的目标和前置处理。片头删掉以后，上一遍的测量就该重做。指定 `-ar 48000` 是为了固定交付采样率，动态模式内部会以 192 kHz 检测真峰值。

`linear=true` 是请求使用统一增益。如果目标响度范围小于素材的范围，或者统一增益会把真峰值推过上限，滤镜会回退到动态模式。以报告里的 `normalization_type` 为准，参数本人对此没有裁决权。需要严格验收时，用 `ffmpeg -i episode-normalized.m4a -af ebur128=peak=true -f null -` 复测编码后的成品。 [FFmpeg 的 loudnorm 滤镜](https://ffmpeg.org/ffmpeg-filters.html#loudnorm)
