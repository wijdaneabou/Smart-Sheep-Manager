import { Hono } from "hono";
import {
  createProductHandler,
  updateProductHandler,
  getProductByIdHandler,
  listProductsHandler,
  deleteProductHandler,
  getProductCatalogPdfHandler,
  getProductCatalogQrHandler,
} from "../controllers/products.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const productsRoutes = new Hono();

productsRoutes.use("*", isAuthenticated);

productsRoutes.post("/", requirePermission("PRODUCTS", "CREATE"), createProductHandler);
productsRoutes.put("/:id", requirePermission("PRODUCTS", "UPDATE"), updateProductHandler);
productsRoutes.get(
  "/:id",
  requirePermission("PRODUCTS", "READ"),
  getProductByIdHandler
);
productsRoutes.get(
  "/",
  requirePermission("PRODUCTS", "READ"),
  listProductsHandler
);
productsRoutes.delete("/:id", requirePermission("PRODUCTS", "DELETE"), deleteProductHandler);
productsRoutes.get(
  "/catalog/pdf",
  requirePermission("PRODUCTS", "READ"),
  getProductCatalogPdfHandler
);
productsRoutes.get(
  "/catalog/qr",
  requirePermission("PRODUCTS", "READ"),
  getProductCatalogQrHandler
);

export default productsRoutes;
