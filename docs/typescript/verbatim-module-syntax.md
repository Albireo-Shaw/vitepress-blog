# import type 以后，模块里的初始化还会跑吗

一个模块导出类型，也在加载时注册某个格式。主程序用上这个类型，顺手把导入改成 `import type`。类型检查通过，注册却一起没了。启动时少了一行输出，稍后往往会多一行错误。

```ts
// clip.ts
console.log('register: clip')
export type Clip = { filename: string }

// main.ts
import type { Clip } from './clip.js'

export function label(clip: Clip): string {
  return clip.filename
}
```

例子用 `tsc` 编译后在 Node.js 里跑。在 `package.json` 中设 `"type": "module"`，编译选项用下面这一组。TypeScript 源文件里的 `.js` 后缀指向将来生成的文件，Node 最终执行的也是那份输出。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "verbatimModuleSyntax": true,
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["clip.ts", "main.ts"]
}
```

`tsc` 会删掉整条 `import type`。这时跑 `node dist/main.js`，Node 的模块依赖里没有 `clip.js`，那行注册自然也不执行。`clip.js` 编译得好好的，只是没人来请。

## 把加载写出来

```ts
import './clip.js'
import type { Clip } from './clip.js'
```

前一行明确加载模块，后一行给类型检查器看。还有种相似的写法 `import { type Clip } from './clip.js'`。用这里的编译选项，它会留下 `import {} from './clip.js'`，在 Node 里依然会跑模块顶层代码。显式写副作用导入，读的人不用从一对空花括号里推断本意。

如果切到 CommonJS，`verbatimModuleSyntax` 不会再替你把 ESM 导入改写成 `require`。遇到模块格式冲突时报错，先核对 `package.json` 的 `type`、文件后缀和 `module` 配置。尤其在一个仓库混用两种格式时，同一句 `import` 落在不同文件里，结局可能不同。[TSConfig 的 verbatimModuleSyntax 说明](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html)
