const express = require("express");
const cors = require("cors");
const { pool } = require("./db-cs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.CS_PORT ? Number(process.env.CS_PORT) : 3002;

app.get("/api/cs/members/all", async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : null;

  const t0 = process.hrtime.bigint();
  try {
    const countQ = await pool.query(`SELECT COUNT(*)::bigint AS total FROM members`);
    const total = Number(countQ.rows[0].total);

    const sql = `
      SELECT id, name, email, status, age, score, joined_at AS "joinedAt"
      FROM members
      ORDER BY id ASC
      ${limit ? "LIMIT $1" : ""}
    `;
    const dataQ = await pool.query(sql, limit ? [limit] : []);

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
        limited: Boolean(limit)
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/cs/health", (req, res) => {
  const heapUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  res.json({ ok: true, heapUsedMB: Number(heapUsedMB) });
});

app.listen(PORT, () => {
  console.log(`[server-cs] listening on http://localhost:${PORT}`);
});
