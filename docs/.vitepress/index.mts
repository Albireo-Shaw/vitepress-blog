import { type DefaultTheme } from 'vitepress'

const index: DefaultTheme.SidebarItem[] = [
  {
    text: '示例文章',
    items: [
        { text: 'Markdown Examples', link: '/markdown-examples' },
        { text: 'Runtime API Examples', link: '/api-examples' }
    ]
  },
  
  {
    text: 'Go',
    items: [
      { text: '一些记录', link: '/golang/some-little-tips' },
      { text: '代理问题', link: '/golang/proxy' },
      { text: '内存哲学', link: '/golang/quote-shared-memory' },
      { text: 'Gin JWT实现', link: '/golang/gin-jwt'},
      { text: 'error 接口里的 nil', link: '/golang/typed-nil-error' },
      { text: '接收方提前退出与 goroutine 取消', link: '/golang/context-channel-cancel' }
    ]
  },
  {
    text: 'TypeScript',
    collapsed: false,
    items: [
      { text: '类型断言与运行时校验', link: '/typescript/runtime-validation' },
      { text: '用 satisfies 检查配置', link: '/typescript/satisfies' },
      { text: '可选属性与 undefined', link: '/typescript/exact-optional-properties' },
      { text: '可辨识联合的穷尽检查', link: '/typescript/exhaustive-unions' },
      { text: 'import type 与模块副作用', link: '/typescript/verbatim-module-syntax' },
      { text: '下标访问与 undefined', link: '/typescript/unchecked-indexed-access' }
    ]
  },
  {
    text: 'PostgreSQL',
    collapsed: false,
    items: [
      { text: 'NOT IN 遇到 NULL', link: '/postgresql/not-in-null' },
      { text: 'LEFT JOIN 的过滤条件', link: '/postgresql/left-join-filter' },
      { text: 'UPSERT 与 RETURNING', link: '/postgresql/upsert-returning' },
      { text: '按本地日期查 timestamptz', link: '/postgresql/timestamptz-day-range' },
      { text: '用时间戳和 ID 做游标分页', link: '/postgresql/keyset-pagination' },
      { text: 'CREATE INDEX CONCURRENTLY', link: '/postgresql/create-index-concurrently' }
    ]
  },
  {
    text: 'FFmpeg',
    collapsed: false,
    items: [
      { text: '剪切位置与关键帧', link: '/ffmpeg/seek-and-keyframes' },
      { text: '用 -map 选择音轨', link: '/ffmpeg/stream-mapping' },
      { text: '拼接视频的两种 concat', link: '/ffmpeg/concat-two-ways' },
      { text: '可变帧率与帧时间戳', link: '/ffmpeg/variable-frame-rate' },
      { text: '两遍 loudnorm 响度归一化', link: '/ffmpeg/loudnorm-two-pass' },
      { text: 'MP4 的 faststart', link: '/ffmpeg/mp4-faststart' }
    ]
  }
]

export default index
