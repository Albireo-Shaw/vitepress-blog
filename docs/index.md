---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "夜晚的潜水艇"
  text: "游弋在黑暗之海"
  tagline: "编程 · 乱想 · 读书 · 写作"
  actions:
    - theme: brand
      text: 技术文章
      link: /typescript/runtime-validation
    - theme: alt
      text: ChatGPT
      link: https://nextjs-chat-silk-chi.vercel.app/
  image:
    # src: https://resources.laihua.com/2024-4-10/9b8c7c60-f74a-11ee-86b9-0b4304a20114nail.png
    src: /jellyfish.png
    alt: VitePress

features:
  - icon: 💻
    title: 编程技术
    details: "十年coding，难凉热血。<br> 一个自由自在的程序员。<br> 杂七杂八，不甚精湛，也堪堪够用。"
  - icon: 💡
    title: 想入非非
    details: "非想非非想处。<br> 唯色受想行识。<br> 只想些如露如电，梦幻泡影。"
  - icon: 📖
    title: 也读点书
    details: "如你所见，<br> 小站标题，<br> 取自陈春成《夜晚的潜水艇》。"
  - icon: ✒️
    title: 写几个字
    details: "写一些免于审核和评判的文字。<br> 似是哪位作家说过，<br> 这是一场思想的裸奔。"
---

<style>
  :root {
    --vp-home-hero-name-color: transparent;
    --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #1c38c2 30%, #41d1ff);

    --vp-home-hero-image-background-image: linear-gradient(-45deg, #1c38c2 27%, #41d1ff 73%);
    --vp-home-hero-image-filter: blur(44px);
  }

  .image {
    display: none;
  }

  .dark {
    .image {
      display: block;
    }
  }

  @media (min-width: 640px) {
    :root {
      --vp-home-hero-image-filter: blur(56px);
    }
  }

  @media (min-width: 960px) {
    :root {
      --vp-home-hero-image-filter: blur(68px);
    }
  }
</style>

