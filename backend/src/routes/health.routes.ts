import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { HealthController } from '../controllers/health.controller.js';

const healthRoutes = new Hono();

healthRoutes.use('*', isAuthenticated);

// ✅ Route pour tous les dossiers (sans animalId)
healthRoutes.get('/records', requirePermission('HEALTH', 'READ'), HealthController.getHealthRecords);

// Health Records (US-5.1)
healthRoutes.get('/animals/:animalId/records', requirePermission('HEALTH', 'READ'), HealthController.getHealthRecords);
healthRoutes.get('/animals/:animalId/latest', requirePermission('HEALTH', 'READ'), HealthController.getLatestHealthRecord);
healthRoutes.get('/records/:id', requirePermission('HEALTH', 'READ'), HealthController.getHealthRecordById);
healthRoutes.post('/records', requirePermission('HEALTH', 'CREATE'), HealthController.createHealthRecord);
healthRoutes.put('/records/:id', requirePermission('HEALTH', 'UPDATE'), HealthController.updateHealthRecord);
healthRoutes.delete('/records/:id', requirePermission('HEALTH', 'DELETE'), HealthController.deleteHealthRecord);

// Treatments (US-5.2)
healthRoutes.get('/treatments/health-record/:healthRecordId', requirePermission('HEALTH', 'READ'), HealthController.getTreatmentsByHealthRecord);
healthRoutes.get('/treatments/:id', requirePermission('HEALTH', 'READ'), HealthController.getTreatmentById);
healthRoutes.post('/treatments', requirePermission('HEALTH', 'CREATE'), HealthController.createTreatment);
healthRoutes.put('/treatments/:id', requirePermission('HEALTH', 'UPDATE'), HealthController.updateTreatment);
healthRoutes.patch('/treatments/:id/administer', requirePermission('HEALTH', 'UPDATE'), HealthController.administerTreatment);
healthRoutes.delete('/treatments/:id', requirePermission('HEALTH', 'DELETE'), HealthController.deleteTreatment);

// Vaccinations (US-5.3)
healthRoutes.get('/animals/:animalId/vaccinations', requirePermission('HEALTH', 'READ'), HealthController.getVaccinationsByAnimal);
healthRoutes.get('/vaccinations/:id', requirePermission('HEALTH', 'READ'), HealthController.getVaccinationById);
healthRoutes.post('/vaccinations', requirePermission('HEALTH', 'CREATE'), HealthController.createVaccination);
healthRoutes.put('/vaccinations/:id', requirePermission('HEALTH', 'UPDATE'), HealthController.updateVaccination);
healthRoutes.patch('/vaccinations/:id/status', requirePermission('HEALTH', 'UPDATE'), HealthController.updateVaccinationStatus);
healthRoutes.delete('/vaccinations/:id', requirePermission('HEALTH', 'DELETE'), HealthController.deleteVaccination);

// Carnet (US-5.4)
healthRoutes.get('/animals/:animalId/carnet', requirePermission('HEALTH', 'READ'), HealthController.getCarnet);

// Rapport (US-5.6)
healthRoutes.get('/reports/summary', requirePermission('HEALTH', 'READ'), HealthController.getHealthReport);

// Interventions (US-5.7)
healthRoutes.get('/animals/:animalId/interventions', requirePermission('HEALTH', 'READ'), HealthController.getInterventionsByAnimal);
healthRoutes.get('/interventions/:id', requirePermission('HEALTH', 'READ'), HealthController.getInterventionById);
healthRoutes.post('/interventions', requirePermission('HEALTH', 'CREATE'), HealthController.createIntervention);
healthRoutes.put('/interventions/:id', requirePermission('HEALTH', 'UPDATE'), HealthController.updateIntervention);
healthRoutes.delete('/interventions/:id', requirePermission('HEALTH', 'DELETE'), HealthController.deleteIntervention);

export default healthRoutes;