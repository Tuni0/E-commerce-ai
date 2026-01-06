import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";
import { swaggerDocs } from "./swagger.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

app.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 👇👇👇 TU JEST TEN KOD 👇👇👇
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        // 1️⃣ Oznacz zamówienie jako PAID
        await pool.query(
          `
          UPDATE orders
          SET status = 'paid'
          WHERE stripe_session_id = $1
          `,
          [session.id]
        );

        // 2️⃣ Wyczyść koszyk użytkownika
        await pool.query(
          `
          DELETE FROM basket
          WHERE user_id = $1
          `,
          [session.metadata.userId]
        );

        console.log("✅ Order paid & basket cleared:", session.id);
      } catch (dbErr) {
        console.error("❌ DB error in webhook:", dbErr);
      }
    }

    res.json({ received: true });
  }
);

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

/**
 * @openapi
 * /signup:
 *   post:
 *     tags:
 *       - Users
 *     summary: Rejestracja nowego użytkownika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - surname
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */

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

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logowanie użytkownika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in
 *       400:
 *         description: Wrong credentials
 */

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

/**
 * @openapi
 * /logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Wylogowanie użytkownika
 *     responses:
 *       200:
 *         description: User logged out
 */

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).send("Error logging out");
    else res.json({ Logout: true });
  });
});

/**
 * @openapi
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Pobierz wszystkie produkty
 *     responses:
 *       200:
 *         description: Lista produktów
 */

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

/**
 * @openapi
 * /products/{number}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Pobiera pojedynczy produkt
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produkt
 *       404:
 *         description: Product not found
 */

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

/**
 * @openapi
 * /products/{number}/basket:
 *   post:
 *     tags:
 *       - Basket
 *     summary: Dodaje produkt do koszyka
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to basket or updated quantity
 *       401:
 *         description: Unauthorized
 */

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

/**
 * @openapi
 * /basketItems:
 *   get:
 *     tags:
 *       - Basket
 *     summary: Pobiera koszyk użytkownika
 *     responses:
 *       200:
 *         description: Lista elementów koszyka
 *       401:
 *         description: Unauthorized
 */

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
  ORDER BY basket.id ASC
  `,
      [req.session.userId]
    );

    // 🔧 Ujednolicamy strukturę danych tak, żeby pasowała do frontu
    const formatted = result.rows.map((row) => ({
      id: row.id,
      product_id: row.product_id, // ⬅️ DODAJ TO
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

app.put("/basket/updateQuantity", async (req, res) => {
  try {
    const { basketId, quantity } = req.body;

    await pool.query(`UPDATE basket SET quantity = $1 WHERE id = $2`, [
      quantity,
      basketId,
    ]);

    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
});

/**
 * @openapi
 * /checkout:
 *   get:
 *     tags:
 *       - Checkout
 *     summary: Pobiera dane produktów do płatności
 *     responses:
 *       200:
 *         description: Checkout data
 *       401:
 *         description: Unauthorized
 */

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

/**
 * @openapi
 * /basket/increase:
 *   put:
 *     tags:
 *       - Basket
 *     summary: Zwiększa ilość produktu w koszyku
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basketId
 *             properties:
 *               basketId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quantity increased
 */

app.put("/basket/increase", async (req, res) => {
  try {
    const { basketId } = req.body;

    await pool.query(
      `UPDATE basket SET quantity = quantity + 1 WHERE id = $1`,
      [basketId]
    );

    res.json({ message: "Increased quantity" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Increase failed");
  }
});

/**
 * @openapi
 * /basket/decrease:
 *   put:
 *     tags:
 *       - Basket
 *     summary: Zmniejsza ilość produktu
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basketId
 *             properties:
 *               basketId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quantity decreased or item removed
 */

app.put("/basket/decrease", async (req, res) => {
  try {
    const { basketId } = req.body;

    const result = await pool.query(
      `SELECT quantity FROM basket WHERE id = $1`,
      [basketId]
    );

    const qty = result.rows[0].quantity;

    if (qty <= 1) {
      await pool.query(`DELETE FROM basket WHERE id = $1`, [basketId]);
      return res.json({ message: "Item removed" });
    }

    await pool.query(
      `UPDATE basket SET quantity = quantity - 1 WHERE id = $1`,
      [basketId]
    );

    res.json({ message: "Decreased quantity" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Decrease failed");
  }
});

/**
 * @openapi
 * /basket/remove:
 *   delete:
 *     tags:
 *       - Basket
 *     summary: Usuwa element z koszyka
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basketId
 *             properties:
 *               basketId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item removed
 */

app.delete("/basket/remove", async (req, res) => {
  try {
    const { basketId } = req.body;

    await pool.query(`DELETE FROM basket WHERE id = $1`, [basketId]);

    res.json({ message: "Item removed completely" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
});

app.post("/create-checkout-session", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { address } = req.body;

    // 1️⃣ Pobierz koszyk z bazy (SOURCE OF TRUTH)
    const basketResult = await pool.query(
      `
      SELECT 
        basket.quantity,
        product.name,
        product.price
      FROM basket
      JOIN product ON product.id = basket.product_id
      WHERE basket.user_id = $1
      `,
      [userId]
    );

    if (basketResult.rows.length === 0) {
      return res.status(400).json({ error: "Basket empty" });
    }

    // 2️⃣ Zbuduj line_items dla Stripe
    const line_items = basketResult.rows.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity,
    }));

    // 3️⃣ Policz TOTAL (backend!)
    const totalCents = basketResult.rows.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );

    // 4️⃣ Utwórz Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,

      shipping_address_collection: {
        allowed_countries: ["US", "PL"],
      },

      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cart",

      metadata: {
        userId: userId.toString(),
      },
    });

    // 5️⃣ ZAPISZ ORDER (PENDING)
    await pool.query(
      `
      INSERT INTO orders (user_id, stripe_session_id, total_cents, status)
      VALUES ($1, $2, $3, 'pending')
      `,
      [userId, session.id, totalCents]
    );

    // 6️⃣ Zwróć sessionId do frontendu
    res.json({
      checkoutSessionId: session.id,
    });
  } catch (err) {
    console.error("❌ create-checkout-session error:", err);
    res.status(500).send("Stripe error");
  }
});

// ===== START SERVERA =====
app.listen(3006, () => {
  console.log("🚀 Server running on port 3006");
});

swaggerDocs(app);
