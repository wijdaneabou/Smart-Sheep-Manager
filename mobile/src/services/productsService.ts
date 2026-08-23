import api from "./api";

export type ProductCategory = "AGNEAUX" | "MOUTONS" | "LAINE" | "VIANDE" | "AUTRE";
export type ProductAvailability = "DISPONIBLE" | "LIMITE" | "RUPTURE";

export type Product = {
  id: number;
  name: string;
  category: ProductCategory;
  description: string;
  price: string;
  availability: ProductAvailability;
  photos: string | null;
  specifications: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
  const data = err?.response?.data;

  const fieldErrors = data?.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstField = Object.keys(fieldErrors)[0];
    const firstMessage = fieldErrors[firstField]?.[0];
    if (firstMessage) return `${firstField} : ${firstMessage}`;
  }

  const formErrors = data?.error?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length > 0) {
    return formErrors[0];
  }

  const apiError = data?.error;
  if (typeof apiError === "string") return apiError;

  if (typeof data?.message === "string") return data.message;

  if (!err?.response) return "Impossible de contacter le serveur.";
  return `Erreur ${err.response.status} : la requête a été refusée.`;
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  availability?: ProductAvailability;
} = {}) {
  try {
    const response = await api.get<{
      data: Product[];
      pagination: Pagination;
    }>("/products", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getProductById(id: number) {
  try {
    const response = await api.get<{ data: Product }>(`/products/${id}`);
    return { success: true as const, product: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createProduct(input: {
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  availability?: ProductAvailability;
  photos?: string | null;
  specifications?: string | null;
}) {
  try {
    const response = await api.post<{ data: Product }>("/products", input);
    return {
      success: true as const,
      product: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateProduct(
  id: number,
  input: Partial<{
    name: string;
    category: ProductCategory;
    description: string;
    price: number;
    availability: ProductAvailability;
    photos: string | null;
    specifications: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: Product }>(`/products/${id}`, input);
    return {
      success: true as const,
      product: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteProduct(id: number) {
  try {
    await api.delete(`/products/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getProductCatalogPdf() {
  try {
    const response = await api.get<{ data: { pdfUrl: string } }>("/products/catalog/pdf", {
      responseType: "blob",
    });
    return { success: true as const, pdfUrl: response.data.data.pdfUrl };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getProductCatalogQr() {
  try {
    const response = await api.get<{ data: { qrUrl: string } }>("/products/catalog/qr");
    return { success: true as const, qrUrl: response.data.data.qrUrl };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
