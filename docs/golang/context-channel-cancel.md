# 接收方先走了，goroutine 怎么办

查询接口把结果一批批发给调用方。调用方读够三条，直接返回。请求确实结束了，发送第四条的 goroutine 还在等。

拿递增的整数模拟一下。原先的发送循环可以短到这个地步。

```go
for n := 1; ; n++ {
	out <- n
}
```

对无缓冲的 `out` 来说，没人接就不能往下走。给 channel 加个缓冲区，发送方能多走几步，缓冲区一满照样卡住。至于 HTTP 请求已经结束这件事，channel 并没有收到通知。

## 把退出条件放进发送操作

用 `select` 同时等一次发送机会和一次取消。下面的 `exited` 用来观察发送方是否真的退出，调用方在读够三条后不再碰 `out`。

```go
package main

import (
	"context"
	"fmt"
)

func generate(ctx context.Context, out chan<- int, exited chan<- struct{}) {
	defer close(exited)
	defer close(out)
	for n := 1; ; n++ {
		select {
		case out <- n:
		case <-ctx.Done():
			return
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	out := make(chan int)
	exited := make(chan struct{})
	go generate(ctx, out, exited)

	for n := range out {
		fmt.Println(n)
		if n == 3 {
			break
		}
	}
	cancel()
	<-exited
	fmt.Println("发送方已退出")
}
```

循环结束后，`out` 的发送分支没有接收方，`cancel()` 会让 `<-ctx.Done()` 就绪。发送方返回并关闭自己负责的 `out`。提前退出的接收方负责发出取消信号，如果顺手 `close(out)`，还在尝试发送的 goroutine 可能会收到一个颇为直接的回复，`send on closed channel`。[Go 并发流水线](https://go.dev/blog/pipelines)

## 还要看循环在别处会不会等

例子里的整数随手就能算出来。如果每条数据都要查库，发送前还会多一个可能阻塞的地方。把同一个 `ctx` 传给 `QueryContext` 或 `ExecContext`，同时留意驱动对取消的支持。若先调用一个完全不接收取消信号的长任务，后面的 `select` 要等它返回才有机会执行。[数据库操作的取消](https://go.dev/doc/database/cancel-operations)

在 HTTP handler 里，可以从 `r.Context()` 派生一个子 context，并在创建后用 `defer cancel()` 兜住各条返回分支。如果还要在函数内等待 goroutine 收尾，要像例子一样先取消、再等待。把等待放在取消前面，两边就都有充分的理由继续等下去了。
