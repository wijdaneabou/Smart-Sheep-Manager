import { Hono } from 'hono';
import { reproductionController } from '../controllers/reproductionController.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';  // ✅ Utilisez le bon nom

const reproductionRoutes = new Hono();

// Toutes les routes nécessitent une authentification
reproductionRoutes.use('*', isAuthenticated);  // ✅ Utilisez isAuthenticated

reproductionRoutes.post('/', reproductionController.createCycle);
reproductionRoutes.get('/animal/:animalId', reproductionController.getCyclesByAnimal);
reproductionRoutes.patch('/:id/confirm', reproductionController.confirmPregnancy);
reproductionRoutes.delete('/:id', reproductionController.deleteCycle);

export default reproductionRoutes;