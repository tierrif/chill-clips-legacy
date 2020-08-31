window.addEventListener('load', async () => {
  // eslint-disable-next-line no-undef
  const res = await fetch('http://localhost/auth', {
    headers: { auth: window.localStorage.getItem('chillclips-auth') }
  })
  console.log(res)
  if (res.ok) return redirect()
  document.querySelector('#login-btn').addEventListener('click', async () => {
    const username = document.querySelector('#username')
    const password = document.querySelector('#password')
    username.style.borderBottom = '2px solid #ffffff'
    password.style.borderBottom = '2px solid #ffffff'
    if (!username.value) return handleEmptyInput(username)
    else if (!password.value) return handleEmptyInput(password)
    try {
      // eslint-disable-next-line no-undef
      const res = await fetch('http://localhost/login', {
        headers: { username: username.value, password: password.value }
      })
      if (res.status === 401) return err('Username incorrect.')
      else if (res.status === 403) return err('Password incorrect.')
      window.localStorage.setItem('chillclips-auth', (await res.json()).token)
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
  window.location.href = 'http://localhost/dashboard' // TODO: Change URL, has to be hard coded as this is frontend.
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
