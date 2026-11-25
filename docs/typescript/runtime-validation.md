# 接口返回的 JSON，先别急着 as

转码接口返回一个任务 ID 和已重试次数。拿到响应后加一句 `as Job`，编辑器马上就能补全字段。可惜后端有一天把次数从数字改成了字符串，补全倒是还在。

```ts
type Job = { id: string; retries: number }

const job = JSON.parse('{"id":"video-42","retries":"2"}') as Job
console.log(job.retries.toFixed(0)) // TypeError
```

`JSON.parse` 只管这段文本是不是合法 JSON。`as Job` 告诉编译器按 `Job` 看待结果，编译后这句断言就消失了。字符串 `"2"` 从头到尾没有变过。[TypeScript 手册的类型断言](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

## 在入口处收下一个 unknown

标准库给 `JSON.parse` 的返回类型是 `any`，可以主动将结果接成 `unknown`。这样在读字段之前，代码得先交代它是怎么认出这个值的。这里用解析函数返回一个新对象，顺便把接口字段和业务里的字段对齐。

```ts
function parseJob(value: unknown): Job {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected a job object')
  }
  if (!('id' in value) || typeof value.id !== 'string' || value.id === '') {
    throw new TypeError('Expected a non-empty job id')
  }
  if (
    !('retries' in value) ||
    typeof value.retries !== 'number' ||
    !Number.isSafeInteger(value.retries) ||
    value.retries < 0
  ) {
    throw new TypeError('Expected a non-negative retry count')
  }

  return { id: value.id, retries: value.retries }
}

const raw: unknown = JSON.parse('{"id":"video-42","retries":2}')
const verified = parseJob(raw)
console.log(verified.retries.toFixed(0)) // 2
```

这份检查针对 JSON 解码后的数据。`typeof null` 也是 `'object'`，所以第一关得单独排除它。从 TypeScript 4.9 起，`'id' in value` 为真时，编译器允许读取这个原本还没有声明的字段。字段值是否合规，再靠 `typeof` 和后面的业务校验来判断。[TypeScript 4.9 的 in 收窄说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#unlisted-property-narrowing-with-the-in-operator)

如果协议确实允许 `"2"` 和 `2` 两种格式，可以在入口明确规定哪些字符串接受、怎么转。让业务代码拿到一种表示，省得每次读 `retries` 都重新猜协议。
