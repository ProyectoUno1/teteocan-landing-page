const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: 1,
    email: 'admin@teteocan.com',
    name: 'Admin Principal'
  },
  'tu_clave_secreta_local', // Asegúrate que coincida con tu JWT_SECRET en .env
  {
    expiresIn: '1h'
  }
);

console.log(token);
