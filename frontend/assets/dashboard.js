const domain = 'http://localhost'

window.addEventListener('load', () => {
  const allFiles = []
  let uploaded = false

  document.getElementById('logout').addEventListener('click', () => {
    window.localStorage.clear()
    window.location.href = '/'
  })

  document.body.addEventListener('dragenter', e => {
    stopDefaults(e)
    highlight(true)
  })

  document.body.addEventListener('dragleave', e => {
    stopDefaults(e)
    highlight()
  })

  document.body.addEventListener('dragover', e => {
    stopDefaults(e)
    highlight(true)
  })

  const modal = document.getElementById('uploadModal')
  const btn = document.getElementById('new')
  const span = document.getElementsByClassName('close')[0]

  const viewModal = document.getElementById('viewModal')
  const viewSpan = document.getElementsByClassName('close')[1]

  btn.onclick = () => {
    modal.style.display = 'block'
  }

  span.onclick = () => {
    modal.style.display = 'none'
    if (uploaded) window.location.href = '/dashboard'
  }

  viewSpan.onclick = () => {
    viewModal.style.display = 'none'
    const video = document.getElementById('currentPlaying')
    if (video) video.remove()
  }

  window.onclick = e => {
    if (e.target === modal) {
      modal.style.display = 'none'
      if (uploaded) window.location.href = '/dashboard'
    } else if (e.target === viewModal) {
      viewModal.style.display = 'none'
      const video = document.getElementById('currentPlaying')
      if (video) video.remove()
    }
  }

  const p = document.createElement('p')
  p.style.color = '#bebebe'
  document.getElementById('links').append(p)

  document.body.addEventListener('drop', e => {
    stopDefaults(e)
    highlight()
    modal.style.display = 'block'
    const files = e.dataTransfer.files
    if (files.length > 1 || allFiles.length === 1) return err('You can only upload one file at a time.')
    for (let i = 0; i < files.length; i++) allFiles.push(files[i])
    p.innerHTML = allFiles[0].name
  })

  document.getElementById('upload').addEventListener('click', async () => {
    if (allFiles.length === 0) return err('You must add at least one file in order to upload.')
    uploaded = true
    for (let i = 0; i < allFiles.length; i++) {
      if (!allFiles[i].name.endsWith('.mp4')) return err('Only mp4 files are supported.')
      const url = '/upload/'
      const formData = new window.FormData()
      formData.append('file', allFiles[i])
      p.innerHTML = 'Uploading, please wait...'
      const res = await window.fetch(url, { method: 'POST', body: formData, headers: { auth: window.localStorage.getItem('chillclips-auth'), description: document.getElementById('description').value } })
      console.log(res)
      const json = await res.json()
      p.innerHTML = `${domain}/clip/${json.id}`
      p.classList.add('link')
      p.addEventListener('click', () => copyToClipboard(`${domain}/clip/${json.id}`))
    }
  })

  const clips = document.getElementsByClassName('clip')
  for (let i = 0; i < clips.length; i++) {
    const container = clips[i].getElementsByClassName('container')[0]
    const overlay = document.createElement('div')
    overlay.classList.add('overlay')
    const text = document.createElement('p')
    text.innerHTML = 'Click to view'
    overlay.append(text)
    container.append(overlay)
    const btn = document.createElement('button')
    btn.innerHTML = 'Download'
    btn.classList.add('mui-btn', 'mui-btn--large', 'mui-btn--primary', 'turquoise-gradient', 'btn')
    clips[i].append(btn)
  }

  const containers = document.getElementsByClassName('container')
  for (let i = 0; i < containers.length; i++) {
    containers[i].addEventListener('click', () => {
      const id = containers[i].parentElement.id
      viewModal.style.display = 'block'
      const video = document.createElement('video')
      video.setAttribute('width', '40%')
      video.setAttribute('height', 'auto')
      video.setAttribute('controls', 'controls')
      video.setAttribute('autoplay', 'autoplay')
      video.id = 'currentPlaying'
      video.style.margin = '0px auto'
      video.style.display = 'block'
      const source = document.createElement('source')
      source.src = `/clips/${id}.mp4`
      video.append(source)
      document.getElementById('videoDiv').prepend(video)
      const buttons = document.getElementById('videoButtons')
      buttons.getElementsByClassName('btn')[0].onclick = () => copyToClipboard(`${domain}/clip/${id}`)
      buttons.getElementsByClassName('btn')[1].onclick = async () => {
        const res = await window.fetch('/delete', { headers: { auth: window.localStorage.getItem('chillclips-auth'), id: id } })
        if (res.ok) window.location.href = '/dashboard'
        else {
          err('Could not contact the server.')
          console.log(res)
        }
      }
    })
  }
})

function stopDefaults (e) {
  e.preventDefault()
  e.stopPropagation()
}

function highlight (yes) {
  document.getElementById('highlight').style.display = yes ? 'flex' : 'none'
}

function copyToClipboard (text) {
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  info('Copied to clipboard.')
}

function err (msg) {
  const notif = document.getElementById('notif')
  notif.style.background = 'red'
  notif.innerHTML = msg
  notif.classList.add('show')
  notif.classList.remove('hide')
  setTimeout(() => {
    notif.classList.add('hide')
    notif.classList.remove('show')
  }, 2000)
}

function info (msg) {
  const notif = document.getElementById('notif')
  notif.style.background = 'green'
  notif.innerHTML = msg
  notif.classList.add('show')
  notif.classList.remove('hide')
  setTimeout(() => {
    notif.classList.add('hide')
    notif.classList.remove('show')
  }, 2000)
}
