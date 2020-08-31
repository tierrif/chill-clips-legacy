(() => {
  const express = require('express')
  const fileUpload = require('express-fileupload')
  const path = require('path')
  const cors = require('cors')
  const bodyParser = require('body-parser')
  const AppDatabase = require('./database')
  const crypto = require('crypto')
  const ejs = require('ejs')
  const fs = require('fs')
  const thumbnail = require('./thumbnails')
  const config = require('../config.json')
  const accounts = require('../accounts.json')

  const DATABASE_FILE_NAME = '../chill-clips.db'

  console.log('Starting Chill Clips...')

  // Create an express instance.
  const app = express()

  app.use(fileUpload({
    createParentPath: true
  }))
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  // Create a db file if it doesn't exist.
  try {
    fs.readFileSync(path.join(__dirname, DATABASE_FILE_NAME))
  } catch (e) {
    fs.writeFileSync(DATABASE_FILE_NAME, '')
  }

  const db = new AppDatabase(DATABASE_FILE_NAME)

  // Declare the endpoints.
  app.use('/clips', express.static('../clips'))
  app.use('/thumbnails', express.static('../thumbnails'))
  app.use('/assets', express.static('../frontend/assets'))
  app.get('/api/descriptions/:id', (req, res) => {
    db.findDescriptionForClip(req.params.id, result => {
      if (!result) {
        return res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'))
      }
      res.end(JSON.stringify(result))
    })
  })
  app.get('/clip/:id', (req, res) => {
    db.findDescriptionForClip(req.params.id, async (result) => {
      if (!result) {
        return res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'))
      }
      const video = `http://localhost/clips/${req.params.id}.mp4`
      const html = await ejs.renderFile(path.join(__dirname, '../frontend/clip.html'),
        { result: result.description, video: video })
      res.end(html)
    })
  })
  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')))
  app.get('/auth', (req, res) => {
    const { auth } = req.headers
    db.session(auth, result => {
      if (!result) res.status(403) // Forbidden.
      else res.status(200) // Success.
      res.end()
    })
  })
  app.get('/login', (req, res) => {
    const { username, password } = req.headers
    if (!username || !password) res.status(400) // Bad request.
    const encodedPass = accounts[username]
    const hash = crypto.createHash('sha256')
    hash.update(password)
    if (!encodedPass) {
      res.status(401) // Unauthorized (account not found).
      res.end()
    } else if (encodedPass !== hash.digest('hex')) {
      res.status(403) // Forbidden (password incorrect).
      res.end()
    } else {
      // Success.
      res.status(200)
      // Create a token.
      const randomBytes = crypto.randomBytes(32).toString('hex')
      // Verify if the token already exists.
      db.getAllSessions(randomBytes, results => {
        // If there are no results, we're good with this token.
        if (!results) {
          res.end(JSON.stringify({ token: randomBytes }))
          return db.createSession(randomBytes, username)
        }
        // If this reaches, somehow the token already exists.
        let newRandomBytes = randomBytes
        // While the token still exists, keep creating a new one until it's unique.
        while (results.includes(newRandomBytes)) {
          newRandomBytes = crypto.randomBytes(32).toString('hex')
        }
        // Finally, we have a unique token. Create the session.
        db.createSession(newRandomBytes, username)
        return res.end(JSON.stringify({ token: newRandomBytes }))
      })
    }
  })
  app.get('/dashboard', (_req, res) => {
    db.retrieveAllClips(async clips => {
      const html = await ejs.renderFile(path.join(__dirname, '../frontend/dashboard.html'), { clips: clips })
      res.end(html)
    })
  })
  app.post('/upload', (req, res) => {
    const { auth } = req.headers
    db.session(auth, result => {
      if (!result) {
        res.status(403) // Forbidden.
        return res.end()
      }
      if (!req.files) {
        res.status(400) // Bad request.
        return res.end()
      } else {
        const file = req.files.file
        if (!file.name.endsWith('.mp4')) return res.status(401)
        db.newClip(req.headers.description, async result => {
          const id = result + 1
          file.mv('../clips/' + id + '.mp4')
          await thumbnail(id)
          res.status(200)
          res.end(JSON.stringify({ id: id }))
        })
      }
    })
  })
  // 404 default page.
  app.get('*', (_req, res) => res.status(404).sendFile(path.join(__dirname, '../frontend/404.html')))

  // Listen.
  app.listen(config.port)
}).call(this)
