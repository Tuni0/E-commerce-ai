import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // tylko frontendowy adres
    credentials: true,
  })
);

app.use(express.json()); // Add this line to parse JSON request bodies
app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Sprawdzenie połączenia:
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));

// ===== MIDDLEWARE =====
const isAuthenticated = (req, res, next) => {
  if (req.session.user) next();
  else res.status(401).json({ message: "Unauthorized" });
};

// ===== ROUTES =====

app.get("/auth/verify", (req, res) => {
  if (req.session.user) {
    return res.json({ validUser: true, username: req.session.user });
  } else {
    return res.json({ validUser: false });
  }
});

app.get("/protected-route", isAuthenticated, (req, res) => {
  res.json({ message: "This is a protected route!" });
});

app.get("/", (req, res) => {
  if (req.session.user) {
    res.json({ validUser: true, username: req.session.user });
  } else {
    res.json({ validUser: false });
  }
});

// === USERS ===
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password, name, surname, isAdmin } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    // sprawdź czy użytkownik już istnieje
    const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkUser.rows.length > 0) {
      return res
        .status(409)
        .send("User already exists with this email! Please log in!");
    }

    // poprawione zapytanie PostgreSQL
    await pool.query(
      "INSERT INTO users (name, surname, email, password, isadmin) VALUES ($1, $2, $3, $4, $5)",
      [name, surname, email, hashedPassword, isAdmin ?? false]
    );

    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Error inserting values");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.send("User not found");
    }

    const user = result.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.send("Incorrect password");
    }

    req.session.user = user.name;
    req.session.userId = user.id; // zakładam, że kolumna to id
    console.log("✅ Session created:", req.session);

    res.json({ Login: true, username: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).send("Error logging out");
    else res.json({ Logout: true });
  });
});

// === PRODUCTS ===
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM product");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
});

// ===== START SERVERA =====
app.listen(3006, () => {
  console.log("🚀 Server running on port 3006");
});
