const express = require('express')
const path = require('path')
const AppDatabase = require('./database')
const config = require('../config.json')

console.log('Starting Chill Clips...')

// Create an express instance.
const app = express()

const db = new AppDatabase('../chill-clips.db')

// Retrieve the clip path from config.
const clipPath = path.parse(config.clipBasePath)

// Declare the endpoints.
app.use('/clips', express.static(clipPath))
app.get('/', (req, res) => res.sendFile('../frontend/index.html'))
app.get('/auth', (req, res) => {
  const { auth } = req.headers
  db.session(auth, result => {
    if (!result) res.end('{}', { status: 403 })
    else res.end('{}', { status: 200 })
  })
})

// Listen.
app.listen(config.port)
