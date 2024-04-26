## 一个基于Gin的JWT鉴权实例

1. 相关库
这里我们使用`golang-jwt`来实现

```bash
go get -u github.com/golang-jwt/jwt/v5
```

2. 编写JWT中间件
创建一个JWT中间件，这个中间件会在每个需要鉴权的请求中被调用，来验证JWT token的有效性。
注意：验证Token时别忘记将`Authorization`头的`Bearer`字段去掉
```go
package middleware

import (
	"net/http"
	"strings"
	"time"

	"example.com/go-chat-api/pkg/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// 如果Secret不需要从配置文件里引用，可以写死在这里
// var JwtSecret = []byte("helloworld")

// 生成Token
func GenerateToken(userId string) (string, error) {
	JwtSecret := []byte(config.GetConfig().GetString("jwt.secret"))
	tokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": userId,
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
	})
	token, err := tokenClaims.SignedString(JwtSecret)

	return token, err
}

// JWT中间件
func JWTAtuhMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string
		JwtSecret := []byte(config.GetConfig().GetString("jwt.secret"))
		// 处理Authorization的Bearer字段
		authHeader := c.GetHeader("Authorization")
		bearerLen := len("Bearer ")
		if len(authHeader) > bearerLen && strings.ToLower(authHeader[:bearerLen-1]) == "bearer" {
			token = authHeader[bearerLen:]
		}

		// token为空
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization token not provided",
			})
			c.Abort()
			return
		}

		// 解析验证token
		tokenClaims, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			return JwtSecret, nil
		})

		if err != nil || !tokenClaims.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := tokenClaims.Claims.(jwt.MapClaims); ok && tokenClaims.Valid {
			c.Set("userId", claims["userId"])
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Next()
	}
}

```

3. 创建登录路由和逻辑
创建登录接口，当用户提供正确的登录凭证时，生成一个JWT token并返回。

```go
package controller

import (
	"net/http"

	"example.com/go-chat-api/internal/middleware"
	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var loginInfo struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&loginInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid login information",
		})
		return
	}

	// 验证用户名和密码
	// 由于只是一个示例，就直接写死
	if loginInfo.Username == "admin" && loginInfo.Password == "password" {
		// 假定userId
		userId := "1"
		// 生成JWT Token
		token, err := middleware.GenerateToken(userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to generate token",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": token})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Incorrect username or password",
		})
	}
}

// 验证登录是否成功，直接返回数据
func ProtectedHandler(c *gin.Context) {
	// 获取userId， 该值在JWT中间件中已经设置
	userId := c.MustGet("userId").(string)

	c.JSON(http.StatusOK, gin.H{"userId": userId})
}

```

4. 使用JWT中间件保护路由
创建受保护的路由，确保它们只能在提供有效的JWT token时访问。

```go
r.POST("/login", controller.Login)

// 需要授权的路由
authorized := r.Group("/auth")
authorized.Use(middleware.JWTAtuhMiddleware())
authorized.GET("/protected", controller.ProtectedHandler)
```

5. 测试
现在，可以使用Postman或curl等工具测试登录接口和受保护的路由。

首先测试登录接口：

```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' http://localhost:8080/login
```

如果凭证正确，将会得到一个JWT token。然后，可以使用这个token来访问受保护的路由：

```bash
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://localhost:8080/auth/protected
```

确保将`<YOUR_JWT_TOKEN>`替换为从登录接口获得的实际token。

得到正确响应

`{"userId":"1"}`

以上就是在Gin框架中实现JWT鉴权登录功能的基本步骤。而实际开发中，需要根据自己的需要对鉴权逻辑进行调整，比如连接数据库来验证用户名和密码，以及根据业务需求调整token的有效期等。