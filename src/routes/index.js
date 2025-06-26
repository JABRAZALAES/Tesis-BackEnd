const express = require('express');
const incidentesRoutes = require('./incidentesRoutes');
const usuariosRoutes = require('./usuariosRoutes'); // Agrega esta línea
const objetosPerdidosRoutes = require('./objetosPerdidosRoutes');
const inconvenientesRoutes = require('./inconvenientesRoutes'); // Agrega esta línea.
const computadorasRoutes = require('./computadorasRoutes');
const laboratoriosRoutes = require('./laboratoriosRoutes');
const reportesRoutes = require('./reportesRoutes');

function routerApi(app) {
  const router = express.Router();
  app.use('/api', router);
  router.use('/incidentes', incidentesRoutes);
  router.use('/usuarios', usuariosRoutes);
  router.use('/objetos-perdidos', objetosPerdidosRoutes);
  router.use('/inconvenientes', inconvenientesRoutes); 
  router.use('/computadoras', computadorasRoutes);
  router.use('/laboratorios', laboratoriosRoutes);
  router.use('/reportes', reportesRoutes);




}

module.exports = routerApi;