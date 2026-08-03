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
reproductionRoutes.patch('/:id/pregnancy', reproductionController.updatePregnancy);
reproductionRoutes.post('/:id/lambing', reproductionController.recordLambing);
// US‑6.5 : Performance reproductive
reproductionRoutes.get('/performance/:animalId', reproductionController.getPerformance);
reproductionRoutes.get('/performance/herd/:exploitationId', reproductionController.getHerdPerformance);

export default reproductionRoutes;