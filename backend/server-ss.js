const express = require("express");
const cors = require("cors");
const path = require("path");
const { pool } = require("./db-ss");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.SS_PORT ? Number(process.env.SS_PORT) : 3001;

const FIELD_MAP = {
  id: "id",
  name: "name",
  email: "email",
  status: "status",
  age: "age",
  score: "score",
  joinedAt: "joined_at",
};

app.post("/api/ss/members", async (req, res) => {
  const page = Number(req.body.page || 1);
  const pageSize = Number(req.body.pageSize || 50);
  const sorts = Array.isArray(req.body.sort) ? req.body.sort : [];

  // 정렬 SQL
  let orderSql = "ORDER BY id ASC";
  if (sorts.length > 0) {
    const parts = [];
    for (const s of sorts) {
      const col = FIELD_MAP[s.field];
      if (!col) continue;
      const dir = String(s.dir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
      parts.push(`${col} ${dir}`);
    }
    if (parts.length > 0) orderSql = "ORDER BY " + parts.join(", ");
  }

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const t0 = process.hrtime.bigint();
  try {
    const countQ = await pool.query(`SELECT COUNT(*)::bigint AS total FROM members`);
    const total = Number(countQ.rows[0].total);

    const dataQ = await pool.query(
      `
      SELECT id, name, email, status, age, score, joined_at AS "joinedAt"
      FROM members
      ${orderSql}
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const t1 = process.hrtime.bigint();
    const queryMs = Number((t1 - t0) / 1000000n);
    const heapUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

    res.json({
      total,
      items: dataQ.rows,
      server: {
        queryMs,
        heapUsedMB: Number(heapUsedMB),
        rowsReturned: dataQ.rowCount,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/ss/health", (req, res) => {
  const heapUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  res.json({ ok: true, heapUsedMB: Number(heapUsedMB) });
});

app.listen(PORT, () => {
  console.log(`[server-ss] listening on http://localhost:${PORT}`);
});
