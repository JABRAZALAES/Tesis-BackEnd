require('dotenv').config();
const express = require('express');
const routerApi = require('./src/routes');
const { dbGestionNovedades } = require('./src/config/db');
const cors = require('cors');
const multer = require('multer'); // Añadir multer
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
//lamarJSON


// Asegurar que existe la carpeta uploads
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generar nombre de archivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar multer con el almacenamiento
const upload = multer({ storage: storage });

// Hacer upload disponible globalmente en la app
app.locals.upload = upload;

// Configuración de CORS - más permisiva para desarrollo
app.use(cors({
  origin: '*', // Permitir cualquier origen en desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON y form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar servicio de archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
routerApi(app);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando con la base de datos gestion_novedades.');
});

// Verificar conexión a la base de datos y levantar el servidor
const iniciarServidor = async () => {
  try {
    // Verifica conexión a la base de datos
    await dbGestionNovedades.query('SELECT 1');
    console.log('✅ Conexión exitosa a la base de datos gestion_novedades');
    
    // Inicia el servidor - IMPORTANTE: escuchar en todas las interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    process.exit(1); // Detiene la ejecución si hay error
  }
};

// Llama a la función para iniciar el servidor
iniciarServidor();