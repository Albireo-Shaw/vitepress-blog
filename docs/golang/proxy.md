# Powershell中的GOPROXY配置

## 问题
在执行`go mod tidy`时，报错：

::: danger 错误信息
rsc.io/quote: module rsc.io/quote: Get "https://proxy.golang.org/rsc.io/quote/@v/list": dial tcp 142.251.43.17:443: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
:::

很显然，是墙的问题。在powershell中，尝试使用以下命令来设置代理：
``` powershell
$proxyAddress = "http://172.22.160.1:10809" 
$proxy = New-Object System.Net.WebProxy($proxyAddress, $true)
[System.Net.WebRequest]::DefaultWebProxy = $proxy
```
当初或许就不该在windows中折腾Go，而是直接使用WSL2 Ubuntu子系统。linux下，只需要一个步骤：
``` bash
export all_proxy=socks5://172.22.160.1:10808
```
而windows的系统代理甚至并不直接支持socks协议。

然而，在设置了代理之后，`curl https://www.google.com`测试可以翻墙，却仍然报上述的**connection failed**错误。而且显示请求的IP地址已经是我设置的台湾机房IP。

**这下两岸一家亲了。**

## 解决

不准备再换代理节点，询问GPT-4后，直接设置环境变量：
``` powershell
$env:GOPROXY = "https://goproxy.io,direct"
go mod tidy
```
成功:tada:。

`goproxy.io`毕竟还是一个境外域名，稳妥一些的话，可以替换为`
goproxy.cn`，前提是它会一直维护的话。

嗯，这就是身在中国的又一个生活常见小技巧。