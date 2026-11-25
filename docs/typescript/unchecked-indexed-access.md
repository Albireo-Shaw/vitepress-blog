# Record 声明了值的类型，键仍然可能查不到

把任务按 ID 放进对象，写成 `Record<string, Task>` 很顺手。顺手到 TypeScript 甚至相信每个字符串都查得出一条任务。

```ts
type Task = { filename: string }

const tasks: Record<string, Task> = {
  'job-42': { filename: 'intro.mp4' },
}

// 只开 strict 时这行通过类型检查，执行时抛 TypeError。
// tasks['job-43'].filename
```

字典接受任意字符串做键，内存里却只有一条记录。把一个已经被清理的 ID 填进去，查到的是 `undefined`。类型检查通过，并不会让任务起死回生。

## 让索引读取带上 undefined

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

开启后，`tasks[id]` 的类型变成 `Task | undefined`。先把查找结果存下，再处理缺失。若 ID 来自外部输入，也可以用 `Map<string, Task>` 存储，`get` 本身就返回 `Task | undefined`，同时省去普通对象原型链上的同名键。

```ts
function filenameFor(id: string): string | undefined {
  const task = tasks[id]
  return task?.filename
}
```

键的范围如果是有限的，可以在声明时直接写出来。下面的表少写一个键就会报错，调用方传入的是 `Stage` 时，取值也就无需加上 `undefined`。

```ts
type Stage = 'queued' | 'done'

const captions: Record<Stage, string> = {
  queued: '等待中',
  done: '已完成',
}

function captionFor(stage: Stage): string {
  return captions[stage]
}
```

数组下标也受这个选项影响。`files[0]` 对 `string[]` 来说可能读不到值。若调用方确实承诺至少传一个元素，可以把参数写成 `readonly [string, ...string[]]`，并在文件列表的来源处确认它非空。这样第一个元素有了静态依据，也省得用 `files[0]!` 先批准一个尚未到场的文件。[TypeScript 4.1 的索引访问检查说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#checked-indexed-accesses---nouncheckedindexedaccess)
