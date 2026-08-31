import type { Context } from "hono";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "../validators/products.validator.js";
import * as productsService from "../services/products.service.js";

export async function createProductHandler(c: Context) {
  const body = await c.req.json();

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await productsService.createProduct(parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.product }, 201);
}

export async function updateProductHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const body = await c.req.json();

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await productsService.updateProduct(id, parsed.data);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.product }, 200);
}

export async function getProductByIdHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await productsService.getProductById(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ data: result.product }, 200);
}

export async function listProductsHandler(c: Context) {
  const parsed = listProductsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await productsService.listProducts(parsed.data);
  return c.json(
    {
      data: result.products,
      pagination: result.pagination,
    },
    200
  );
}

export async function deleteProductHandler(c: Context) {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Identifiant invalide." }, 400);

  const result = await productsService.deleteProduct(id);
  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }
  return c.json({ message: result.message }, 200);
}

export async function getProductCatalogPdfHandler(c: Context) {
  const result = await productsService.generateProductCatalogPdf();
  if (!result.success) {
    return c.json({ error: result.message }, 500);
  }
  return c.json({ data: { pdfUrl: result.pdfUrl } }, 200);
}

export async function getProductCatalogQrHandler(c: Context) {
  const result = await productsService.generateProductCatalogQr();
  if (!result.success) {
    return c.json({ error: result.message }, 500);
  }
  return c.json({ data: { qrUrl: result.qrUrl } }, 200);
}
