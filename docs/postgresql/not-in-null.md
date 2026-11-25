# NOT IN 里混进一个 NULL

从会员表里找没有被停用的账号。用 `NOT IN` 排除停用名单，前几天还好好的，今天突然一个人也查不出来。先别急着怀疑全体会员都犯了事。

## 两个会员，一条空记录

```sql
CREATE TEMP TABLE members (id integer PRIMARY KEY);
CREATE TEMP TABLE suspended_members (member_id integer);

INSERT INTO members VALUES (1), (2);
INSERT INTO suspended_members VALUES (1), (NULL);

SELECT id
FROM members
WHERE id NOT IN (SELECT member_id FROM suspended_members);
-- 0 行
```

`WHERE` 只保留条件为 `TRUE` 的行。对 1 号来说，名单里有个确切的 1，条件是 `FALSE`。对 2 号来说，查了半天只能确定 `2 <> 1`，至于 `2 <> NULL`，数据库也不知道。条件的结果就成了 `NULL`，这一行照样被丢掉。

```sql
SELECT 1 NOT IN (1, NULL) AS member_1,
       2 NOT IN (1, NULL) AS member_2;
-- member_1 = false, member_2 = NULL
```

## 直接问有没有匹配

```sql
SELECT m.id
FROM members AS m
WHERE NOT EXISTS (
  SELECT 1
  FROM suspended_members AS s
  WHERE s.member_id = m.id
);
-- 2
```

对每个会员，子查询只看有没有一条记录能匹配上。名单里的空记录匹配不了任何会员，也就无权替整个名单发言。保留 `NOT IN` 也可以，在子查询里加 `WHERE member_id IS NOT NULL` 即可得到相同结果。这里 **左边是主键，因此也保证非空**。

如果左边换成可空字段，`NOT EXISTS` 配普通的 `=` 会把左边的空值视为没有匹配。业务上需要排除它，就在外层补上 `IS NOT NULL`。如果业务约定两边的空值应当匹配，子查询里可以用 `IS NOT DISTINCT FROM`。最好趁现在想清楚，免得再靠一张空报表来讨论需求。

[PostgreSQL 文档 · 子查询表达式](https://www.postgresql.org/docs/current/functions-subquery.html) · [比较函数与运算符](https://www.postgresql.org/docs/current/functions-comparison.html)
