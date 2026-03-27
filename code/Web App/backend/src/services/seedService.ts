import bcrypt from "bcryptjs";

import { InventoryItemModel } from "../models/InventoryItem";
import { UserModel } from "../models/User";
import { WarehouseTaskModel } from "../models/WarehouseTask";
import { OrderModel } from "../models/Order";
import { DeliveryModel } from "../models/Delivery";
import { DeliveryRouteModel } from "../models/DeliveryRoute";
import { TransactionModel } from "../models/Transaction";
import { computeDaysToStockOut, computeInventoryStatus } from "../utils/inventory";

function iso(hoursFromNow = 0) {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
}

export async function seedDatabase() {
  const [userCount, inventoryCount, taskCount, orderCount, deliveryCount, routeCount, transactionCount] = await Promise.all([
    UserModel.countDocuments(),
    InventoryItemModel.countDocuments(),
    WarehouseTaskModel.countDocuments(),
    OrderModel.countDocuments(),
    DeliveryModel.countDocuments(),
    DeliveryRouteModel.countDocuments(),
    TransactionModel.countDocuments(),
  ]);

  if (userCount === 0) {
    const passwords = await Promise.all([
      bcrypt.hash("Admin@123", 10),
      bcrypt.hash("Manager@123", 10),
      bcrypt.hash("Warehouse@123", 10),
      bcrypt.hash("Delivery@123", 10),
      bcrypt.hash("Retailer@123", 10),
    ]);

    await UserModel.insertMany([
      { fullName: "System Admin", email: "admin@nestlesmartflow.com", passwordHash: passwords[0], role: "admin", phone: "+94 77 100 1000", company: "Nestle SmartFlow HQ", emailVerified: true },
      { fullName: "Maya Perera", email: "manager@nestlesmartflow.com", passwordHash: passwords[1], role: "manager", phone: "+94 77 100 1001", company: "Nestle SmartFlow HQ", city: "Colombo", emailVerified: true },
      { fullName: "Ruwan Silva", email: "warehouse@nestlesmartflow.com", passwordHash: passwords[2], role: "warehouse", phone: "+94 77 100 1002", company: "Colombo Warehouse", city: "Colombo", emailVerified: true },
      { fullName: "Ishara Fernando", email: "delivery@nestlesmartflow.com", passwordHash: passwords[3], role: "delivery", phone: "+94 77 100 1003", company: "Western Fleet", city: "Colombo", emailVerified: true },
      { fullName: "Dinuka Stores", email: "retailer@nestlesmartflow.com", passwordHash: passwords[4], role: "retailer", phone: "+94 77 100 1004", company: "Dinuka Stores", city: "Kandy", emailVerified: true },
    ]);
  }

  if (inventoryCount === 0) {
    const items = [
      { sku: "NES-COF-001", productName: "Nestle Gold Coffee", category: "Beverages", currentStock: 240, reorderLevel: 80, zone: "Zone A", location: "Aisle 1", rackLocation: "A1-R1", unitPrice: 1450, expiryDate: iso(24 * 120), barcode: "100000000001", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", loyaltyEligible: true },
      { sku: "NES-MIL-002", productName: "Milk Powder 1kg", category: "Dairy", currentStock: 72, reorderLevel: 90, zone: "Zone B", location: "Aisle 2", rackLocation: "B2-R4", unitPrice: 2450, expiryDate: iso(24 * 90), barcode: "100000000002", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150", loyaltyEligible: true },
      { sku: "NES-CER-003", productName: "Breakfast Cereal", category: "Breakfast", currentStock: 35, reorderLevel: 60, zone: "Zone C", location: "Aisle 5", rackLocation: "C5-R2", unitPrice: 1800, expiryDate: iso(24 * 60), barcode: "100000000003", image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", loyaltyEligible: true },
      { sku: "NES-CHO-004", productName: "Chocolate Bar", category: "Snacks", currentStock: 18, reorderLevel: 40, zone: "Zone C", location: "Aisle 6", rackLocation: "C6-R3", unitPrice: 320, expiryDate: iso(24 * 30), barcode: "100000000004", image: "https://images.unsplash.com/photo-1511381939415-e44015466834", loyaltyEligible: false },
      { sku: "NES-WAT-005", productName: "Pure Life Water", category: "Beverages", currentStock: 0, reorderLevel: 50, zone: "Zone D", location: "Bulk Yard", rackLocation: "D1-R1", unitPrice: 120, expiryDate: iso(24 * 180), barcode: "100000000005", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504", loyaltyEligible: false },
      { sku: "NES-KIT-006", productName: "KitKat Multipack", category: "Snacks", currentStock: 160, reorderLevel: 75, zone: "Zone A", location: "Aisle 3", rackLocation: "A3-R2", unitPrice: 950, expiryDate: iso(24 * 75), barcode: "100000000006", image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a", loyaltyEligible: true },
    ].map((item) => ({
      ...item,
      status: computeInventoryStatus(item.currentStock, item.reorderLevel),
      daysToStockOut: computeDaysToStockOut(item.currentStock),
    }));

    await InventoryItemModel.insertMany(items);
  }

  if (orderCount === 0) {
    await OrderModel.insertMany([
      {
        customerName: "Crescent Retailers",
        customerEmail: "procurement@crescent.lk",
        customerPhone: "+94 11 234 5678",
        orderDate: iso(-48),
        totalAmount: 148500,
        status: "Ready to Dispatch",
        region: "Western",
        store: "Colombo 03",
        priority: "High",
        assignedTo: "Maya Perera",
        lastUpdated: iso(-2),
        overdue: false,
        highValue: true,
        deliveryAddress: "12 Flower Road, Colombo 03",
        preferredDeliveryWindow: "09:00 - 11:00",
        deliveryInstructions: "Contact store manager on arrival",
        deliveryZone: "Central Colombo",
        assignedCarrier: "carrier-1",
        trackingNumber: "NSF-TRK-1001",
        paymentMethod: "Bank Transfer",
        paymentStatus: "Paid",
        transactionId: "TXN-1001",
        items: [
          { name: "Nestle Gold Coffee", sku: "NES-COF-001", image: "coffee.jpg", unitPrice: 1450, quantity: 50, subtotal: 72500 },
          { name: "Milk Powder 1kg", sku: "NES-MIL-002", image: "milk.jpg", unitPrice: 2450, quantity: 20, subtotal: 49000 },
        ],
        subtotal: 121500,
        tax: 12150,
        shippingCost: 6000,
        discount: 0,
        timeline: [
          { label: "Order received", timestamp: iso(-48), status: "completed" },
          { label: "Warehouse allocated", timestamp: iso(-20), status: "completed" },
          { label: "Ready to dispatch", timestamp: iso(-2), status: "active" },
        ],
        relatedOrderIds: [],
        notes: ["Priority customer", "Temperature-controlled slot requested"],
        communicationLog: ["Confirmed dispatch window with store manager"],
      },
      {
        customerName: "Hilltop Mart",
        customerEmail: "ops@hilltopmart.lk",
        customerPhone: "+94 81 555 1212",
        orderDate: iso(-30),
        totalAmount: 52400,
        status: "Processing",
        region: "Central",
        store: "Kandy City",
        priority: "Medium",
        assignedTo: "Maya Perera",
        lastUpdated: iso(-5),
        overdue: false,
        highValue: false,
        deliveryAddress: "88 Temple Street, Kandy",
        preferredDeliveryWindow: "13:00 - 16:00",
        deliveryZone: "Kandy",
        paymentMethod: "Card",
        paymentStatus: "Authorized",
        transactionId: "TXN-1002",
        items: [
          { name: "Breakfast Cereal", sku: "NES-CER-003", image: "cereal.jpg", unitPrice: 1800, quantity: 12, subtotal: 21600 },
          { name: "KitKat Multipack", sku: "NES-KIT-006", image: "kitkat.jpg", unitPrice: 950, quantity: 20, subtotal: 19000 },
        ],
        subtotal: 40600,
        tax: 4060,
        shippingCost: 2500,
        discount: 0,
        timeline: [
          { label: "Order received", timestamp: iso(-30), status: "completed" },
          { label: "Picking", timestamp: iso(-5), status: "active" },
          { label: "Ready to dispatch", timestamp: iso(5), status: "pending" },
        ],
        relatedOrderIds: [],
        notes: ["Awaiting cereal replenishment"],
      },
      {
        customerName: "Lanka Super",
        customerEmail: "stock@lankasuper.lk",
        customerPhone: "+94 31 400 3344",
        orderDate: iso(-72),
        totalAmount: 31400,
        status: "On Hold",
        region: "North Western",
        store: "Kurunegala",
        priority: "High",
        assignedTo: "Maya Perera",
        lastUpdated: iso(-12),
        overdue: true,
        blockedReason: "Carrier capacity exceeded",
        highValue: false,
        deliveryAddress: "22 Main Road, Kurunegala",
        preferredDeliveryWindow: "10:00 - 14:00",
        deliveryZone: "Kurunegala",
        paymentMethod: "Cash",
        paymentStatus: "Pending",
        transactionId: "TXN-1003",
        items: [
          { name: "Chocolate Bar", sku: "NES-CHO-004", image: "chocolate.jpg", unitPrice: 320, quantity: 60, subtotal: 19200 },
        ],
        subtotal: 19200,
        tax: 1920,
        shippingCost: 1800,
        discount: 500,
        promoCode: "REGION5",
        timeline: [
          { label: "Order received", timestamp: iso(-72), status: "completed" },
          { label: "Capacity review", timestamp: iso(-12), status: "active" },
          { label: "Dispatch", timestamp: iso(3), status: "pending" },
        ],
        relatedOrderIds: [],
        notes: ["Escalate to logistics lead if not cleared today"],
      },
      {
        customerName: "Metro Foods",
        customerEmail: "orders@metrofoods.lk",
        customerPhone: "+94 11 765 4321",
        orderDate: iso(-120),
        totalAmount: 88500,
        status: "Delivered",
        region: "Western",
        store: "Negombo",
        priority: "Low",
        assignedTo: "Maya Perera",
        lastUpdated: iso(-60),
        overdue: false,
        highValue: true,
        deliveryAddress: "45 Beach Road, Negombo",
        preferredDeliveryWindow: "08:00 - 10:00",
        deliveryZone: "Negombo",
        assignedCarrier: "carrier-2",
        trackingNumber: "NSF-TRK-0990",
        paymentMethod: "Bank Transfer",
        paymentStatus: "Paid",
        transactionId: "TXN-0990",
        items: [
          { name: "Pure Life Water", sku: "NES-WAT-005", image: "water.jpg", unitPrice: 120, quantity: 300, subtotal: 36000 },
          { name: "KitKat Multipack", sku: "NES-KIT-006", image: "kitkat.jpg", unitPrice: 950, quantity: 40, subtotal: 38000 },
        ],
        subtotal: 74000,
        tax: 7400,
        shippingCost: 3000,
        discount: 900,
        timeline: [
          { label: "Order received", timestamp: iso(-120), status: "completed" },
          { label: "Dispatched", timestamp: iso(-95), status: "completed" },
          { label: "Delivered", timestamp: iso(-60), status: "completed" },
        ],
        relatedOrderIds: [],
        notes: ["Delivered on time"],
        customerSatisfaction: "4.8/5",
      },
    ]);
  }

  if (taskCount === 0) {
    await WarehouseTaskModel.insertMany([
      { type: "Pick", title: "Pick coffee batch", description: "Prepare priority order NSF-TRK-1001", priority: "High", assignee: "Ruwan Silva", createdDate: iso(-8), dueTime: iso(2), status: "In Progress", progress: 60, zone: "Zone A", orderId: "Crescent Retailers", customerName: "Crescent Retailers", instructions: ["Validate lot numbers", "Use pallet wrap before transfer"] },
      { type: "Receive", title: "Receive milk shipment", description: "Inbound dock B receiving", priority: "Medium", assignee: "Anuja", createdDate: iso(-6), dueTime: iso(4), status: "Pending", progress: 0, zone: "Zone B", instructions: ["Capture invoice photos", "Inspect expiry dates"] },
      { type: "Dispatch", title: "Prepare dispatch manifests", description: "Label ready-to-dispatch orders", priority: "High", assignee: "Ruwan Silva", createdDate: iso(-3), dueTime: iso(1), status: "Pending", progress: 0, zone: "Dispatch Bay", instructions: ["Print carrier labels", "Confirm proof-of-loading checklist"] },
      { type: "Verify", title: "Cycle count critical stock", description: "Validate snack aisle variances", priority: "Low", assignee: "Chathuri", createdDate: iso(-24), dueTime: iso(6), status: "On Hold", progress: 35, zone: "Zone C", instructions: ["Check aisle 6 overflow", "Escalate discrepancies above 5 units"] },
    ]);
  }

  if (routeCount === 0) {
    await DeliveryRouteModel.insertMany([
      {
        startLocation: "Colombo DC",
        endLocation: "Western Loop Return",
        startAddress: "Warehouse 14, Colombo Port",
        endAddress: "Warehouse 14, Colombo Port",
        plannedDistanceKm: 48,
        actualDistanceKm: 20,
        deliveriesCount: 2,
        status: "In Progress",
        priority: "High Priority",
        plannedDurationMinutes: 190,
        actualDurationMinutes: 82,
        scheduledStartTime: iso(-6),
        startTime: iso(-5),
        expectedCompletionTime: iso(2),
        performanceLabel: "On schedule",
        waypoints: [
          { name: "Colombo DC", latitude: 6.935, longitude: 79.842 },
          { name: "Flower Road", latitude: 6.905, longitude: 79.86 },
          { name: "Negombo", latitude: 7.208, longitude: 79.835 },
        ],
        stops: [
          { deliveryId: "pending-1", orderId: "NSF-TRK-1001", customerName: "Crescent Retailers", address: "12 Flower Road, Colombo 03", sequence: 1, status: "Visited", deliveryWindow: "09:00 - 11:00", itemsCount: 70 },
          { deliveryId: "pending-2", orderId: "NSF-TRK-0990", customerName: "Metro Foods", address: "45 Beach Road, Negombo", sequence: 2, status: "Not visited", deliveryWindow: "08:00 - 10:00", itemsCount: 340 },
        ],
        optimizationSuggestions: ["Shift Negombo drop after fuel stop", "Avoid Galle Road congestion after 10:30"],
        estimatedSavingsMinutes: 18,
        currentLocation: { name: "Duplication Road", latitude: 6.895, longitude: 79.856 },
        vehicleInfo: "WP CAB-4455 / 14ft truck",
        fuelStatus: "68%",
        weather: "Clear",
        roadConditions: "Moderate traffic",
      },
      {
        startLocation: "Kandy Hub",
        endLocation: "Kandy Hub",
        startAddress: "92 William Gopallawa Mawatha, Kandy",
        endAddress: "92 William Gopallawa Mawatha, Kandy",
        plannedDistanceKm: 22,
        deliveriesCount: 1,
        status: "Pending",
        priority: "Standard",
        plannedDurationMinutes: 90,
        scheduledStartTime: iso(3),
        expectedCompletionTime: iso(6),
        performanceLabel: "Ahead of schedule",
        waypoints: [
          { name: "Kandy Hub", latitude: 7.29, longitude: 80.633 },
          { name: "Temple Street", latitude: 7.294, longitude: 80.64 },
        ],
        stops: [
          { deliveryId: "pending-3", orderId: "TXN-1002", customerName: "Hilltop Mart", address: "88 Temple Street, Kandy", sequence: 1, status: "Not visited", deliveryWindow: "13:00 - 16:00", itemsCount: 32 },
        ],
        optimizationSuggestions: ["Group pickup with supplier return route"],
        estimatedSavingsMinutes: 9,
        vehicleInfo: "CP BFG-2231 / van",
        fuelStatus: "92%",
        weather: "Cloudy",
        roadConditions: "Light traffic",
      },
    ]);
  }

  if (deliveryCount === 0) {
    const routes = await DeliveryRouteModel.find().lean();
    await DeliveryModel.insertMany([
      {
        orderId: "order-1001",
        trackingNumber: "NSF-TRK-1001",
        customerName: "Crescent Retailers",
        customerPhone: "+94 11 234 5678",
        customerEmail: "procurement@crescent.lk",
        address: "12 Flower Road, Colombo 03",
        coordinates: { latitude: 6.905, longitude: 79.86 },
        scheduledTime: iso(1),
        status: "In Transit",
        priority: "High",
        itemsCount: 70,
        weight: "185 kg",
        specialInstructions: "Unload through rear dock",
        proofStatus: "Proof pending",
        overdue: false,
        routeId: String(routes[0]?._id ?? ""),
        items: [
          { productName: "Nestle Gold Coffee", sku: "NES-COF-001", quantity: 50, image: "coffee.jpg" },
          { productName: "Milk Powder 1kg", sku: "NES-MIL-002", quantity: 20, image: "milk.jpg" },
        ],
        deliveryWindow: "09:00 - 11:00",
        parkingInstructions: "Service lane on left",
        contactPerson: "Store Manager",
        recipientRequirements: "Manager signature required",
        leaveInstructions: "Do not leave unattended",
        distanceFromCurrentKm: 3.8,
        estimatedMinutesToReach: 12,
        trafficConditions: "Moderate",
        history: ["Route started", "Loaded at dock 4", "Driver en route"],
      },
      {
        orderId: "order-0990",
        trackingNumber: "NSF-TRK-0990",
        customerName: "Metro Foods",
        customerPhone: "+94 11 765 4321",
        customerEmail: "orders@metrofoods.lk",
        address: "45 Beach Road, Negombo",
        coordinates: { latitude: 7.208, longitude: 79.835 },
        scheduledTime: iso(-50),
        actualTime: iso(-60),
        status: "Delivered",
        priority: "Standard",
        itemsCount: 340,
        weight: "480 kg",
        proofStatus: "Proof attached",
        overdue: false,
        routeId: String(routes[0]?._id ?? ""),
        items: [
          { productName: "Pure Life Water", sku: "NES-WAT-005", quantity: 300, image: "water.jpg" },
          { productName: "KitKat Multipack", sku: "NES-KIT-006", quantity: 40, image: "kitkat.jpg" },
        ],
        deliveryWindow: "08:00 - 10:00",
        distanceFromCurrentKm: 0,
        estimatedMinutesToReach: 0,
        trafficConditions: "Clear",
        proof: {
          photos: ["https://example.com/proof/0990-1.jpg"],
          signatureName: "N. Fernando",
          signatureCaptured: true,
          gpsConfirmed: true,
          timestamp: iso(-60),
          notes: "Delivered to receiving dock",
        },
        history: ["Arrived at customer", "Proof captured", "Delivery completed"],
      },
      {
        orderId: "order-1002",
        trackingNumber: "NSF-TRK-1002",
        customerName: "Hilltop Mart",
        customerPhone: "+94 81 555 1212",
        customerEmail: "ops@hilltopmart.lk",
        address: "88 Temple Street, Kandy",
        coordinates: { latitude: 7.294, longitude: 80.64 },
        scheduledTime: iso(4),
        status: "Pending",
        priority: "Standard",
        itemsCount: 32,
        weight: "78 kg",
        proofStatus: "Proof pending",
        overdue: false,
        routeId: String(routes[1]?._id ?? ""),
        items: [
          { productName: "Breakfast Cereal", sku: "NES-CER-003", quantity: 12, image: "cereal.jpg" },
          { productName: "KitKat Multipack", sku: "NES-KIT-006", quantity: 20, image: "kitkat.jpg" },
        ],
        deliveryWindow: "13:00 - 16:00",
        distanceFromCurrentKm: 9.2,
        estimatedMinutesToReach: 24,
        trafficConditions: "Light",
        history: ["Assigned to route"],
      },
    ]);
  }

  if (transactionCount === 0) {
    await TransactionModel.insertMany([
      { itemsCount: 12, amount: 18500, method: "Card", status: "Completed", cashierName: "Dinuka", topProduct: "Nestle Gold Coffee", createdAt: iso(-2), updatedAt: iso(-2) },
      { itemsCount: 8, amount: 9450, method: "Cash", status: "Completed", cashierName: "Dinuka", topProduct: "KitKat Multipack", createdAt: iso(-4), updatedAt: iso(-4) },
      { itemsCount: 16, amount: 22800, method: "Digital Wallet", status: "Completed", cashierName: "Dinuka", topProduct: "Milk Powder 1kg", createdAt: iso(-10), updatedAt: iso(-10) },
      { itemsCount: 4, amount: 3200, method: "Cash", status: "Refunded", cashierName: "Dinuka", topProduct: "Chocolate Bar", createdAt: iso(-28), updatedAt: iso(-28) },
      { itemsCount: 3, amount: 4500, method: "Mixed Payment", status: "Pending", cashierName: "Dinuka", topProduct: "Breakfast Cereal", createdAt: iso(-36), updatedAt: iso(-36) },
    ]);
  }
}