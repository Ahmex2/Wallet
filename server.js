const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Coinpayments = require('coinpayments');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const validator = require('validator');
const dotenv = require('dotenv');

const app = express();

dotenv.config();

const port = process.env.PORT || 8000;
const uri = process.env.MONGODB_URI || 'mongodb+srv://mantooman040:Mhmd@Mhmd012@elfares.cfrqkfi.mongodb.net/?retryWrites=true&w=majority';
const jwtSecret = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY4ODMxOTMwOCwiaWF0IjoxNjg4MzE5MzA';
const serverSelectionTimeoutMS = process.env.SERVER_SELECTION_TIMEOUT_MS || 5000;
const withdrawalAddress = 'https://www.coinpayments.net/index.php?cmd=acct_balances&action=withdraw&coin=TRX';
const depositAddress = 'https://www.coinpayments.net/index.php?cmd=acct_balances&action=deposit&coin=TRX';
const coinPaymentsPublicKey = process.env.COINPAYMENTS_PUBLIC_KEY || '8511e8799af435d9e0262d084de0879f4404d417ee08da020b1f5b3750896e11';
const coinPaymentsPrivateKey = process.env.COINPAYMENTS_PRIVATE_KEY || '8c7dF491911169C219badfC601eF3a2D28eAFf47479aB7810a0157a6FB76948a';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});

const mongoClient = new MongoClient(uri, {
  useUnifiedTopology: true,
  serverSelectionTimeoutMS,
});
let db;

mongoClient.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  db = mongoClient.db();
  console.log('Connected to database');
});

const coinpaymentsClient = new Coinpayments({
  key: coinPaymentsPublicKey,
  secret: coinPaymentsPrivateKey,
});

app.use(bodyParser.json());
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
//enable cors option
app.use(cors(corsOptions));
app.use(express.static('frontend'));
app.use(helmet());
app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.send('Welcome to Al-Faris-Wallet API');
});

const createToken = (user) => {
  return jwt.sign({ userId: user._id }, jwtSecret);
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/register', apiLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing input fields' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalidemail address' });
  }

  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = {
    username,
    email,
    password: hashedPassword,
  };

  const result = await db.collection('users').insertOne(newUser);

  const user = await db.collection('users').findOne({ _id: result.insertedId });

  const token = createToken(user);

  res.json({ token });
});

app.post('/login', apiLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing input fields' });
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatch = await comparePasswords(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createToken(user);

  res.json({ token });
});

app.get('/balance', verifyToken, async (req, res) => {
  const userId = req.userId;

  const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({ balance: user.balance });
});

app.post('/deposit', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Missing input fields' });
  }

  const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const depositInfo = {
    amount,
    currency1: 'TRX',
    currency2: 'TRX',
    address: depositAddress,
  };

  coinpaymentsClient.createTransaction(depositInfo, async (err, transaction) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: ObjectId(userId) },
      { $inc: { balance: amount } },
      { returnOriginal: false }
    );

    res.json({ balance: updatedUser.value.balance });
  });
});

app.post('/withdraw', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Missing input fields' });
  }

  const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (user.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const withdrawalInfo = {
    amount,
    currency: 'TRX',
    address: withdrawalAddress,
  };

  coinpaymentsClient.createWithdrawal(withdrawalInfo, async (err, withdrawal) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create withdrawal' });
    }

    const updatedUser = await db.collection('users').findOneAndUpdate(
      { _id: ObjectId(userId) },
      { $inc: { balance: -amount } },
      { returnOriginal: false }
    );

    res.json({ balance: updatedUser.value.balance });
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});