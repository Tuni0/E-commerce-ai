import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
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
      secure: false, // true tylko w https
      httpOnly: true,
      sameSite: "lax", // <-- dodaj to!
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

app.get("/products/:number", async (req, res) => {
  try {
    const number = req.params.number;

    // poprawione zapytanie PostgreSQL
    const result = await pool.query("SELECT * FROM product WHERE id = $1", [
      number,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send("Product not found");
    }

    // zwracamy pojedynczy obiekt
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).send("Error fetching product");
  }
});

// === BASKET ===
app.post("/products/:number/basket", async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).send("Unauthorized - please log in");

    const number = req.params.number;
    const selectedColor = req.body.color || "white"; // ⬅️ domyślny kolor
    const selectedSize = req.body.size || "m"; // ⬅️ domyślny rozmiar
    const userId = req.session.userId;

    // 🔍 Sprawdź, czy taki produkt już istnieje w koszyku użytkownika
    const existing = await pool.query(
      `SELECT id, quantity FROM basket 
       WHERE user_id = $1 AND product_id = $2 AND color = $3 AND size = $4`,
      [userId, number, selectedColor, selectedSize]
    );

    if (existing.rows.length > 0) {
      // ✅ Produkt już istnieje – zaktualizuj ilość
      await pool.query(
        `UPDATE basket 
         SET quantity = quantity + 1 
         WHERE id = $1`,
        [existing.rows[0].id]
      );
      console.log("🟡 Updated quantity in basket");
      return res.json({ message: "Quantity updated" });
    } else {
      // 🆕 Produkt jeszcze nie istnieje – dodaj nowy rekord
      await pool.query(
        `INSERT INTO basket (user_id, product_id, quantity, date_add, color, size) 
         VALUES ($1, $2, $3, NOW(), $4, $5)`,
        [userId, number, 1, selectedColor, selectedSize]
      );
      console.log("🟢 Added new item to basket");
      return res.json({ message: "Added new item to basket" });
    }
  } catch (err) {
    console.error("❌ Error adding to basket:", err);
    res.status(500).send("Error inserting values");
  }
});

app.get("/basketItems", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send("Unauthorized");
    }

    const result = await pool.query(
      `
  SELECT 
    basket.id,
    basket.product_id,
    basket.quantity,
    basket.color,
    basket.size,
    product.name AS product_name,
    product.description AS product_description,
    product.price AS product_price,
    "product"."imgSrc" AS product_img
  FROM basket
  INNER JOIN product
  ON basket.product_id = product.id
  WHERE basket.user_id = $1
  `,
      [req.session.userId]
    );

    // 🔧 Ujednolicamy strukturę danych tak, żeby pasowała do frontu
    const formatted = result.rows.map((row) => ({
      id: row.id,
      quantity: row.quantity,
      color: row.color,
      size: row.size,
      product: {
        name: row.product_name,
        description: row.product_description,
        price: parseFloat(row.product_price),
        imgSrc: row.product_img,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching basket items:", err);
    res.status(500).send("Error fetching basket items");
  }
});

app.get("/checkout", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const query = `
      SELECT 
        basket.product_id, 
        basket.user_id,
        basket.color,
        basket.size,
        SUM(basket.quantity) as quantity, 
        products.price, 
        products.description, 
        products.img_src
      FROM basket
      INNER JOIN products 
      ON products.idproducts = basket.product_id
      WHERE basket.user_id = $1
      GROUP BY 
        basket.product_id, basket.user_id,
        basket.color, basket.size,
        products.price, products.description, products.img_src;
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching checkout items");
  }
});

// ===== START SERVERA =====
app.listen(3006, () => {
  console.log("🚀 Server running on port 3006");
});
