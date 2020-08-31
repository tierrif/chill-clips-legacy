const sqlite = require('sqlite3').verbose()

const CREATE_SESSION_TABLE = `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT
  )`

const CREATE_USER_TABLE = `CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
  )`

const CREATE_CLIP_TABLE = `CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT
  )`

const SELECT_SESSION = 'SELECT * FROM sessions WHERE token = ?'

const INSERT_INTO_SESSION = 'INSERT INTO sessions (token, username) VALUES (?, ?)'

const INSERT_INTO_CLIPS = 'INSERT INTO clips (description) VALUES (\'?\')'

const SELECT_CLIP_DESCRIPTION = 'SELECT description FROM clips WHERE id = ?'

const SELECT_CLIPS = 'SELECT * FROM clips'

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
    this.db.exec(CREATE_CLIP_TABLE)
  }

  session (token, callback) {
    this.db.get(SELECT_SESSION, [token], (err, row) => {
      if (err) console.log(err)
      callback(row)
    })
  }

  createSession (token, userId) {
    this.session(token, result => {
      if (!result) this.db.run(INSERT_INTO_SESSION, [token, userId])
    })
  }

  getAllSessions (token, callback) {
    this.db.all(SELECT_SESSION, [token], (_err, results) => callback(results))
  }

  findDescriptionForClip (id, callback) {
    this.db.get(SELECT_CLIP_DESCRIPTION, [id], (_err, row) => callback(row))
  }

  retrieveAllClips (callback) {
    this.db.all(SELECT_CLIPS, (_err, results) => callback(results))
  }

  newClip (description, callback) {
    this.rawExec(INSERT_INTO_CLIPS.replace('?', description))
    this.retrieveAllClips(clips => callback(clips.length))
  }

  rawExec (sql) {
    this.db.exec(sql)
  }
}

module.exports = AppDatabase
