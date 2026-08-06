import { Hono } from "hono";
import { reproductionController } from "../controllers/reproductionController.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const reproductionRoutes = new Hono();

// Toutes les routes nécessitent une authentification
reproductionRoutes.use('*', isAuthenticated);

// Créer un cycle de reproduction : nécessite REPRODUCTION:CREATE
reproductionRoutes.post('/', requirePermission("REPRODUCTION", "CREATE"), reproductionController.createCycle);

// Lister les cycles d'un animal : REPRODUCTION:READ
reproductionRoutes.get('/animal/:animalId', requirePermission("REPRODUCTION", "READ"), reproductionController.getCyclesByAnimal);

// Confirmer une gestation : REPRODUCTION:UPDATE (ou VALIDATE selon votre besoin, mais nous avons UPDATE)
reproductionRoutes.patch('/:id/confirm', requirePermission("REPRODUCTION", "UPDATE"), reproductionController.confirmPregnancy);

// Supprimer un cycle : REPRODUCTION:DELETE
reproductionRoutes.delete('/:id', requirePermission("REPRODUCTION", "DELETE"), reproductionController.deleteCycle);

// Mettre à jour une gestation : REPRODUCTION:UPDATE
reproductionRoutes.patch('/:id/pregnancy', requirePermission("REPRODUCTION", "UPDATE"), reproductionController.updatePregnancy);

// Enregistrer une mise-bas : REPRODUCTION:CREATE (ou UPDATE)
reproductionRoutes.post('/:id/lambing', requirePermission("REPRODUCTION", "CREATE"), reproductionController.recordLambing);

// US‑6.5 : Performance reproductive : REPRODUCTION:READ
reproductionRoutes.get('/performance/:animalId', requirePermission("REPRODUCTION", "READ"), reproductionController.getPerformance);
reproductionRoutes.get('/performance/herd/:exploitationId', requirePermission("REPRODUCTION", "READ"), reproductionController.getHerdPerformance);

export default reproductionRoutes;