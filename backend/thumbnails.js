const extractFrames = require('ffmpeg-extract-frames')

async function thumbnail (id) {
  await extractFrames({
    input: `../clips/${id}.mp4`,
    output: `../thumbnails/${id}.jpg`,
    offsets: [
      1000
    ]
  })
}

module.exports = thumbnail
