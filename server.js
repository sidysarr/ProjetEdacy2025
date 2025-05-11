// Importation des dépendances
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');


// Initialisation de dotenv
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Autoriser toutes les origines
app.use(cors({
  origin: 'http://localhost:3000',  // L'adresse de 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware pour gérer les requêtes JSON
app.use(express.json());
// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Modèle pour un utilisateur
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Route pour s'inscrire
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Vérification de l'existence de l'utilisateur
  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'Utilisateur déjà existant' });
  }

  // Hashage du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Création du nouvel utilisateur
  const user = new User({ username, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'Utilisateur créé' });
});

// Route pour se connecter
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Vérification de l'utilisateur
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: 'Utilisateur introuvable' });
  }

  // Vérification du mot de passe
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Mot de passe incorrect' });
  }

  // Génération du token JWT
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Connexion réussie', token });
});

// Route protégée (exemple)
app.get('/protected', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalide' });
    }
    res.json({ message: 'Accès autorisé', userId: decoded.userId });
  });
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

const Book = require('./models/Book');

// Créer un livre
app.post('/books', async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//  Lire tous les livres
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Lire un livre par ID
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre non trouvé" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Mettre à jour un livre
app.put('/books/:id', async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Livre non trouvé" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer un livre
app.delete('/books/:id', async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Livre non trouvé" });
    res.json({ message: "Livre supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
