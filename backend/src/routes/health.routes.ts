import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { HealthController } from '../controllers/health.controller.js';

const healthRoutes = new Hono();

healthRoutes.use('*', isAuthenticated);

// ─── Health Records (US-5.1) ────────────────────────────────
healthRoutes.get('/records', requirePermission('HEALTH_RECORD', 'READ'), HealthController.getHealthRecords);
healthRoutes.get('/animals/:animalId/records', requirePermission('HEALTH_RECORD', 'READ'), HealthController.getHealthRecords);
healthRoutes.get('/animals/:animalId/latest', requirePermission('HEALTH_RECORD', 'READ'), HealthController.getLatestHealthRecord);
healthRoutes.get('/records/:id', requirePermission('HEALTH_RECORD', 'READ'), HealthController.getHealthRecordById);
healthRoutes.post('/records', requirePermission('HEALTH_RECORD', 'CREATE'), HealthController.createHealthRecord);
healthRoutes.put('/records/:id', requirePermission('HEALTH_RECORD', 'UPDATE'), HealthController.updateHealthRecord);
healthRoutes.delete('/records/:id', requirePermission('HEALTH_RECORD', 'DELETE'), HealthController.deleteHealthRecord);

// ─── Treatments (US-5.2) ────────────────────────────────────
healthRoutes.get('/treatments/health-record/:healthRecordId', requirePermission('TREATMENT', 'READ'), HealthController.getTreatmentsByHealthRecord);
healthRoutes.get('/treatments/:id', requirePermission('TREATMENT', 'READ'), HealthController.getTreatmentById);
healthRoutes.post('/treatments', requirePermission('TREATMENT', 'CREATE'), HealthController.createTreatment);
healthRoutes.put('/treatments/:id', requirePermission('TREATMENT', 'UPDATE'), HealthController.updateTreatment);
healthRoutes.patch('/treatments/:id/administer', requirePermission('TREATMENT', 'ADMINISTER'), HealthController.administerTreatment);
healthRoutes.delete('/treatments/:id', requirePermission('TREATMENT', 'DELETE'), HealthController.deleteTreatment);

// ─── Vaccinations (US-5.3) ──────────────────────────────────
healthRoutes.get('/animals/:animalId/vaccinations', requirePermission('VACCINATION', 'READ'), HealthController.getVaccinationsByAnimal);
healthRoutes.get('/vaccinations/:id', requirePermission('VACCINATION', 'READ'), HealthController.getVaccinationById);
healthRoutes.post('/vaccinations', requirePermission('VACCINATION', 'CREATE'), HealthController.createVaccination);
healthRoutes.put('/vaccinations/:id', requirePermission('VACCINATION', 'UPDATE'), HealthController.updateVaccination);
healthRoutes.patch('/vaccinations/:id/status', requirePermission('VACCINATION', 'UPDATE'), HealthController.updateVaccinationStatus);
healthRoutes.delete('/vaccinations/:id', requirePermission('VACCINATION', 'DELETE'), HealthController.deleteVaccination);

// ─── Carnet sanitaire (US-5.4) ──────────────────────────────
healthRoutes.get('/animals/:animalId/carnet', requirePermission('HEALTH_RECORD', 'READ'), HealthController.getCarnet);

// ─── Health Report (US-5.6) ─────────────────────────────────
healthRoutes.get('/reports/summary', requirePermission('HEALTH_REPORT', 'READ'), HealthController.getHealthReport);

// ─── Veterinary Interventions (US-5.7) ──────────────────────
healthRoutes.get('/animals/:animalId/interventions', requirePermission('INTERVENTION', 'READ'), HealthController.getInterventionsByAnimal);
healthRoutes.get('/interventions/:id', requirePermission('INTERVENTION', 'READ'), HealthController.getInterventionById);
healthRoutes.post('/interventions', requirePermission('INTERVENTION', 'CREATE'), HealthController.createIntervention);
healthRoutes.put('/interventions/:id', requirePermission('INTERVENTION', 'UPDATE'), HealthController.updateIntervention);
healthRoutes.delete('/interventions/:id', requirePermission('INTERVENTION', 'DELETE'), HealthController.deleteIntervention);

export default healthRoutes;