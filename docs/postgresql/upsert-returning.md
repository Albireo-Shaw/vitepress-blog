# ON CONFLICT DO NOTHING 为什么拿不到 ID

给文章加标签时，通常要做一件小事。标签不存在就创建，存在就拿它的 ID。唯一约束已经有了，于是很自然地写下这么一句。

```sql
CREATE TEMP TABLE tags (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);

INSERT INTO tags (name)
VALUES ('ffmpeg')
ON CONFLICT (name) DO NOTHING
RETURNING id;
-- 首次执行返回 1，再执行一次返回 0 行
```

`RETURNING` 返回这条语句实际插入或更新的行。第二次执行时，`DO NOTHING` 对冲突的行确实什么也没做。数据库这次用词相当诚实。

## 空结果就再查一次

在 PostgreSQL 默认的 **Read Committed** 隔离级别下，可以先执行上面的插入。拿到 ID 就用它，结果为空就发下一条 SQL。

```sql
SELECT id FROM tags WHERE name = 'ffmpeg';
```

这里的「下一条」有讲究。两个请求同时创建同一个标签时，后来的插入可能等先来的事务提交，然后因唯一约束跳过插入。接下来的 `SELECT` 会取新的语句快照，能看到那笔刚提交的数据。如果业务还允许并发删除标签，查询仍可能落空，调用方可以做有上限的重试。

有人会把插入放进 CTE，再在**同一条语句**里用 `UNION ALL` 补查。并发场景下，唯一约束已经发现冲突，但同一语句的查询快照还看不见对方刚提交的行。这两边都可能返回空，合并也无从生出一个 ID。

## 用 UPDATE 换一行结果

```sql
INSERT INTO tags (name)
VALUES ('ffmpeg')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
RETURNING id;
```

冲突时，这里会真的执行一次 `UPDATE`。即使 `name` 的值一样，也可能触发行级更新触发器，产生新的行版本。业务确实有字段要更新时，这种写法很合适。如果只是想读一个 ID，就要考虑额外的写入值不值得。

[PostgreSQL 文档 · INSERT](https://www.postgresql.org/docs/current/sql-insert.html) · [Read Committed 隔离级别](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED)
