// Register form
async function register() {
  const username = document.querySelector('#register-form input[name="username"]').value;
  const email = document.querySelector('#register-form input[name="email"]').value;
  const password = document.querySelector('#register-form input[name="password"]').value;

  // Validate input
  if (!username || !email || !password) {
    return alert('Please fill in all fields');
  }

  if (!validateEmail(email)) {
    return alert('Please enter a valid email');
  }

  const response = await fetch('http://localhost:8000/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await response.json();

  if (response.ok) {
    alert('Registration successful!');
    document.querySelector('#register-form').reset();
  } else {
    alert(data.error);
  }
}

// Login form
async function login() {
  const email = document.querySelector('#login-form input[name="email"]').value;
  const password = document.querySelector('#login-form input[name="password"]').value;

  // Validate input
  if (!email || !password) {
    return alert('Please fill in all fields');
  }

  if (!validateEmail(email)) {
    return alert('Please enter a valid email');
  }

  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('token', data.token);
    loadPage('dashboard');
  } else {
    alert(data.error);
  }
}

// Get user info
async function getUserInfo() {
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  const response = await fetch('http://localhost:8000/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    document.getElementById('username').innerText = data.username;
    document.getElementById('balance').innerText = `$${data.balance.toFixed(2)}`;
  } else {
    alert(data.error);
  }
}

// Deposit form
async function deposit() {
  const amount = parseFloat(document.querySelector('#deposit-form input[name="amount"]').value);

  // Validate input
  if (isNaN(amount) || amount <= 0) {
    return alert('Please enter a valid amount');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  const response = await fetch('http://localhost:8000/transactions/deposit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();
  if (response.ok) {
    const qrCodeImg = document.querySelector('#deposit-qr img');
    qrCodeImg.src = await createQRCode(data.depositAddress);
    document.querySelector('#deposit-qr p').innerText = data.depositAddress;
    loadPage('deposit');
  } else {
    alert(data.error);
  }
}

// Withdraw form
async function withdraw() {
  const amount = parseFloat(document.querySelector('#withdraw-form input[name="amount"]').value);

  // Validate input
  if (isNaN(amount) || amount <= 0) {
    return alert('Please enter a valid amount');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  const response = await fetch('http://localhost:8000/transactions/withdraw', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();
  if (response.ok) {
    alert('Withdrawal successful!');
    document.querySelector('#withdraw-form').reset();
    document.getElementById('balance').innerText = `$${data.balance.toFixed(2)}`;
  } else {
    alert(data.error);
  }
}
