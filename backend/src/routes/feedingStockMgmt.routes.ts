import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { FeedingStockMgmtController } from '../controllers/feedingStockMgmt.controller.js';

const feedingStockMgmtRoutes = new Hono();

feedingStockMgmtRoutes.use('*', isAuthenticated);

// ============================================
// Tableau de bord US-7.3 Stock Alimentaire
// ============================================
feedingStockMgmtRoutes.get(
  '/dashboard',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getStockManagementDashboard
);

// ============================================
// SP-1: Achats (Enregistrement / Modification)
// ============================================
feedingStockMgmtRoutes.post(
  '/purchases',
  requirePermission('FEEDING', 'CREATE'),
  FeedingStockMgmtController.createPurchase
);
feedingStockMgmtRoutes.put(
  '/purchases/:id',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingStockMgmtController.updatePurchase
);

// ============================================
// SP-2: Stock par type / catégorie
// ============================================
feedingStockMgmtRoutes.get(
  '/stock-by-type',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getStockByType
);

// ============================================
// SP-3: Historique des achats
// ============================================
feedingStockMgmtRoutes.get(
  '/purchase-history',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getPurchaseHistory
);

// ============================================
// SP-4: Alertes de péremption
// ============================================
feedingStockMgmtRoutes.get(
  '/expiry-alerts',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getExpiryAlerts
);

// ============================================
// SP-5: Mise à jour seuils minimaux
// ============================================
feedingStockMgmtRoutes.patch(
  '/thresholds',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingStockMgmtController.updateStockThreshold
);

// ============================================
// SP-6: Alertes stock critique
// ============================================
feedingStockMgmtRoutes.get(
  '/critical-stock-alerts',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getCriticalStockAlerts
);

// ============================================
// SP-7: Analyse coûts approvisionnement
// ============================================
feedingStockMgmtRoutes.get(
  '/cost-analysis',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getPurchaseCostAnalysis
);

// ============================================
// SP-8: Prédiction de rupture
// ============================================
feedingStockMgmtRoutes.get(
  '/stockout-predictions',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getStockoutPredictions
);

// ============================================
// US-7.4: FCR / Efficacité alimentaire
// ============================================
feedingStockMgmtRoutes.get(
  '/fcr',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getFCR
);

feedingStockMgmtRoutes.get(
  '/cost-per-animal',
  requirePermission('FEEDING', 'READ'),
  FeedingStockMgmtController.getFoodCostPerAnimal
);

export default feedingStockMgmtRoutes;
