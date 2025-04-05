require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Conectado a MongoDB");
}).catch(err => {
  console.error("❌ Error en la conexión:", err);
});

// Modelo de usuario
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});
const User = mongoose.model("User", UserSchema);

// Registro de usuario
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Usuario ya existe" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: "Registrado con éxito" });
});

// Login (admin y usuarios normales)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Admin
  if (email === 'admin@admin.com') {
    if (password === 'admin123') {
      return res.status(200).json({ message: "Bienvenido Admin", isAdmin: true });
    } else {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
  }

  // Usuario normal
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Credenciales incorrectas" });

  res.status(200).json({ message: "Login exitoso", isAdmin: false });
});

// Vista de admin - usuarios registrados
app.get('/admin/users', async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
