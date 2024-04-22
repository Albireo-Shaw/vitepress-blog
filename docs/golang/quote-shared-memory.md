## 名句
知名的菜鸟入门库`rsc.io/quote`中有一个`go`方法，它输出一句名言：
``` 
Don't communicate by sharing memory, share memory by communicating
```

一开始我以为是什么人生警句，将之理解为：不要通过分享记忆来（与人）沟通，而是在沟通中（与人）分享记忆。

嗯，不明觉厉。

后来才知道这是Golang针对并发编程的一个通行哲学。它源自 Go 语言的设计者之一 Rob Pike 的名言。

## 专业解释

要理解这句话的含义，我们需要看看传统的并发编程模型和 Go 语言的并发模型之间的区别：

1. **传统并发模型（共享内存）**：
   在传统的并发编程模型中，如使用线程的编程语言（例如 Java、C++），并发的实现通常是通过共享内存来实现的。多个线程可能会访问和修改同一块内存区域。为了防止竞态条件和数据不一致，开发者需要使用锁（例如互斥锁、读写锁等）来同步对共享数据的访问。虽然这种方法可以工作，但它很容易导致复杂和难以调试的代码，特别是在涉及多个锁或多个资源时，锁的管理和死锁问题都可能成为开发者的噩梦。

2. **Go 语言并发模型（通过通信共享内存）**：
   Go 语言采用了不同的并发模型，即基于 CSP（Communicating Sequential Processes）的 goroutine 和 channel。在 Go 中，你不需要直接共享内存来通信；相反，你可以通过 channel 来在 goroutine 之间发送和接收消息。这种方式下，每个 goroutine 可以拥有自己的局部变量，而通过 channel 传递的只是数据的副本或对数据的引用。因此，不同的 goroutine 不会直接竞争内存资源，这大大减少了锁的需要和出错的机会。

这句话的核心思想是鼓励开发者在设计并发程序时，优先考虑通过通信来同步和传递数据，而不是通过共享内存来通信。这样做的好处是降低了并发编程的复杂性，使得代码更容易理解和维护。

总结来说，"Don't communicate by sharing memory, share memory by communicating" 蕴含了使用 channel 作为并发编程中数据交流的主要手段，而不是依赖于复杂的内存共享和同步机制。这使得 Go 并发编程更加简洁和安全。

## 代码说话

以后补完。