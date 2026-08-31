import {
  findOrderById,
  findOrderItemsByOrderId,
  findClientById,
  createOrder as createOrderInDb,
  createOrderItem as createOrderItemInDb,
  updateOrder as updateOrderInDb,
  deleteOrderItems,
  deleteOrder as deleteOrderInDb,
  listOrders as listOrdersInDb,
} from "../repositories/orders.repository.js";
import type { OrderItem } from "../repositories/orders.repository.js";

export type CreateOrderResult =
  | {
      success: true;
      status: 201;
      order: NonNullable<Awaited<ReturnType<typeof findOrderById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createOrder(input: {
  orderNumber: string;
  clientId: number;
  clientName: string;
  clientContact: string;
  status?: "BROUILLON" | "ENVOYE" | "VALIDE" | "EN_PREPARATION" | "EXPEDIE" | "LIVRE" | "FACTURE" | "PAYE";
  notes?: string | null;
  subtotal: number;
  tax?: number;
  total: number;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}): Promise<CreateOrderResult> {
  const client = await findClientById(input.clientId);
  if (!client) {
    return { success: false, status: 400, message: "Client introuvable." };
  }

  const order = await createOrderInDb({
    orderNumber: input.orderNumber,
    status: input.status ?? "BROUILLON",
    clientId: input.clientId,
    clientName: input.clientName,
    clientContact: input.clientContact,
    notes: input.notes ?? undefined,
    subtotal: String(input.subtotal),
    tax: String(input.tax ?? 0),
    total: String(input.total),
  });

  if (!order) {
    return { success: false, status: 400, message: "Erreur lors de la création de la commande." };
  }

  for (const item of input.items) {
    await createOrderItemInDb({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
    });
  }

  const fullOrder = await findOrderById(order.id);
  return { success: true, status: 201, order: fullOrder! };
}

export type UpdateOrderResult =
  | {
      success: true;
      status: 200;
      order: NonNullable<Awaited<ReturnType<typeof findOrderById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateOrder(
  id: number,
  input: {
    orderNumber?: string;
    clientId?: number;
    clientName?: string;
    clientContact?: string;
    status?: "BROUILLON" | "ENVOYE" | "VALIDE" | "EN_PREPARATION" | "EXPEDIE" | "LIVRE" | "FACTURE" | "PAYE";
    notes?: string | null;
    subtotal?: number;
    tax?: number;
    total?: number;
    items?: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }
): Promise<UpdateOrderResult> {
  const existing = await findOrderById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Commande introuvable." };
  }

  const clientId = input.clientId ?? existing.clientId;
  if (input.clientId) {
    const client = await findClientById(input.clientId);
    if (!client) {
      return { success: false, status: 400, message: "Client introuvable." };
    }
  }

  const updated = await updateOrderInDb(id, {
    orderNumber: input.orderNumber,
    clientId,
    clientName: input.clientName,
    clientContact: input.clientContact,
    status: input.status,
    notes: input.notes,
    subtotal: input.subtotal !== undefined ? String(input.subtotal) : undefined,
    tax: input.tax !== undefined ? String(input.tax) : undefined,
    total: input.total !== undefined ? String(input.total) : undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Commande introuvable." };
  }

  if (input.items) {
    await deleteOrderItems(id);
    for (const item of input.items) {
      await createOrderItemInDb({
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
      });
    }
  }

  const fullOrder = await findOrderById(id);
  return { success: true, status: 200, order: fullOrder! };
}

export type GetOrderResult =
  | {
      success: true;
      status: 200;
      order: NonNullable<Awaited<ReturnType<typeof findOrderById>>>;
      items: OrderItem[];
    }
  | { success: false; status: 404; message: string };

export async function getOrderById(id: number): Promise<GetOrderResult> {
  const order = await findOrderById(id);
  if (!order) {
    return { success: false, status: 404, message: "Commande introuvable." };
  }
  const items = await findOrderItemsByOrderId(id);
  return { success: true, status: 200, order, items };
}

export async function listOrders(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  clientId?: number;
}) {
  const { rows, total } = await listOrdersInDb(params);
  return {
    success: true,
    status: 200,
    orders: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteOrderResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteOrder(id: number): Promise<DeleteOrderResult> {
  const existing = await findOrderById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Commande introuvable." };
  }

  await deleteOrderInDb(id);
  return { success: true, status: 200, message: "Commande supprimée." };
}
