// Import dependencies
import { createQRCode } from 'qrcode';
import { validateEmail, validateNumber } from './utils';

// Register form
const registerForm = document.querySelector('#register-form form');
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = registerForm.elements.username.value;
  const email = registerForm.elements.email.value;
  const password = registerForm.elements.password.value;

  // Validate input
  if (!username || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  if (!validateEmail(email)) {
    alert('Please enter a valid email');
    return;
  }

  const response = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await response.json();

  if (data.success) {
    alert('Registration successful!');
  } else {
    alert(data.error);
  }
});

// Login form
const loginForm = document.querySelector('#login-form form');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = loginForm.elements.email.value;
  const password = loginForm.elements.password.value;

  // Validate input
  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  if (!validateEmail(email)) {
    alert('Please enter a valid email');
    return;
  }

  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    // Show balance and transaction forms
    const balanceSection = document.querySelector('#balance');
    const depositForm = document.querySelector('#deposit-form form');
    const withdrawForm = document.querySelector('#withdraw-form form');
    const depositQRSection = document.querySelector('#deposit-qr');

    balanceSection.style.display = 'block';
    depositForm.style.display = 'block';
    withdrawForm.style.display = 'block';
    depositQRSection.style.display = 'none';

    balanceSection.querySelector('#balance-amount').textContent = data.balance;
  } else {
    alert(data.error);
  }
});

// Deposit form
const depositForm = document.querySelector('#deposit-form form');
depositForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const amount = depositForm.elements.amount.value;

  // Validate input
  if (!validateNumber(amount)) {
    alert('Please enter a valid amount');
    return;
  }

  const response = await fetch('/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });

  const data = await response.json();

  if (data.success) {
    const depositQRSection = document.querySelector('#deposit-qr');
    const qrCodeImg = depositQRSection.querySelector('#qr-code');

    depositQRSection.style.display = 'block';
    qrCodeImg.src = await createQRCode(data.address);

  } else {
    alert(data.error);
  }
});

// Withdraw form
const withdrawForm = document.querySelector('#withdraw-form form');
withdrawForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const amount = withdrawForm.elements.amount.value;

  // Validate input
  if (!validateNumber(amount)) {
    alert('Please enter a valid amount');
    return;
  }

  const response = await fetch('/withdraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });

  const data = await response.json();

  if (data.success) {
    alert('Withdrawal successful!');

    const balanceSection = document.querySelector('#balance');
    balanceSection.querySelector('#balance-amount').textContent = data.balance;

  } else {
    alert(data.error);
  }
});