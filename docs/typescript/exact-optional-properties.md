# 可选字段省略了，和传 undefined 有什么区别

做资料更新时，`displayName` 缺席表示保留原值，传 `null` 表示清空，传字符串则覆盖。用对象展开做合并很方便，只是 JavaScript 还允许第四种写法。

```ts
type Profile = {
  displayName: string | null
  timezone: string
}

type ProfilePatch = Partial<Profile>

const current: Profile = { displayName: '访客', timezone: 'Asia/Shanghai' }
const noTimezone = {}
const undefinedTimezone = { timezone: undefined }
const absent = { ...current, ...noTimezone }
const overwritten = { ...current, ...undefinedTimezone }

console.log(absent.timezone)      // Asia/Shanghai
console.log(overwritten.timezone) // undefined
```

单独读两个补丁的 `timezone`，JavaScript 都会给出 `undefined`。展开时它倒是分得很清。后一个补丁持有自己的 `timezone`，展开就会把原值盖掉。

默认情况下，即使已经开了 `strict`，`const patch: ProfilePatch = { timezone: undefined }` 也能通过检查。如果把它传进一个用对象展开合并的函数，调用方拿到的值和函数签名就可能各过各的日子。

## 把写入的约束打开

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true
  }
}
```

有了这个选项，`timezone?: string` 可以省略，存在时必须写字符串。若确实允许显式传 `undefined`，就写成 `timezone?: string | undefined`。读取可选字段仍要考虑它缺席，因此 `patch.timezone` 的类型还是 `string | undefined`。[TypeScript TSConfig 文档](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html)

```ts
function applyPatch(profile: Profile, patch: ProfilePatch): Profile {
  return { ...profile, ...patch }
}

applyPatch(current, {})                          // 保留所有字段
applyPatch(current, { displayName: null })        // 清空昵称
applyPatch(current, { timezone: 'Asia/Tokyo' })   // 更新时区
// applyPatch(current, { timezone: undefined })   // 开启选项后报错
```

顺手留个心眼，`JSON.stringify({ timezone: undefined })` 的结果是 `'{}'`。序列化以后看不见这个键，在序列化前展开补丁时它已经足够忙了。要保留「清空」这个动作，得在接口里给它一个能穿过 JSON 的值，比如这里的 `null`。
