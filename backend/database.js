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
    description TEXT,
    owner TEXT
  )`

const SELECT_SESSION = 'SELECT * FROM sessions WHERE token = ?'

const INSERT_INTO_SESSION = 'INSERT INTO sessions (token, username) VALUES (?, ?)'

const INSERT_INTO_CLIPS = 'INSERT INTO clips (description, owner) VALUES (?, ?)'

const SELECT_CLIP_DESCRIPTION = 'SELECT description FROM clips WHERE id = ?'

const SELECT_CLIP = 'SELECT * FROM clips WHERE id = ?'

const SELECT_CLIPS = 'SELECT * FROM clips'

const SELECT_CLIPS_FROM = 'SELECT * FROM clips WHERE owner = ?'

const DELETE_CLIP = 'DELETE FROM clips WHERE id = ?'

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

  retrieveClipsFrom (user, callback) {
    console.log(user)
    this.db.all(SELECT_CLIPS_FROM, [user], (_err, results) => callback(results))
  }

  newClip (description, owner, callback) {
    this.db.run(INSERT_INTO_CLIPS, [description, owner])
    this.retrieveAllClips(clips => callback(clips[clips.length - 1].id))
  }

  findClipById (id, callback) {
    this.db.get(SELECT_CLIP, [id], (_err, row) => callback(row))
  }

  deleleClip (id) {
    this.db.run(DELETE_CLIP, [id])
  }

  rawExec (sql) {
    this.db.exec(sql)
  }
}

module.exports = AppDatabase
