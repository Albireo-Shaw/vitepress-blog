# Go 的 error 为什么明明是 nil，却过不了判断

看下面这个函数。配置存在时，`loadConfig` 返回 `nil`，调用方却进了错误分支。这里没有并发，也没有缓存。排查范围相当有限，直到看见返回类型。

```go
package main

import "fmt"

type ConfigError struct {
	Key string
}

func (e *ConfigError) Error() string {
	return "缺少配置 " + e.Key
}

func loadConfig(hasHost bool) *ConfigError {
	if !hasHost {
		return &ConfigError{Key: "host"}
	}
	return nil
}

func start(hasHost bool) error {
	return loadConfig(hasHost)
}

func main() {
	err := start(true)
	fmt.Println(err == nil) // false
	fmt.Printf("%T\n", err) // *main.ConfigError
}
```

## 一个 nil 带着类型进来了

`loadConfig(true)` 得到的是值为 `nil` 的 `*ConfigError`。`start` 的返回类型是 `error`，因此 Go 会把这个指针赋给一个接口值。此时接口的动态类型是 `*ConfigError`，动态值是 `nil`。只有两项都为空时，接口才等于 `nil`。

所以 `loadConfig(true) == nil` 为真，`start(true) == nil` 为假。直接调 `err.Error()`，方法里的 `e.Key` 会解引用空指针。类型认得很清楚，内容还是空的。

## 在返回接口的地方处理

如果 `loadConfig` 的调用方只需要判断成功或失败，可以直接让它返回 `error`。成功分支里的 `return nil` 就会产生一个真正的 `nil` 接口，失败时照样可以返回 `&ConfigError{Key: "host"}`。

如果 `loadConfig` 已经要给其他调用方提供具体类型，就在 `start` 里先检查指针，再完成接口转换。

```go
func start(hasHost bool) error {
	if err := loadConfig(hasHost); err != nil {
		return err
	}
	return nil
}
```

这里 `if` 内的 `err` 仍然是 `*ConfigError`，判断的正是指针有没有值。给错误加上下文的 `fmt.Errorf("启动失败: %w", err)` 也应该放在这个分支里。调用方继续写普通的 `if err != nil` 就够了。让每个调用方先查一遍动态类型，多少有点把维修手册当使用说明的意思。

类似的转换也会出现在 `io.Reader` 等接口上。排查时可以先用 `%T` 看动态类型，再找那个从具体指针返回接口的地方。Go FAQ 有一个同样简短的例子。[Go FAQ](https://go.dev/doc/faq#nil_error)
