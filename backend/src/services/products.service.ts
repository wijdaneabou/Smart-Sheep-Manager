import {
  findProductById,
  createProduct as createProductInDb,
  updateProduct as updateProductInDb,
  deleteProduct as deleteProductInDb,
  listProducts as listProductsInDb,
} from "../repositories/products.repository.js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";

export type CreateProductResult =
  | {
      success: true;
      status: 201;
      product: NonNullable<Awaited<ReturnType<typeof findProductById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createProduct(input: {
  name: string;
  category: "AGNEAUX" | "MOUTONS" | "LAINE" | "VIANDE" | "AUTRE";
  description: string;
  price: number;
  availability?: "DISPONIBLE" | "LIMITE" | "RUPTURE";
  photos?: string | null;
  specifications?: string | null;
}): Promise<CreateProductResult> {
  const product = await createProductInDb({
    name: input.name,
    category: input.category,
    description: input.description,
    price: String(input.price),
    availability: input.availability ?? "DISPONIBLE",
    photos: input.photos ?? undefined,
    specifications: input.specifications ?? undefined,
  });

  if (!product) {
    return { success: false, status: 400, message: "Erreur lors de la création du produit." };
  }

  return { success: true, status: 201, product };
}

export type UpdateProductResult =
  | {
      success: true;
      status: 200;
      product: NonNullable<Awaited<ReturnType<typeof findProductById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateProduct(
  id: number,
  input: {
    name?: string;
    category?: "AGNEAUX" | "MOUTONS" | "LAINE" | "VIANDE" | "AUTRE";
    description?: string;
    price?: number;
    availability?: "DISPONIBLE" | "LIMITE" | "RUPTURE";
    photos?: string | null;
    specifications?: string | null;
  }
): Promise<UpdateProductResult> {
  const existing = await findProductById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Produit introuvable." };
  }

  const updated = await updateProductInDb(id, {
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price !== undefined ? String(input.price) : undefined,
    availability: input.availability,
    photos: input.photos ?? undefined,
    specifications: input.specifications ?? undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Produit introuvable." };
  }

  return { success: true, status: 200, product: updated };
}

export type GetProductResult =
  | {
      success: true;
      status: 200;
      product: NonNullable<Awaited<ReturnType<typeof findProductById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getProductById(id: number): Promise<GetProductResult> {
  const product = await findProductById(id);
  if (!product) {
    return { success: false, status: 404, message: "Produit introuvable." };
  }
  return { success: true, status: 200, product };
}

export async function listProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  availability?: string;
}) {
  const { rows, total } = await listProductsInDb(params);
  return {
    success: true,
    status: 200,
    products: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteProductResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteProduct(id: number): Promise<DeleteProductResult> {
  const existing = await findProductById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Produit introuvable." };
  }

  await deleteProductInDb(id);
  return { success: true, status: 200, message: "Produit supprimé." };
}

export type GenerateProductCatalogPdfResult =
  | { success: true; pdfUrl: string }
  | { success: false; message: string };

export async function generateProductCatalogPdf(): Promise<GenerateProductCatalogPdfResult> {
  try {
    const { rows } = await listProductsInDb({ page: 1, limit: 1000 });
    if (rows.length === 0) {
      return { success: false, message: "Aucun produit dans le catalogue." };
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const fileName = `catalog-${Date.now()}.pdf`;
    const filePath = join(process.cwd(), "uploads", fileName);

    doc.pipe(require("fs").createWriteStream(filePath));

    doc.fontSize(24).font("Helvetica-Bold").text("Catalogue Produits", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica").text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, { align: "center" });
    doc.moveDown(2);

    rows.forEach((product, index) => {
      doc.fontSize(16).font("Helvetica-Bold").text(`${index + 1}. ${product.name}`);
      doc.fontSize(11).font("Helvetica-Bold").text(`Catégorie : `, { continued: true }).font("Helvetica").text(product.category);
      doc.fontSize(11).font("Helvetica-Bold").text(`Prix : `, { continued: true }).font("Helvetica").text(`${Number(product.price).toFixed(2)} MAD`);
      doc.fontSize(11).font("Helvetica-Bold").text(`Disponibilité : `, { continued: true }).font("Helvetica").text(product.availability);
      doc.fontSize(11).font("Helvetica").text(product.description);
      if (product.specifications) {
        doc.fontSize(10).font("Helvetica-Oblique").text(`Fiche technique : ${product.specifications}`);
      }
      doc.moveDown(1.5);
    });

    doc.end();

    const pdfUrl = `/uploads/${fileName}`;
    return { success: true, pdfUrl };
  } catch (err) {
    return { success: false, message: "Erreur lors de la génération du PDF." };
  }
}

export type GenerateProductCatalogQrResult =
  | { success: true; qrUrl: string }
  | { success: false; message: string };

export async function generateProductCatalogQr(): Promise<GenerateProductCatalogQrResult> {
  try {
    const API_URL = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    const catalogUrl = `${API_URL}/api/products/catalog/view`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(catalogUrl)}`;
    return { success: true, qrUrl };
  } catch {
    return { success: false, message: "Erreur lors de la génération du QR code." };
  }
}
