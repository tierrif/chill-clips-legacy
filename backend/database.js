const sqlite = require('sqlite3').verbose()

const CREATE_SESSION_TABLE = `CREATE TABLE IF NOT EXISTS sessions ('
    token TEXT PRIMARY KEY,
    userId INTEGER
  )`

const CREATE_USER_TABLE = `CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY,
    name TEXT,
    password TEXT
  )`

const SELECT_SESSION = 'SELECT * FROM sessions WHERE token = ?'

class AppDatabase {
  constructor (path) {
    // Create a database instance.
    this.db = new sqlite.Database(path, sqlite.OPEN_READWRITE, err => {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully initiated database.')
      }
    })

    this.db.exec(CREATE_SESSION_TABLE)
    this.db.exec(CREATE_USER_TABLE)
  }

  session (token, callback) {
    this.db.get(SELECT_SESSION, [token], (err, row) => {
      if (err) console.log(err)
      callback(row)
    })
  }
}

module.exports = AppDatabase
