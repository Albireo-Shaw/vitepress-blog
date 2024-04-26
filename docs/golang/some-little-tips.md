# 一些记录
记录在学习Golang过程中遇到的一些琐碎问题。
## 引用的本地module改动后，VScode无法识别的问题
新建一个module `example.com/greetings`，使用`go mod edit`将模块路径重定向到本地目录：
``` bash
go mod edit -replace example.com/greetings=../greetings
go mod tidy
```
在本地项目中引入`example.com/greetings`模块，此模块中的一个函数Hello，一开始仅返回一个string：
``` go
package greetings
// ... import
func Hello(name string) string {
	// ...
}
```
本地项目使用此模块没有问题，但是当修改这个模块，为它加入错误处理：
``` go
package greetings

import (
	"errors"
	"fmt"
)

func Hello(name string) (string, error) {

	// return string, error
}
```
在本地项目作了相应的错误处理时，VScode确无法识别该模块已经被修改，仍然认为该模块的Hello函数只有一个string的返回值。

临时解决方法：**重启VScode项目**。（毫无技术含量！）

## 方法与函数的心学四诀

**带指针参数的函数被调用时，必须接受一个指针**
``` go
var v Vertex
ScaleFunc(v, 5)  // 编译错误！
ScaleFunc(&v, 5) // OK
```
**接收者为指针的方法被调用时，接收者既能是值也可以是指针**
``` go
var v Vertex
v.Scale(5)  // OK
p := &v
p.Scale(10) // OK
```
**参数为值的函数被调用时，必须接受一个指定类型的值**
``` go
var v Vertex
fmt.Println(AbsFunc(v))  // OK
fmt.Println(AbsFunc(&v)) // 编译错误！
```
**接收者为值的方法被调用时，接收者既可以是值也可以是指针**
``` go
var v Vertex
fmt.Println(v.Abs()) // OK
p := &v
fmt.Println(p.Abs()) // OK
```

## 使用gonew获取Gin脚手架
gonew虽是Go官方提供的快速模板启动工具，但并没有在社区内得到积极的响应，可使用的模板并不多，官方提供的更是少之又少。

Gin作为Go语言最流行的框架，官方并没有提供脚手架工具，第三方的`cookiecutter`似乎可以快速启动一个Gin脚手架，但考虑到这是一个Python工具，就有点幽默了。

我找到了一个基于gonew的Gin脚手架模板，使用方式如下：

```sh
gonew github.com/LeslieLeung/gin-application-template github.com/<your-username>/<your-repo-name>
```
获取脚手架之后，在启动之前，需要配置config中的数据库信息。虽然这个脚手架并没有实际用到数据库。

可以使用docker-compose快速启动一个数据库：
```yaml
# Use root/example as user/password credentials
version: '3.1'

services:

  db:
    image: mysql
    # NOTE: use of "mysql_native_password" is not recommended: https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password
    # (this is just an example, not intended to be a production configuration)
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
    ports:
      - 3306:3306

  adminer:
    image: adminer
    restart: always
    ports:
      - 8081:8080
```
然后启动脚手架项目：
```sh
make run
```
这样，一个具备数据库连接、日志记录、健康检查、API文档（Swagger）、中间件等基础功能的脚手架就搭建好了。

**记得把项目文件中的`github.com/LeslieLeung/gin-application-template`全局替换为你自己的模块名。**

这里是一些gonew官方推荐的模板：

`https://github.com/GoogleCloudPlatform/go-templates`

`https://github.com/ServiceWeaver/template`

# 使用Air来热重载服务

在使用Gin框架进行Web开发时，如果想要实现文件变动后自动重启服务的功能，可以考虑使用一些第三方的热重载工具。以下是一些常用的Go语言热重载工具，它们可以监控文件变化并自动重新编译和启动应用程序：

1. **air**: 
  Air 是一个用于Go应用程序的热重载工具，可以监控项目中文件的改变并自动编译运行。使用方法很简单，只需要安装后再项目根目录下创建一个`.air.toml`配置文件，然后在命令行运行`air`即可。

  安装air:
  ```sh
  go install github.com/cosmtrek/air@latest
  ```

  在项目根目录创建`.air.toml`配置文件，配置你的项目信息，然后只需在命令行中运行`air`即可开始监控。
  
  如果只是简单使用，不想建立配置文件，可以直接启动：
  ```sh
  air serve
  ```
  以上相当于执行`go run main.go serve`，后面可以跟上其它参数。
   
