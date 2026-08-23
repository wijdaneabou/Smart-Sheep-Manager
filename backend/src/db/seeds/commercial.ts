import "dotenv/config";
import { db } from "../connection.js";
import { exploitations } from "../schema/exploitations.js";
import { clients } from "../schema/clients.js";
import { clientSegments } from "../schema/clientSegments.js";
import { clientLoyaltyProfiles } from "../schema/clientLoyaltyProfiles.js";
import { loyaltyOffers } from "../schema/loyaltyOffers.js";
import { loyaltyNotifications } from "../schema/loyaltyNotifications.js";
import { products } from "../schema/products.js";
import { orders, orderItems } from "../schema/orders.js";
import { deliveries } from "../schema/deliveries.js";
import { frameworkContracts } from "../schema/framework-contracts.js";
import { marketplaceListings } from "../schema/marketplace.js";
import { marketplaceMessages } from "../schema/marketplace.js";
import { marketplaceRatings } from "../schema/marketplace.js";
import { marketplaceTransactions } from "../schema/marketplace.js";
import { eq } from "drizzle-orm";

async function seedCommercial() {
  try {
    console.log("\n🌱 Seeding commercial module data...\n");

    const existingExploitations = await db.select().from(exploitations);
    if (existingExploitations.length === 0) {
      console.log("⚠️ Aucune exploitation trouvée. Exécutez d'abord les seeds préalables.");
      return;
    }

    const exploitation = existingExploitations[0];
    const exploitationId = exploitation.id;
    console.log(`ℹ️  Exploitation utilisée : ${exploitation.name} (ID: ${exploitationId})`);

    const existingClients = await db.select().from(clients);
    if (existingClients.length > 0) {
      console.log("ℹ️  Des clients existent déjà.");
    } else {
      const clientData = [
        { name: "Boucherie Centrale", contact: "Ahmed Benali", type: "BOUCHER", purchaseHistory: "Achat régulier d'agneaux", preferences: "Préférence agneaux de 35-40kg", notes: "Client fidèle depuis 2023" },
        { name: "SuperMarché Fresh", contact: "Fatima Zahra", type: "GROSSISTE", purchaseHistory: "Commandes hebdomadaires", preferences: "Besoins importants en viande", notes: "Négocie des prix de gros" },
        { name: "Coopérative Régionale", contact: "Omar Idrissi", type: "COOPERATIVE", purchaseHistory: "Achat saisonnier", preferences: "Agneaux de race locale", notes: "Partenariat longue durée" },
        { name: "Marché Local", contact: "Khadija Amrani", type: "ACHETEUR", purchaseHistory: "Achats occasionnels", preferences: "Petites quantités", notes: "Client occasionnel" },
        { name: "Restaurant Le Berger", contact: "Youssef Tazi", type: "BOUCHER", purchaseHistory: "Approvisionnement hebdomadaire", preferences: "Viande de qualité premium", notes: "Exigeant sur la qualité" },
      ];

      for (const client of clientData) {
        await db.insert(clients).values(client as any);
      }
      console.log(`✅ ${clientData.length} clients créés.`);
    }

    const existingSegments = await db.select().from(clientSegments);
    if (existingSegments.length > 0) {
      console.log("ℹ️  Des segments existent déjà.");
    } else {
      const segmentData = [
        { name: "VIP", description: "Clients très fidèles avec achats réguliers", minScore: 80, maxScore: 100, minFrequency: 10, maxFrequency: 999, minBasket: "2000.00", maxBasket: "99999.99", color: "#DC2626", isActive: true },
        { name: "Fidèle", description: "Clients réguliers", minScore: 50, maxScore: 79, minFrequency: 5, maxFrequency: 9, minBasket: "1000.00", maxBasket: "1999.99", color: "#F59E0B", isActive: true },
        { name: "Occasionnel", description: "Clients occasionnels", minScore: 20, maxScore: 49, minFrequency: 1, maxFrequency: 4, minBasket: "200.00", maxBasket: "999.99", color: "#10B981", isActive: true },
        { name: "Nouveau", description: "Nouveaux clients", minScore: 0, maxScore: 19, minFrequency: 0, maxFrequency: 0, minBasket: "0.00", maxBasket: "199.99", color: "#6B7280", isActive: true },
      ];

      for (const segment of segmentData) {
        await db.insert(clientSegments).values(segment as any);
      }
      console.log(`✅ ${segmentData.length} segments créés.`);
    }

    const allClients = await db.select().from(clients);
    const allSegments = await db.select().from(clientSegments);
    const clientIds = allClients.map(c => c.id);
    const segmentIds = allSegments.map(s => s.id);

    const existingProfiles = await db.select().from(clientLoyaltyProfiles);
    if (existingProfiles.length > 0) {
      console.log("ℹ️  Des profils de fidélité existent déjà.");
    } else if (clientIds.length > 0 && segmentIds.length > 0) {
      const profileData = [
        { clientId: clientIds[0], score: 85, purchaseFrequency: 12, averageBasket: "3500.00", totalPurchases: 24, totalSpent: "84000.00", lastPurchaseAt: new Date("2025-08-20"), segmentId: segmentIds[0], autoSegment: true },
        { clientId: clientIds[1], score: 65, purchaseFrequency: 8, averageBasket: "2100.00", totalPurchases: 16, totalSpent: "33600.00", lastPurchaseAt: new Date("2025-08-18"), segmentId: segmentIds[1], autoSegment: true },
        { clientId: clientIds[2], score: 45, purchaseFrequency: 4, averageBasket: "1800.00", totalPurchases: 8, totalSpent: "14400.00", lastPurchaseAt: new Date("2025-07-30"), segmentId: segmentIds[2], autoSegment: true },
        { clientId: clientIds[3], score: 15, purchaseFrequency: 1, averageBasket: "450.00", totalPurchases: 2, totalSpent: "900.00", lastPurchaseAt: new Date("2025-06-15"), segmentId: segmentIds[3], autoSegment: true },
        { clientId: clientIds[4], score: 72, purchaseFrequency: 9, averageBasket: "2800.00", totalPurchases: 18, totalSpent: "50400.00", lastPurchaseAt: new Date("2025-08-22"), segmentId: segmentIds[1], autoSegment: true },
      ];

      for (const profile of profileData) {
        await db.insert(clientLoyaltyProfiles).values(profile as any);
      }
      console.log(`✅ ${profileData.length} profils de fidélité créés.`);
    }

    const existingOffers = await db.select().from(loyaltyOffers);
    if (existingOffers.length > 0) {
      console.log("ℹ️  Des offres existent déjà.");
    } else if (segmentIds.length > 0) {
      const offerData = [
        { title: "Remise volume VIP", description: "5% de remise pour achats supérieurs à 5000 MAD", type: "VOLUME_DISCOUNT", segmentId: segmentIds[0], minQuantity: 10, discountPercentage: "5.00", validFrom: new Date("2025-01-01"), validTo: new Date("2025-12-31"), isActive: true },
        { title: "Offre fidélité", description: "3% de remise pour clients fidèles", type: "VOLUME_DISCOUNT", segmentId: segmentIds[1], minQuantity: 5, discountPercentage: "3.00", validFrom: new Date("2025-01-01"), validTo: new Date("2025-12-31"), isActive: true },
        { title: "Pack découverte", description: "Remise spéciale nouveaux clients", type: "TARGETED_OFFER", segmentId: segmentIds[3], minQuantity: 1, discountAmount: "150.00", validFrom: new Date("2025-01-01"), validTo: new Date("2025-06-30"), isActive: true },
      ];

      for (const offer of offerData) {
        await db.insert(loyaltyOffers).values(offer as any);
      }
      console.log(`✅ ${offerData.length} offres créées.`);
    }

    const existingNotifications = await db.select().from(loyaltyNotifications);
    if (existingNotifications.length > 0) {
      console.log("ℹ️  Des notifications existent déjà.");
    } else if (clientIds.length > 0 && segmentIds.length > 0) {
      const notificationData = [
        { title: "Nouveaux agneaux disponibles", message: "Nous avons reçu un nouveau lot d'agneaux de qualité supérieure.", type: "AVAILABILITY", clientId: clientIds[0], segmentId: segmentIds[0], isRead: false, sentAt: new Date("2025-08-20") },
        { title: "Promotion viande d'agneau", message: "Profitez de 5% de remise cette semaine sur tous nos agneaux.", type: "PRICE_DROP", clientId: null, segmentId: segmentIds[1], isRead: false, sentAt: new Date("2025-08-19") },
        { title: "Nouvelle race disponible", message: "Découvrez notre nouvelle race d'agneaux Timahdite.", type: "NEW_ARRIVAL", clientId: clientIds[1], segmentId: null, isRead: true, sentAt: new Date("2025-08-15") },
      ];

      for (const notification of notificationData) {
        await db.insert(loyaltyNotifications).values(notification as any);
      }
      console.log(`✅ ${notificationData.length} notifications créées.`);
    }

    const existingProducts = await db.select().from(products);
    if (existingProducts.length > 0) {
      console.log("ℹ️  Des produits existent déjà.");
    } else {
      const productData = [
        { name: "Agneau Sardi", category: "AGNEAUX", description: "Agneaux de race Sardi, élevés en plein air", price: "850.00", availability: "DISPONIBLE", photos: null, specifications: "Race: Sardi, Poids: 35-40kg" },
        { name: "Agneau Timahdite", category: "AGNEAUX", description: "Agneaux de race Timahdite, viande savoureuse", price: "920.00", availability: "DISPONIBLE", photos: null, specifications: "Race: Timahdite, Poids: 38-42kg" },
        { name: "Mouton D'man", category: "MOUTONS", description: "Moutons de race D'man, grande taille", price: "1500.00", availability: "LIMITE", photos: null, specifications: "Race: D'man, Poids: 50-60kg" },
        { name: "Laine brute", category: "LAINE", description: "Laine de mouton non traitée", price: "45.00", availability: "DISPONIBLE", photos: null, specifications: "Qualité standard" },
        { name: "Viande d'agneau hachée", category: "VIANDE", description: "Viande hachée d'agneau fraîche", price: "120.00", availability: "DISPONIBLE", photos: null, specifications: "500g par emballage" },
      ];

      for (const product of productData) {
        await db.insert(products).values(product as any);
      }
      console.log(`✅ ${productData.length} produits créés.`);
    }

    const allProducts = await db.select().from(products);
    const productIds = allProducts.map(p => p.id);

    const existingOrders = await db.select().from(orders);
    if (existingOrders.length > 0) {
      console.log("ℹ️  Des commandes existent déjà.");
    } else if (clientIds.length > 0 && productIds.length > 0) {
      const orderData = [
        { orderNumber: "CMD-2025-001", status: "VALIDE", clientId: clientIds[0], clientName: "Boucherie Centrale", clientContact: "Ahmed Benali", notes: "Livraison urgente", subtotal: "8500.00", tax: "1700.00", total: "10200.00" },
        { orderNumber: "CMD-2025-002", status: "EN_PREPARATION", clientId: clientIds[1], clientName: "SuperMarché Fresh", clientContact: "Fatima Zahra", notes: null, subtotal: "15000.00", tax: "3000.00", total: "18000.00" },
        { orderNumber: "CMD-2025-003", status: "EXPEDIE", clientId: clientIds[2], clientName: "Coopérative Régionale", clientContact: "Omar Idrissi", notes: "Emballez soigneusement", subtotal: "4500.00", tax: "900.00", total: "5400.00" },
        { orderNumber: "CMD-2025-004", status: "LIVRE", clientId: clientIds[4], clientName: "Restaurant Le Berger", clientContact: "Youssef Tazi", notes: null, subtotal: "3200.00", tax: "640.00", total: "3840.00" },
        { orderNumber: "CMD-2025-005", status: "BROUILLON", clientId: clientIds[3], clientName: "Marché Local", clientContact: "Khadija Amrani", notes: "En attente de confirmation", subtotal: "1200.00", tax: "240.00", total: "1440.00" },
      ];

      for (const order of orderData) {
        await db.insert(orders).values(order as any);
      }
      console.log(`✅ ${orderData.length} commandes créées.`);

      const allOrders = await db.select().from(orders);
      const orderIds = allOrders.map(o => o.id);

      const existingOrderItems = await db.select().from(orderItems);
      if (existingOrderItems.length === 0) {
        const orderItemData = [
          { orderId: orderIds[0], productId: productIds[0], productName: "Agneau Sardi", quantity: 10, unitPrice: "850.00", totalPrice: "8500.00" },
          { orderId: orderIds[0], productId: productIds[3], productName: "Laine brute", quantity: 5, unitPrice: "45.00", totalPrice: "225.00" },
          { orderId: orderIds[1], productId: productIds[0], productName: "Agneau Sardi", quantity: 15, unitPrice: "850.00", totalPrice: "12750.00" },
          { orderId: orderIds[1], productId: productIds[1], productName: "Agneau Timahdite", quantity: 2, unitPrice: "920.00", totalPrice: "1840.00" },
          { orderId: orderIds[1], productId: productIds[2], productName: "Mouton D'man", quantity: 1, unitPrice: "1500.00", totalPrice: "1500.00" },
          { orderId: orderIds[2], productId: productIds[0], productName: "Agneau Sardi", quantity: 5, unitPrice: "850.00", totalPrice: "4250.00" },
          { orderId: orderIds[3], productId: productIds[1], productName: "Agneau Timahdite", quantity: 3, unitPrice: "920.00", totalPrice: "2760.00" },
          { orderId: orderIds[3], productId: productIds[4], productName: "Viande d'agneau hachée", quantity: 9, unitPrice: "120.00", totalPrice: "1080.00" },
          { orderId: orderIds[4], productId: productIds[4], productName: "Viande d'agneau hachée", quantity: 10, unitPrice: "120.00", totalPrice: "1200.00" },
        ];

        for (const item of orderItemData) {
          await db.insert(orderItems).values(item as any);
        }
        console.log(`✅ ${orderItemData.length} articles de commande créés.`);
      }
    }

    const existingDeliveries = await db.select().from(deliveries);
    if (existingDeliveries.length > 0) {
      console.log("ℹ️  Des livraisons existent déjà.");
    } else if (clientIds.length > 0) {
      const deliveryData = [
        { deliveryNumber: "LIV-2025-001", status: "LIVRE", deliveryDate: "2025-08-20", address: "12 Rue des Bergers, Casablanca", carrier: "Transport Express", trackingNumber: "TRK-001", deliveryNote: "Livré en bon état", clientId: clientIds[0], clientName: "Boucherie Centrale", clientContact: "Ahmed Benali", notes: null },
        { deliveryNumber: "LIV-2025-002", status: "EN_COURS", deliveryDate: "2025-08-22", address: "45 Ave. Mohammed V, Rabat", carrier: "Livraison Rapide", trackingNumber: "TRK-002", deliveryNote: null, clientId: clientIds[1], clientName: "SuperMarché Fresh", clientContact: "Fatima Zahra", notes: "Livraison prioritaire" },
        { deliveryNumber: "LIV-2025-003", status: "EN_ATTENTE", deliveryDate: "2025-08-25", address: "78 Bd. Anfa, Casablanca", carrier: "Transport Express", trackingNumber: "TRK-003", deliveryNote: null, clientId: clientIds[2], clientName: "Coopérative Régionale", clientContact: "Omar Idrissi", notes: "Préparer emballage spécial" },
      ];

      for (const delivery of deliveryData) {
        await db.insert(deliveries).values(delivery as any);
      }
      console.log(`✅ ${deliveryData.length} livraisons créées.`);
    }

    const existingContracts = await db.select().from(frameworkContracts);
    if (existingContracts.length > 0) {
      console.log("ℹ️  Des contrats-cadres existent déjà.");
    } else if (clientIds.length > 0) {
      const contractData = [
        { contractNumber: "CTR-2025-001", status: "ACTIF", clientId: clientIds[0], clientName: "Boucherie Centrale", monthlyVolume: "20", yearlyVolume: "240", negotiatedPrice: "800.00", startDate: "2025-01-01", endDate: "2025-12-31", clauses: "Livraison hebdomadaire garantie", schedule: "Livraison chaque lundi", notes: "Contrat annuel avec prix négocié" },
        { contractNumber: "CTR-2025-002", status: "ACTIF", clientId: clientIds[1], clientName: "SuperMarché Fresh", monthlyVolume: "50", yearlyVolume: "600", negotiatedPrice: "780.00", startDate: "2025-01-01", endDate: "2025-12-31", clauses: "Volume minimum garanti", schedule: "Livraison bi-mensuelle", notes: "Contrat gros volume" },
        { contractNumber: "CTR-2025-003", status: "EN_NEGOCIATION", clientId: clientIds[4], clientName: "Restaurant Le Berger", monthlyVolume: "10", yearlyVolume: "120", negotiatedPrice: "900.00", startDate: "2025-09-01", endDate: "2026-08-31", clauses: "Qualité premium exigée", schedule: "Livraison sur demande", notes: "En cours de négociation" },
      ];

      for (const contract of contractData) {
        await db.insert(frameworkContracts).values(contract as any);
      }
      console.log(`✅ ${contractData.length} contrats-cadres créés.`);
    }

    const existingListings = await db.select().from(marketplaceListings);
    if (existingListings.length > 0) {
      console.log("ℹ️  Des annonces marketplace existent déjà.");
    } else if (clientIds.length > 0) {
      const listingData = [
        { animalId: null, sellerId: 1, sellerName: "Ferme Test", title: "Agneaux Sardi à vendre", description: "Lot de 10 agneaux Sardi de 35kg chacun, élevés en bio.", price: "8500.00", currency: "MAD", location: "Casablanca, Maroc", status: "PUBLISHED", photos: null, specifications: "Race: Sardi, Age: 6 mois", viewsCount: 45 },
        { animalId: null, sellerId: 1, sellerName: "Ferme Test", title: "Moutons D'man reproducteurs", description: "Bélier et brebis D'man pour reproduction.", price: "12000.00", currency: "MAD", location: "Rabat, Maroc", status: "PUBLISHED", photos: null, specifications: "Race: D'man, Age: 2 ans", viewsCount: 28 },
        { animalId: null, sellerId: 2, sellerName: "Élevage du Soleil", title: "Laine brute de qualité", description: "Laine de mouton mérinos, 50kg disponibles.", price: "2250.00", currency: "MAD", location: "Marrakech, Maroc", status: "SOLD", photos: null, specifications: "Qualité supérieure", viewsCount: 12 },
      ];

      for (const listing of listingData) {
        await db.insert(marketplaceListings).values(listing as any);
      }
      console.log(`✅ ${listingData.length} annonces marketplace créées.`);
    }

    const allListings = await db.select().from(marketplaceListings);
    const listingIds = allListings.map(l => l.id);

    const existingMessages = await db.select().from(marketplaceMessages);
    if (existingMessages.length === 0 && listingIds.length > 0 && clientIds.length > 0) {
      const messageData = [
        { listingId: listingIds[0], senderId: clientIds[0], receiverId: 1, message: "Bonjour, les agneaux sont-ils toujours disponibles ?", readAt: null },
        { listingId: listingIds[0], senderId: 1, receiverId: clientIds[0], message: "Oui, ils sont toujours disponibles. Quand pouvez-vous venir ?", readAt: new Date("2025-08-20") },
        { listingId: listingIds[1], senderId: clientIds[1], receiverId: 1, message: "Quel est le prix négociable pour les deux ?", readAt: null },
      ];

      for (const message of messageData) {
        await db.insert(marketplaceMessages).values(message as any);
      }
      console.log(`✅ ${messageData.length} messages marketplace créés.`);
    }

    const existingRatings = await db.select().from(marketplaceRatings);
    if (existingRatings.length === 0 && listingIds.length > 0 && clientIds.length > 0) {
      const ratingData = [
        { listingId: listingIds[2], raterId: clientIds[2], ratedUserId: 2, rating: 5, comment: "Laine de excellente qualité, livraison rapide." },
        { listingId: listingIds[2], raterId: clientIds[3], ratedUserId: 2, rating: 4, comment: "Bon produit, légèrement cher." },
      ];

      for (const rating of ratingData) {
        await db.insert(marketplaceRatings).values(rating as any);
      }
      console.log(`✅ ${ratingData.length} évaluations marketplace créées.`);
    }

    const existingTransactions = await db.select().from(marketplaceTransactions);
    if (existingTransactions.length === 0 && listingIds.length > 0) {
      const transactionData = [
        { listingId: listingIds[2], buyerId: 2, sellerId: 3, amount: "2250.00", status: "COMPLETED", escrowReference: "ESC-2025-001" },
      ];

      for (const transaction of transactionData) {
        await db.insert(marketplaceTransactions).values(transaction as any);
      }
      console.log(`✅ ${transactionData.length} transactions marketplace créées.`);
    }

    console.log("\n📊 Résumé de la seed commerciale :");
    console.log(`   - Exploitation : ${exploitation.name} (ID: ${exploitationId})`);
    console.log("   - Clients, segments, profils, offres, notifications");
    console.log("   - Produits, commandes, articles de commande");
    console.log("   - Livraisons, contrats-cadres");
    console.log("   - Annonces, messages, évaluations, transactions marketplace");
    console.log("\n✅ Seed commercial terminée avec succès.\n");
  } catch (error) {
    console.error("❌ Erreur lors de la seed commerciale :", error);
  } finally {
    process.exit(0);
  }
}

seedCommercial();
