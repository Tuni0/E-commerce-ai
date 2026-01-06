import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";
import { swaggerDocs } from "./swagger.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";

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
      console.error("❌ Webhook signature error:", err.message);
      return res.status(400).send("Webhook Error");
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;

      const email = session.customer_details?.email;
      const shipping = session.collected_information?.shipping_details;
      const address = shipping?.address;
      const fullName = shipping?.name;

      await pool.query(
        `
        UPDATE orders
        SET
          status = 'paid',
          email = $1,
          shipping_name = $2,
          shipping_line1 = $3,
          shipping_line2 = $4,
          shipping_city = $5,
          shipping_postal_code = $6,
          shipping_country = $7
        WHERE stripe_session_id = $8
        `,
        [
          email,
          fullName,
          address?.line1,
          address?.line2,
          address?.city,
          address?.postal_code,
          address?.country,
          session.id,
        ]
      );

      await pool.query(`DELETE FROM basket WHERE user_id = $1`, [
        session.metadata.userId,
      ]);

      console.log("✅ ORDER PAID:", session.id);
    }

    res.json({ received: true });
  }
);

app.use(
  cors({
    origin: "https://e-commerce-ai-olive.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // Add this line to parse JSON request bodies

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
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid auth header" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, name }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ===== ROUTES =====

app.get("/auth/verify", isAuthenticated, (req, res) => {
  res.json({
    validUser: true,
    user: req.user,
  });
});

app.get("/protected-route", isAuthenticated, (req, res) => {
  res.json({ message: "This is a protected route!" });
});

// === USERS ===
app.get("/users", isAuthenticated, async (req, res) => {
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
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // ✅ JWT
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      login: true,
      token,
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
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
app.post("/products/:number/basket", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.userId)
      return res.status(401).send("Unauthorized - please log in");

    const number = req.params.number;
    const selectedColor = req.body.color || "white"; // ⬅️ domyślny kolor
    const selectedSize = req.body.size || "m"; // ⬅️ domyślny rozmiar
    const userId = req.user.userId;

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

app.get("/basketItems", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.userId) {
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
      [req.user.userId]
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

app.put("/basket/updateQuantity", isAuthenticated, async (req, res) => {
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
    const userId = req.user.userId;
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

app.put("/basket/increase", isAuthenticated, async (req, res) => {
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

app.put("/basket/decrease", isAuthenticated, async (req, res) => {
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

app.delete("/basket/remove", isAuthenticated, async (req, res) => {
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
    const userId = req.user.userId;

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

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "usd",
            },
            display_name: "Free shipping",
          },
        },
      ],

      billing_address_collection: "required",

      success_url: "https://e-commerce-ai-olive.vercel.app/success",
      cancel_url: "https://e-commerce-ai-olive.vercel.app/cart",

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
    console.error("❌ Stripe FULL error:", {
      message: err.message,
      type: err.type,
      code: err.code,
      raw: err.raw,
    });
    res.status(500).json({
      error: err.message,
      type: err.type,
    });
  }
});

// ===== START SERVERA =====
app.listen(3006, () => {
  console.log("🚀 Server running on port 3006");
});

swaggerDocs(app);
