// Define constants
const BASE_URL = 'http://localhost:8000';

// Define utility functions
const apiRequest = async (url, method, body, token) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${url}`, options);
  if (!response.ok) throw new Error(response.statusText);
  const data = await response.json();
  return data;
};

// Define API functions
const registerUser = async (username, email, password) => {
  const body = { username, email, password };
  return apiRequest('/register', 'POST', body);
};

const loginUser = async (email, password) => {
  const body = { email, password };
  return apiRequest('/login', 'POST', body);
};

const getBalance = async (token) => {
  return apiRequest('/balance', 'GET', null, token);
};

const depositFunds = async (token, amount) => {
  const body = { amount };
  return apiRequest('/deposit', 'POST', body, token);
};

const withdrawFunds = async (token, amount) => {
  const body = { amount };
  return apiRequest('/withdraw', 'POST', body, token);
};

// Define event listeners
const registerForm = document.querySelector('#register-form');
const registerButton = document.querySelector('#register-button');
const registerMessage = document.querySelector('#register-message');
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerButton.disabled = true;
  registerMessage.textContent = 'Processing...';
  const username = registerForm.username.value;
  const email = registerForm.email.value;
  const password = registerForm.password.value;
  try {
    const result = await registerUser(username, email, password);
    registerMessage.textContent = `Registration successful! User ID: ${result.user.id}`;
    registerForm.reset();
  } catch (error) {
    registerMessage.textContent = `Registration failed: ${error.message}`;
  }
  registerButton.disabled = false;
});

const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const loginMessage = document.querySelector('#login-message');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  loginMessage.textContent = 'Processing...';
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  try {
    const result = await loginUser(email, password);
    localStorage.setItem('token', result.token);
    loginMessage.textContent = 'Login successful!';
    loginForm.reset();
  } catch (error) {
    loginMessage.textContent = `Login failed: ${error.message}`;
  }
  loginButton.disabled = false;
});

const balanceButton = document.querySelector('#balance-button');
const balanceMessage = document.querySelector('#balance-message');
balanceButton.addEventListener('click', async () => {
  balanceButton.disabled = true;
  balanceMessage.textContent = 'Processing...';
  const token = localStorage.getItem('token');
  try {
    const { balance, currency } = await getBalance(token);
    balanceMessage.textContent = `Your balance is ${balance} ${currency}`;
  } catch (error) {
    balanceMessage.textContent = `Failed to get balance: ${error.message}`;
  }
  balanceButton.disabled = false;
});

const depositForm = document.querySelector('#deposit-form');
const depositButton = document.querySelector('#deposit-button');
const depositMessage = document.querySelector('#deposit-message');
depositForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  depositButton.disabled = true;
  depositMessage.textContent = 'Processing...';
  const token = localStorage.getItem('token');
  const amount = depositForm.amount.value;
  try {
    const { balance, currency } = await depositFunds(token, amount);
    depositMessage.textContent = `Deposit successful! New balance: ${balance} ${currency}`;
    } catch (error) {
    depositMessage.textContent = `Deposit failed: ${error.message}`;
  }
  depositButton.disabled = false;
  depositForm.reset();
});

const withdrawForm = document.querySelector('#withdraw-form');
const withdrawButton = document.querySelector('#withdraw-button');
const withdrawMessage = document.querySelector('#withdraw-message');
withdrawForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  withdrawButton.disabled = true;
  withdrawMessage.textContent = 'Processing...';
  const token = localStorage.getItem('token');
  const amount = withdrawForm.amount.value;
  try {
    const { balance, currency } = await withdrawFunds(token, amount);
    withdrawMessage.textContent = `Withdrawal successful! New balance: ${balance} ${currency}`;
  } catch (error) {
    withdrawMessage.textContent = `Withdrawal failed: ${error.message}`;
  }
  withdrawButton.disabled = false;
  withdrawForm.reset();
});

// Check if user is already logged in
const token = localStorage.getItem('token');
if (token) {
  balanceButton.disabled = false;
  depositForm.style.display = 'block';
  withdrawForm.style.display = 'block';
} else {
  loginForm.style.display = 'block';
  registerForm.style.display = 'block';
  }
