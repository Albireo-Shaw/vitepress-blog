import { defineConfig } from 'vitepress'
import index from './index.mts'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "夜晚的潜水艇",
  description: "A VitePress Site",

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/public/favicon.ico' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    // logo: { src: '/public/apple-touch-icon.png',  width: 24, height: 24 },

    // sidebar: [
    //   {
    //     text: 'Examples',
    //     items: [
    //       { text: 'Markdown Examples', link: '/markdown-examples' },
    //       { text: 'Runtime API Examples', link: '/api-examples' }
    //     ]
    //   }
    // ],
    sidebar: index,

    footer: {
      message: '基于 MIT 许可发布，技术驱动：<a href="https://vitepress.dev/" target="_blank">Vitepress</a> / <a href="https://vercel.com/" target="_blank">Vercel</a>',
      copyright: `Copyleft © 2019-${new Date().getFullYear()} 版权所无`
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
