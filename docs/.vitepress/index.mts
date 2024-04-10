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
    text: 'foo',
    items: [
      { text: 'bar', link: '/foo/bar' }
    ]
  }
]

export default index