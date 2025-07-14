const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./db');

const authRoutes = require('./auth/routes/authRoutes');
const { verifyToken } = require('./auth/middlewares/authMiddleware');
const { webhookStripe } = require('./controllers/stripe/stripeControllers');

require('./crondb/cleanPendiente');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

// CORS
app.use(cors());


app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookStripe);


app.use(express.json());


app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/precios', require('./routes/precios'));
app.use('/api/adminPanel', verifyToken, require('./routes/adminPanel'));
app.use('/api/auth', authRoutes);
app.use('/api/public', require('./routes/public'));
app.use('/api', require('./routes/exportGoogle'));

// Endpoint para test manual de correos
const emailController = require('./pdf/controllers/emailController');

app.post('/api/orden', async (req, res) => {
  try {
    await emailController.sendOrderConfirmationToCompany(req, res);
  } catch (error) {
    console.error('Error al generar orden de pago:', error);
    res.status(500).json({ message: 'Error al generar orden de pago', error: error.message });
  }
});

app.post('/api/confirmar', async (req, res) => {
  try {
    req.body.mensajeContinuar = "La empresa se pondrá en contacto con usted para continuar con los siguientes pasos.";
    await emailController.sendPaymentConfirmationToClient(req, res);
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ message: 'Error al confirmar pago', error: error.message });
  }
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Error al conectar a Neon/Postgres:', err);
  } else {
    console.log('Conexión a Neon/Postgres exitosa. Hora actual:', result.rows[0].now);
  }
});

app.get('/', (req, res) => {
  res.send('API de Teteocan Landing Page');
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});
