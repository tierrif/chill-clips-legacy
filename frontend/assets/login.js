window.addEventListener('load', async () => {
  const res = await window.fetch('/auth', {
    headers: { auth: window.localStorage.getItem('chillclips-auth') }
  })
  if (res.ok) return redirect()
  document.querySelector('#login-btn').addEventListener('click', async () => {
    const username = document.querySelector('#username')
    const password = document.querySelector('#password')
    username.style.borderBottom = '2px solid #ffffff'
    password.style.borderBottom = '2px solid #ffffff'
    if (!username.value) return handleEmptyInput(username)
    else if (!password.value) return handleEmptyInput(password)
    try {
      const res = await window.fetch('/login', {
        headers: { username: username.value, password: password.value }
      })
      if (res.status === 401) return err('Username incorrect.')
      else if (res.status === 403) return err('Password incorrect.')
      const token = (await res.json()).token
      document.cookie = 'token=' + token
      window.localStorage.setItem('chillclips-auth', token)
      redirect()
    } catch (e) {
      err('A fatal error has occured.')
      console.log(e)
    }
  })
})

function handleEmptyInput (element) {
  element.style.borderBottom = '4px solid #ff0000'
  err('Missing input.')
}

function redirect () {
  window.location.href = '/dashboard'
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
