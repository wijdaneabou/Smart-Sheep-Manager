import { Hono } from 'hono';
import { matingController } from '../controllers/matingController.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const matingRoutes = new Hono();

// Toutes les routes nécessitent une authentification
matingRoutes.use('*', isAuthenticated);

// Créer une saillie
matingRoutes.post('/', matingController.createService);

// Récupérer toutes les saillies d'une femelle
matingRoutes.get('/animal/:animalId', matingController.getServicesByAnimal);

// Récupérer les saillies d'un cycle spécifique
matingRoutes.get('/cycle/:cycleId', matingController.getServicesByCycle);

// Mettre à jour une saillie
matingRoutes.patch('/:id', matingController.updateService);

// Supprimer une saillie
matingRoutes.delete('/:id', matingController.deleteService);

export default matingRoutes;