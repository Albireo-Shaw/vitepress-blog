# 用 satisfies 检查配置，保留字段的推断

重试策略放在一张表里，上传任务用固定间隔，转码任务按第几次重试来算。表上加类型挺自然，直到调用方想单独使用其中一项。

```ts
type TaskKind = 'upload' | 'transcode'
type Backoff = number | ((attempt: number) => number)
type RetryPolicy = Record<TaskKind, Backoff>

const annotated: RetryPolicy = {
  upload: 500,
  transcode: attempt => 1000 * attempt,
}

// annotated.transcode(3) // TS2349，Backoff 里的 number 不能调用
```

`RetryPolicy` 允许任意一个任务改用固定间隔。变量声明成这个类型以后，`annotated.transcode` 就按 `Backoff` 来读，调用时还得判断它是不是函数。对于一张在源码里写定的表，调用方明明知道得更多。

## 把检查放到对象后面

```ts
const retry = {
  upload: 500,
  transcode: attempt => 1000 * attempt,
} satisfies RetryPolicy

retry.upload.toFixed(0) // '500'
retry.transcode(3)     // 3000
```

`satisfies` 会检查这份对象字面量是否符合 `RetryPolicy`。漏写 `upload`，或者把 `transcode` 拼成 `transocde`，错误都会留在配置这儿。检查完以后，`retry.upload` 仍然是 `number`，`retry.transcode` 仍然是函数。它的参数 `attempt` 也借了目标类型的上下文，推断为 `number`。

若把 `retry.transcode` 改成数字，下面那个调用点就过不了编译。配置改得动，调用方也得知道。省掉这一声招呼的办法，通常是把问题留给上线之后。

## 动态取值还是要判断

按一个联合类型的键去取，结果仍然可能是两种值。这时收窄就有实际意义了。

```ts
function delayFor(kind: TaskKind, attempt: number): number {
  const backoff = retry[kind]
  return typeof backoff === 'function' ? backoff(attempt) : backoff
}
```

这个操作符从 TypeScript 4.9 开始提供，适合检查源码里的注册表、配置对象和映射表。编译生成 JavaScript 时会擦除它，文件里读进来的配置仍需要运行时校验。[TypeScript 4.9 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
