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
      const res = await fetch('http://n2.mythicmc.info:42069/login', {
        headers: { Username: username.value, Password: password.value }
      })
      if (!res.ok) return err('Invalid credentials.')
      window.localStorage.setItem('ecthetiger-auth', (await res.json()).token)
      redirect()
    } catch (e) {
      err('Could not login. Failed to contact Octyne.')
      console.log(e)
    }
  })
})

function handleEmptyInput (element) {
  element.style.borderBottom = '4px solid #ff0000'
  err('Missing input.')
}

function redirect () {
  window.location.href = 'http://localhost:6969/' // TODO: Change URL, has to be hard coded as this is frontend.
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
