# 按本地日期查 timestamptz

同一条报表 SQL，在本机和线上跑出来的数字差了一截。如果两边都按 `created_at::date` 查「昨天」，可以先问问各自的数据库几点了。

`timestamptz` 保存的是一个时刻。写入时带的时区用来确定这个时刻，原来的时区名并不保留。显示以及转换成 `date` 时，默认使用当前会话的 `TimeZone`。

```sql
SET TIME ZONE 'UTC';
SELECT timestamptz '2025-01-10 00:30:00+08'::date;
-- 2025-01-09

SET TIME ZONE 'Asia/Shanghai';
SELECT timestamptz '2025-01-10 00:30:00+08'::date;
-- 2025-01-10
RESET TIME ZONE;
```

事件没动，两边的日历也都没看错。

## 把日期换算成两个时刻

假设订单表用 `timestamptz` 记录创建时间。要查纽约当地 2025 年 3 月 9 日的订单，先把当天和次日的本地零点分别解释成该时区的时刻。

```sql
CREATE TEMP TABLE purchases (
  id integer PRIMARY KEY,
  created_at timestamptz NOT NULL
);
CREATE INDEX ON purchases (created_at);

INSERT INTO purchases VALUES
  (1, '2025-03-09 04:59:59+00'),
  (2, '2025-03-09 05:00:00+00'),
  (3, '2025-03-10 03:59:59.999999+00'),
  (4, '2025-03-10 04:00:00+00');

SELECT id
FROM purchases
WHERE created_at >= (
  timestamp '2025-03-09 00:00:00' AT TIME ZONE 'America/New_York'
)
AND created_at < (
  timestamp '2025-03-10 00:00:00' AT TIME ZONE 'America/New_York'
)
ORDER BY created_at;
-- 2, 3
```

`timestamp` 字面量在这里表示墙上钟表的时间。`AT TIME ZONE` 给它指定时区，得到可与 `created_at` 比较的 `timestamptz`。传入参数时也可以先拿到业务日期，再用 `date + 1` 求出次日。

例子里的纽约刚好切入夏令时。从当天零点到次日零点只过了 23 小时，直接在起点加 24 小时就会把第二天的部分订单捎进去。用左闭右开的区间，次日零点只归次日，连最后一微秒也无需手工填写。

范围条件还保留了原样的 `created_at` 列，普通 B-tree 索引就可以支持它。若写成 `(created_at AT TIME ZONE 'America/New_York')::date = ...`，日期也能算对，但普通时间索引无法直接用这个表达式做范围定位。

[PostgreSQL 文档 · 日期和时间类型](https://www.postgresql.org/docs/current/datatype-datetime.html) · [AT TIME ZONE](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-ZONECONVERT)
