# 给状态加一项，让漏改的 switch 报个错

任务列表给排队、执行、完成各留了一行文案。日后再加一个失败状态，如果 `switch` 的兜底统一显示「处理中」，失败的任务也会被归到处理中。界面很平静，倒是和任务的实际状况有些出入。

## 让每个状态带上自己的数据

```ts
type JobState =
  | { status: 'queued' }
  | { status: 'running'; progress: number }
  | { status: 'done'; outputUrl: string }

function unhandled(state: never): never {
  throw new Error(`Unhandled job state: ${JSON.stringify(state)}`)
}

function describe(state: JobState): string {
  switch (state.status) {
    case 'queued':
      return '排队中'
    case 'running':
      return `转码中，${state.progress}%`
    case 'done':
      return `已完成，${state.outputUrl}`
    default:
      return unhandled(state)
  }
}
```

`status` 是判别字段。进入 `running` 分支后，编译器知道 `progress` 存在，`outputUrl` 则只在 `done` 分支可用。所有分支都提前返回后，默认分支里已经没有可能的联合成员，`state` 被收窄成 `never`。[TypeScript 手册的穷尽检查](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)

## 改一次类型

把下面这一项添到 `JobState` 里，先别改 `describe`。

```ts
| { status: 'failed'; reason: string }
```

这次编译器会在 `unhandled(state)` 处报错，因为还有 `failed` 能走到这里。补上 `case 'failed': return state.reason` 后，错误才会消失。若库里还有几个同样写法的 `switch`，它们各自会交代新增状态怎么处理。

碰到接口版本不同、可能返回客户端不认识的状态时，可以在入口明确把它解析成 `{ status: 'unknown'; code: string }`，再给这个成员写一个分支。`never` 检查的是声明过的联合成员，外部数据仍要先看一眼。
