# 翻页时，别忘了给时间戳找个搭档

活动日志首页按 `created_at DESC` 取两条，下一页从上一页最后一条的时间往前找。只要一批日志用了同一个时间戳，这个游标就有机会安静地漏掉一条。

```sql
CREATE TEMP TABLE activity (
  id bigint PRIMARY KEY,
  project_id integer NOT NULL,
  created_at timestamptz NOT NULL
);

INSERT INTO activity VALUES
  (12, 7, '2025-01-10 08:00:00+00'),
  (13, 7, '2025-01-10 08:00:00+00'),
  (14, 7, '2025-01-10 08:00:00+00'),
  (15, 7, '2025-01-10 08:01:00+00');

SELECT id, created_at
FROM activity
WHERE project_id = 7
ORDER BY created_at DESC, id DESC
LIMIT 2;
-- 15, 14
```

按 `created_at < '2025-01-10 08:00:00+00'` 往下找，13 和 12 都漏了。把小于号改成小于等于，14 又回来上班了。

## 把排序用过的字段都带上

```sql
SELECT id, created_at
FROM activity
WHERE project_id = 7
  AND (created_at, id) < (timestamptz '2025-01-10 08:00:00+00', 14)
ORDER BY created_at DESC, id DESC
LIMIT 2;
-- 13, 12
```

行比较先看 `created_at`，时间相同才比 `id`。这里两列一起降序，严格小于上一页最后一条就能继续走。同一个项目里，两列的组合为每一行排好了唯一的位置。游标也应保存原始精度。比如用 JavaScript 的 `Date` 转一圈会丢掉 PostgreSQL 时间戳的微秒部分，大整数 ID 则可以用字符串往返。

给这个查询配一条索引。

```sql
CREATE INDEX activity_project_cursor_idx
ON activity (project_id, created_at DESC, id DESC);
```

先用 `project_id` 等值定位，再按后两列有序地找下一页。拿有代表性的数据跑 `EXPLAIN (ANALYZE, BUFFERS)`，看看规划器能否从游标处做索引范围扫描。例子只有四行，顺序扫完也合情合理。

这类翻页依赖排序键稳定。两次请求之间修改行的 `created_at`，仍然可能把它移到游标另一侧，造成漏读或重复。游标记住的是上次读到的位置，数据库里发生过什么，它一概不记。

[PostgreSQL 文档 · 行构造器比较](https://www.postgresql.org/docs/current/functions-comparisons.html#ROW-WISE-COMPARISON) · [索引与 ORDER BY](https://www.postgresql.org/docs/current/indexes-ordering.html)
