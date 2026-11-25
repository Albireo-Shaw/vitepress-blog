# CREATE INDEX CONCURRENTLY 也会等

给正在写入的表加索引，通常会想到 `CONCURRENTLY`。它让普通的插入、更新和删除在建索引时继续进行。迁移如果原地等了半天，这个关键字倒也没有用错。

## 用两个连接看看它在等谁

在测试库里，先用连接 A 建一张普通表。接着开事务，写一行，先别提交。

```sql
CREATE TABLE index_demo (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

BEGIN;
INSERT INTO index_demo DEFAULT VALUES;
```

连接 B 保持自动提交，单独执行下面这一条。

```sql
CREATE INDEX CONCURRENTLY index_demo_created_at_idx
ON index_demo (created_at);
```

此时 B 会等 A 的写事务结束。切回 A，在提交前能查到建索引的进度。

```sql
SELECT pid, phase, lockers_total, lockers_done, current_locker_pid
FROM pg_stat_progress_create_index
WHERE relid = 'index_demo'::regclass;

COMMIT;
```

建索引需要两次扫描表，中间要等相关写事务，末尾还可能等旧快照结束。进度卡在 `waiting for writers before build` 或 `waiting for old snapshots` 时，光盯着已扫描块数看，多少有点冤枉磁盘。

## 失败之后，先看索引还在不在

有些迁移工具默认把整份脚本装进一个事务。并发建索引不能在显式事务块里运行，需要把这条命令放到支持非事务执行的迁移里。

如果已经进入构建阶段才失败，有可能留下一条同名的无效索引。可以查系统目录确认。

```sql
SELECT indexrelid::regclass AS index_name, indisvalid
FROM pg_index
WHERE indrelid = 'index_demo'::regclass;
```

`indisvalid = false` 的索引不能供查询使用，还可能给写入增加开销。确认那条无效索引来自本轮失败后，可以用 `DROP INDEX CONCURRENTLY` 删除它，处理导致构建失败的原因，再重试。两条并发 DDL 都要在事务块外分别运行。

补上 `IF NOT EXISTS` 可以让重试不报同名错误，但这四个字只管名字。无效索引叫原来的名字，迁移照样可以报成功，查询照样可以用不上。

[PostgreSQL 文档 · 并发建索引](https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY) · [建索引进度](https://www.postgresql.org/docs/current/progress-reporting.html#CREATE-INDEX-PROGRESS-REPORTING)
