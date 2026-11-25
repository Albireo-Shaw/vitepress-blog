# LEFT JOIN 怎么少了几行

要给每家店统计已支付的订单，连一单也没有的店也要报个零。已经特意写了 `LEFT JOIN`，结果报表上还是只剩生意最好的那一家。

```sql
CREATE TEMP TABLE shops (id integer PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE shop_orders (
  id integer PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id),
  status text NOT NULL
);

INSERT INTO shops VALUES (1, '东店'), (2, '西店'), (3, '北店');
INSERT INTO shop_orders VALUES (11, 1, 'paid'), (21, 2, 'pending');

SELECT s.name, count(o.id) AS paid_count
FROM shops AS s
LEFT JOIN shop_orders AS o ON o.shop_id = s.id
WHERE o.status = 'paid'
GROUP BY s.id
ORDER BY s.id;
-- 东店  1
```

西店连上了一笔待支付的订单，`WHERE` 把它删掉。北店没有订单，连接补出一行，右表字段全是 `NULL`，`o.status = 'paid'` 的结果也是 `NULL`，同样过不了 `WHERE`。这份报表应当颇受东店欢迎。

## 先限定哪些订单能连上

```sql
SELECT s.name, count(o.id) AS paid_count
FROM shops AS s
LEFT JOIN shop_orders AS o
  ON o.shop_id = s.id AND o.status = 'paid'
GROUP BY s.id
ORDER BY s.id;
-- 东店  1
-- 西店  0
-- 北店  0
```

现在只有已支付订单能成为匹配，西店和北店都没有匹配，各得到一行右表字段为 `NULL` 的结果。`count(o.id)` 跳过这些空值，正好报零。换成 `count(*)` 就会把补的那一行数进去，两家店各凭空多了一单。

给原来的条件补一个 `OR o.id IS NULL` 也只能救回北店。西店有一笔待支付订单，第一次连接已经成功，根本就没有补空的机会。

如果报表还想在同一次查询里统计**全部订单**，就按 `shop_id` 连接所有订单，用 `count(o.id)` 算总数，并用 `count(o.id) FILTER (WHERE o.status = 'paid')` 单独算已支付的数量。不必为了两个计数把订单表连接两遍。

[PostgreSQL 文档 · 表表达式与连接](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)
