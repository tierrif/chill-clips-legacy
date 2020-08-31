(() => {
  const polka = require('polka')
  const path = require('path')
  const cors = require('cors')
  const bodyParser = require('body-parser')
  const AppDatabase = require('./database')
  const serveStatic = require('serve-static')
  const Busboy = require('busboy')
  const crypto = require('crypto')
  const ejs = require('ejs')
  const fs = require('fs')
  const thumbnail = require('./thumbnails')
  const config = require('../config.json')
  const accounts = require('../accounts.json')

  const DATABASE_FILE_NAME = '../chill-clips.db'

  console.log('Starting Chill Clips...')

  // Create an express instance.
  const app = polka()

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
  app.use('/clips', serveStatic('../clips'))
  app.use('/thumbnails', serveStatic('../thumbnails'))
  app.use('/assets', serveStatic('../frontend/assets'))
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
      const video = `${config.protocol}://${config.domain}/clips/${req.params.id}.mp4`
      const html = await ejs.renderFile(path.join(__dirname, '../frontend/clip.html'),
        { result: result.description, video: video })
      res.end(html)
    })
  })
  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html')
    fs.createReadStream(path.join(__dirname, '../frontend/index.html')).pipe(res)
  })
  app.get('/auth', (req, res) => {
    const { auth } = req.headers
    db.session(auth, result => {
      if (!result) res.statusCode = '403' // Forbidden.
      else res.statusCode = '200' // Success.
      res.end()
    })
  })
  app.get('/login', (req, res) => {
    const { username, password } = req.headers
    if (!username || !password) res.statusCode = '400' // Bad request.
    const encodedPass = accounts[username]
    const hash = crypto.createHash('sha256')
    hash.update(password)
    if (!encodedPass) {
      res.statusCode = '401' // Unauthorized (account not found).
      res.end()
    } else if (encodedPass !== hash.digest('hex')) {
      res.statusCode = '403' // Forbidden (password incorrect).
      res.end()
    } else {
      // Success.
      res.statusCode = '200'
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
  app.get('/dashboard/', (req, res) => {
    const auth = req.headers.cookie.split('=')[1]
    db.session(auth, result => {
      if (!result) {
        res.statusCode = '403' // Forbidden.
        return res.end()
      }
      db.retrieveClipsFrom(result.username, async clips => {
        const html = await ejs.renderFile(path.join(__dirname, '../frontend/dashboard.html'), { clips: clips })
        res.end(html)
      })
    })
  })
  app.get('/delete', (req, res) => {
    const { auth, id } = req.headers
    db.session(auth, result => {
      if (!result) {
        res.statusCode = '403' // Forbidden.
        return res.end()
      }
      db.findClipById(id, clip => {
        if (result.username !== clip.owner) {
          res.statusCode = '401' // Unauthorized.
          return res.end()
        }
        db.deleleClip(id)
        fs.unlink(path.join(__dirname, `../clips/${id}.mp4`), err => console.log(err || `Deleted ${id}.mp4`))
        fs.unlink(path.join(__dirname, `../thumbnails/${id}.jpg`), err => console.log(err || `Deleted ${id}.jpg`))
        res.end()
      })
    })
  })
  app.post('/upload', (req, res) => {
    const { auth } = req.headers
    const busBoy = new Busboy({ headers: req.headers })
    db.session(auth, result => {
      if (!result) {
        res.statusCode = '403' // Forbidden.
        return res.end()
      } else {
        db.newClip(req.headers.description, result.username, id => {
          busBoy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            if (!filename.endsWith('.mp4')) {
              res.statusCode = '401'
              return res.end()
            }
            const saveTo = path.join(__dirname, '../clips/' + id + '.mp4')
            file.pipe(fs.createWriteStream(saveTo))
          })

          busBoy.on('finish', async () => {
            await thumbnail(id) // error
            res.statusCode = '200'
            res.end(JSON.stringify({ id: id }))
          })

          req.pipe(busBoy)
        })
      }
    })
  })
  // 404 default page.
  app.get('*', (_req, res) => {
    res.statusCode = '404'
    fs.createReadStream(path.join(__dirname, '../frontend/404.html')).pipe(res)
  })

  // Listen.
  app.listen(config.port)
}).call(this)
