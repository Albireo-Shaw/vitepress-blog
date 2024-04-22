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
    ]
  },


]

export default index