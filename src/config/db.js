import pg from 'pg'

const { Pool, types } = pg
// Preserve numeric semantics expected by the existing JSON API for DECIMAL columns.
types.setTypeParser(1700, (value) => Number(value))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || 'online_shopping_db',
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

function postgresSql(sql) {
  let index = 0
  let statement = sql.replace(/\?/g, () => `$${++index}`)
  if (/^\s*INSERT\b/i.test(statement) && !/\bRETURNING\b/i.test(statement)) {
    statement = `${statement.trim().replace(/;$/, '')} RETURNING id`
  }
  return statement
}

async function execute(client, sql, params = []) {
  const result = await client.query(postgresSql(sql), params)
  if (result.command === 'SELECT' || result.command === 'SHOW' || result.command === 'WITH') return [result.rows, result.fields]
  if (result.command === 'INSERT') return [{ insertId: result.rows[0]?.id, affectedRows: result.rowCount }, result.fields]
  return [{ affectedRows: result.rowCount }, result.fields]
}

const facade = {
  execute: (sql, params = []) => execute(pool, sql, params),
  query: (sql, params = []) => pool.query(postgresSql(sql), params),
  async getConnection() {
    const client = await pool.connect()
    return {
      execute: (sql, params = []) => execute(client, sql, params),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release(),
    }
  },
  end: () => pool.end(),
}

export default facade
