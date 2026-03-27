import axios from "axios";
import { Op } from "sequelize";

import { sequelize } from "../config/database";
import { Delivery } from "../models/Delivery";
import { DeliveryEarnings } from "../models/DeliveryEarnings";
import { DeliveryModel } from "../models/Delivery";
import { DeliveryRoute } from "../models/DeliveryRoute";
import { DeliveryRouteModel } from "../models/DeliveryRoute";
import { User } from "../models/User";
import { ApiError } from "../utils/apiError";
import { buildPaginationMeta, resolvePagination } from "../utils/pagination";

const routingClient = axios.create({ timeout: 1500 });

function asId(document: any) {
  return String(document._id);
}

function mapDelivery(delivery: any) {
  return {
    id: asId(delivery),
    orderId: delivery.orderId,
    trackingNumber: delivery.trackingNumber,
    customerName: delivery.customerName,
    customerPhone: delivery.customerPhone,
    customerEmail: delivery.customerEmail,
    address: delivery.address,
    coordinates: delivery.coordinates,
    scheduledTime: delivery.scheduledTime,
    actualTime: delivery.actualTime,
    status: delivery.status,
    priority: delivery.priority,
    itemsCount: delivery.itemsCount,
    weight: delivery.weight,
    specialInstructions: delivery.specialInstructions,
    proofStatus: delivery.proofStatus,
    overdue: delivery.overdue,
    routeId: delivery.routeId,
    items: delivery.items.map((item: any) => ({ id: String(item._id), ...item })),
    deliveryWindow: delivery.deliveryWindow,
    parkingInstructions: delivery.parkingInstructions,
    contactPerson: delivery.contactPerson,
    recipientRequirements: delivery.recipientRequirements,
    leaveInstructions: delivery.leaveInstructions,
    distanceFromCurrentKm: delivery.distanceFromCurrentKm,
    estimatedMinutesToReach: delivery.estimatedMinutesToReach,
    trafficConditions: delivery.trafficConditions,
    proof: delivery.proof ? { id: String(delivery.proof._id), ...delivery.proof } : undefined,
    issue: delivery.issue,
    history: delivery.history,
  };
}

function mapRoute(route: any) {
  return {
    id: asId(route),
    startLocation: route.startLocation,
    endLocation: route.endLocation,
    startAddress: route.startAddress,
    endAddress: route.endAddress,
    plannedDistanceKm: route.plannedDistanceKm,
    actualDistanceKm: route.actualDistanceKm,
    deliveriesCount: route.deliveriesCount,
    status: route.status,
    priority: route.priority,
    plannedDurationMinutes: route.plannedDurationMinutes,
    actualDurationMinutes: route.actualDurationMinutes,
    scheduledStartTime: route.scheduledStartTime,
    startTime: route.startTime,
    expectedCompletionTime: route.expectedCompletionTime,
    completionTime: route.completionTime,
    performanceLabel: route.performanceLabel,
    waypoints: route.waypoints.map((waypoint: any) => ({ id: String(waypoint._id), ...waypoint })),
    stops: route.stops.map((stop: any) => ({ id: String(stop._id), ...stop })),
    optimizationSuggestions: route.optimizationSuggestions,
    estimatedSavingsMinutes: route.estimatedSavingsMinutes,
    currentLocation: route.currentLocation ? { id: String(route.currentLocation._id), ...route.currentLocation } : undefined,
    vehicleInfo: route.vehicleInfo,
    fuelStatus: route.fuelStatus,
    weather: route.weather,
    roadConditions: route.roadConditions,
  };
}

function normalizeDeliveryRow(delivery: any) {
  const payload = delivery.payloadJson ?? {};
  return {
    ...payload,
    _id: delivery.id,
    id: delivery.id,
    orderId: payload.orderId ?? delivery.orderId,
    trackingNumber: payload.trackingNumber ?? delivery.trackingNumber,
    customerName: payload.customerName ?? delivery.customerName,
    customerPhone: payload.customerPhone ?? delivery.customerPhone,
    customerEmail: payload.customerEmail ?? delivery.customerEmail,
    address: payload.address ?? delivery.address,
    coordinates: payload.coordinates ?? { latitude: Number(delivery.latitude ?? 0), longitude: Number(delivery.longitude ?? 0) },
    scheduledTime: payload.scheduledTime ?? delivery.scheduledTime?.toISOString(),
    actualTime: payload.actualTime ?? delivery.actualTime?.toISOString(),
    status: payload.status ?? (typeof delivery.status === "string" ? delivery.status.replace(/_/g, " ").replace(/\b\w/g, (match: string) => match.toUpperCase()) : "Pending"),
    priority: payload.priority ?? (delivery.priority ? delivery.priority.charAt(0).toUpperCase() + delivery.priority.slice(1) : "Standard"),
    itemsCount: payload.itemsCount ?? delivery.itemsCount,
    weight: payload.weight ?? delivery.weight,
    specialInstructions: payload.specialInstructions ?? delivery.specialInstructions,
    proofStatus: payload.proofStatus ?? delivery.proofStatus,
    overdue: payload.overdue ?? Boolean(delivery.overdue),
    routeId: payload.routeId ?? delivery.routeId,
    items: payload.items ?? [],
    deliveryWindow: payload.deliveryWindow ?? delivery.deliveryWindow,
    parkingInstructions: payload.parkingInstructions ?? delivery.parkingInstructions,
    contactPerson: payload.contactPerson ?? delivery.contactPerson,
    recipientRequirements: payload.recipientRequirements ?? delivery.recipientRequirements,
    leaveInstructions: payload.leaveInstructions ?? delivery.leaveInstructions,
    distanceFromCurrentKm: Number(payload.distanceFromCurrentKm ?? delivery.distanceFromCurrentKm ?? 0),
    estimatedMinutesToReach: payload.estimatedMinutesToReach ?? delivery.estimatedMinutesToReach,
    trafficConditions: payload.trafficConditions ?? delivery.trafficConditions,
    proof: payload.proof ?? delivery.proofJson,
    issue: payload.issue ?? delivery.issueJson,
    history: payload.history ?? delivery.historyJson ?? [],
  };
}

async function resolveDriverId(completedByUserId?: string, transaction?: any) {
  const numericId = Number(completedByUserId);
  if (Number.isInteger(numericId) && numericId > 0) {
    return numericId;
  }

  const fallbackUser = await User.findOne({ where: { role: "delivery" }, transaction });
  if (!fallbackUser) {
    throw new ApiError(400, "No delivery user available for earnings attribution", "DELIVERY_USER_NOT_FOUND");
  }

  return fallbackUser.id;
}

export const deliveryService = {
  async getDashboard() {
    const [deliveries, routes] = await Promise.all([DeliveryModel.find().lean(), DeliveryRouteModel.find().lean()]);
    const active = deliveries.filter((delivery) => delivery.status === "In Transit" || delivery.status === "Pending");

    return {
      metrics: [
        { id: "assigned", label: "Assigned deliveries", value: String(deliveries.length), description: "Current route workload", icon: "truck", trendLabel: "+3 today", trendTone: "positive" },
        { id: "in-transit", label: "In transit", value: String(deliveries.filter((delivery) => delivery.status === "In Transit").length), description: "Active delivery drops", icon: "map-pinned", badgeLabel: "Live", badgeTone: "blue" },
        { id: "proof", label: "Proof pending", value: String(deliveries.filter((delivery) => delivery.proofStatus === "Proof pending").length), description: "Deliveries still needing proof capture", icon: "file-check", badgeLabel: "Attention", badgeTone: "yellow" },
      ],
      activeDeliveries: active.map((delivery) => ({
        id: asId(delivery),
        routeLabel: routes.find((route) => asId(route) === delivery.routeId)?.startLocation ?? "Assigned route",
        status: delivery.status === "In Transit" ? "IN TRANSIT" : delivery.status === "Delivered" ? "DELIVERED" : delivery.status === "Failed" ? "FAILED" : delivery.status === "Pending" ? "PENDING" : "AWAITING HANDOFF",
        etaLabel: `${delivery.estimatedMinutesToReach} min`,
        completedAt: delivery.actualTime,
        outstanding: `${delivery.itemsCount} items`,
        proofAttached: delivery.proofStatus === "Proof attached",
        customerName: delivery.customerName,
        customerPhone: delivery.customerPhone,
        address: delivery.address,
        orderId: delivery.orderId,
      })),
      routeInsights: [
        { id: "ri1", title: "Avoid peak congestion corridor", priority: "High", actionLabel: "Reroute", detail: "Move Negombo drop later to avoid coastal traffic spike." },
        { id: "ri2", title: "Combine Kandy return leg", priority: "Medium", actionLabel: "Review route", detail: "Pair supplier pickup with pending Kandy delivery." },
      ],
      notifications: [
        { id: "dn1", title: "Proof still pending", detail: "Crescent Retailers requires manager signature on delivery.", severity: "warning", read: false, timestamp: new Date().toISOString() },
      ],
      mapState: {
        liveTrackingEnabled: true,
        currentLocationLabel: routes[0]?.currentLocation?.name ?? "Route start",
        nextStopLabel: routes[0]?.stops.find((stop: any) => stop.status === "Not visited")?.customerName ?? "All stops visited",
        trafficMode: routes[0]?.roadConditions ?? "Normal",
      },
    };
  },

  async getDeliveriesData(query: Record<string, unknown> = {}) {
    const { page, limit, offset } = resolvePagination(query);
    const where: Record<string | symbol, unknown> = {};

    if (typeof query.status === "string") {
      where.status = query.status.toLowerCase().replace(/\s+/g, "_");
    }

    if (typeof query.routeId === "string" && query.routeId.trim()) {
      where.routeId = Number(query.routeId);
    }

    if (typeof query.scheduledDate === "string") {
      const start = new Date(query.scheduledDate);
      const end = new Date(query.scheduledDate);
      end.setHours(23, 59, 59, 999);
      where.scheduledTime = { [Op.between]: [start, end] };
    }

    const [pageResult, summaryRows] = await Promise.all([
      Delivery.findAndCountAll({
        where,
        order: [["scheduledTime", "ASC"]],
        limit,
        offset,
      }),
      Delivery.findAll({
        where,
        attributes: ["id", "status", "overdue", "proofStatus", "payloadJson", "scheduledTime"],
      }),
    ]);

    const mapped = pageResult.rows.map((delivery) => mapDelivery(normalizeDeliveryRow(delivery)));
    const summarized = summaryRows.map((delivery) => normalizeDeliveryRow(delivery));
    const total = pageResult.count || 1;
    const labels = ["Pending", "In Transit", "Delivered", "Failed", "On Hold", "Returned"] as const;

    return {
      summary: {
        totalAssigned: pageResult.count,
        completedToday: summarized.filter((delivery) => delivery.status === "Delivered").length,
        inTransit: summarized.filter((delivery) => delivery.status === "In Transit").length,
        pending: summarized.filter((delivery) => delivery.status === "Pending").length,
        failedIssues: summarized.filter((delivery) => delivery.status === "Failed").length,
        onTimeRate: "94%",
      },
      deliveries: mapped,
      pagination: buildPaginationMeta(pageResult.count, page, limit),
      statusBreakdown: labels.map((label) => {
        const value = summarized.filter((delivery) => delivery.status === label).length;
        return { label, value, percentage: Math.round((value / total) * 100) };
      }),
    };
  },

  async getDelivery(id: string) {
    const delivery = await DeliveryModel.findById(id).lean();
    if (!delivery) {
      throw new ApiError(404, "Delivery not found", "DELIVERY_NOT_FOUND");
    }
    return mapDelivery(delivery);
  },

  async completeDelivery(id: string, completedByUserId?: string) {
    const deliveryId = Number(id);
    if (!Number.isInteger(deliveryId)) {
      throw new ApiError(400, "Invalid delivery id", "INVALID_DELIVERY_ID");
    }

    await sequelize.transaction(async (transaction) => {
      const delivery: any = await Delivery.findByPk(deliveryId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!delivery) {
        throw new ApiError(404, "Delivery not found", "DELIVERY_NOT_FOUND");
      }

      if (delivery.status === "delivered") {
        return;
      }

      const actualTime = new Date();
      const existingPayload = delivery.payloadJson ?? {};
      const history = Array.isArray(existingPayload.history ?? delivery.historyJson) ? [...(existingPayload.history ?? delivery.historyJson)] : [];
      history.push(`Delivery completed at ${actualTime.toISOString()}`);

      delivery.status = "delivered";
      delivery.actualTime = actualTime;
      delivery.proofStatus = delivery.proofJson ? "Proof attached" : "Proof pending";
      delivery.historyJson = history;
      delivery.payloadJson = {
        ...existingPayload,
        status: "Delivered",
        actualTime: actualTime.toISOString(),
        proofStatus: delivery.proofStatus,
        history,
      };
      await delivery.save({ transaction });

      if (delivery.routeId) {
        const openDeliveries = await Delivery.count({
          where: {
            routeId: delivery.routeId,
            status: { [Op.notIn]: ["delivered", "failed", "returned"] },
          },
          transaction,
        });

        const route: any = await DeliveryRoute.findByPk(delivery.routeId, { transaction });
        if (route) {
          route.status = openDeliveries === 0 ? "completed" : "in_progress";
          route.completionTime = openDeliveries === 0 ? actualTime : route.completionTime;
          route.payloadJson = {
            ...(route.payloadJson ?? {}),
            status: openDeliveries === 0 ? "Completed" : "In Progress",
            completionTime: openDeliveries === 0 ? actualTime.toISOString() : route.completionTime,
          };
          await route.save({ transaction });
        }
      }

      const existingEarnings = await DeliveryEarnings.findOne({ where: { deliveryId }, transaction });
      if (!existingEarnings) {
        const driverId = await resolveDriverId(completedByUserId, transaction);
        const distance = Number(delivery.distanceFromCurrentKm ?? 0);
        const baseEarnings = 2000;
        const distanceBonus = Math.round(distance * 45);
        const onTimeBonus = delivery.overdue ? 0 : 300;
        const performanceBonus = delivery.proofStatus === "Proof attached" ? 150 : 75;
        const specialHandlingBonus = delivery.specialInstructions ? 100 : 0;
        const totalEarnings = baseEarnings + distanceBonus + onTimeBonus + performanceBonus + specialHandlingBonus;

        await DeliveryEarnings.create({
          driverId,
          deliveryId,
          routeId: delivery.routeId ?? null,
          baseEarnings,
          distanceBonus,
          onTimeBonus,
          performanceBonus,
          specialHandlingBonus,
          deductions: 0,
          totalEarnings,
          earnedDate: actualTime.toISOString().slice(0, 10),
          payoutStatus: "pending",
          paymentMethod: "Bank Transfer",
          notes: `Auto-generated on delivery completion for ${delivery.deliveryId}`,
        }, { transaction });
      }
    });

    return this.getDelivery(id);
  },

  async uploadProof(id: string, payload: Record<string, unknown>) {
    const delivery = await DeliveryModel.findById(id);
    if (!delivery) {
      throw new ApiError(404, "Delivery not found", "DELIVERY_NOT_FOUND");
    }
    delivery.proof = {
      ...(delivery.proof ?? {}),
      ...payload,
      timestamp: String(payload.timestamp ?? new Date().toISOString()),
      signatureCaptured: Boolean(payload.signatureCaptured ?? true),
      gpsConfirmed: Boolean(payload.gpsConfirmed ?? true),
    } as any;
    delivery.proofStatus = "Proof attached";
    delivery.history.push(`Proof uploaded at ${new Date().toISOString()}`);
    await delivery.save();
    return mapDelivery(delivery);
  },

  async reportIssue(id: string, payload: { reason: string; notes?: string; photoEvidence?: string[] }) {
    const delivery = await DeliveryModel.findById(id);
    if (!delivery) {
      throw new ApiError(404, "Delivery not found", "DELIVERY_NOT_FOUND");
    }
    delivery.status = "On Hold";
    delivery.issue = { reason: payload.reason, notes: payload.notes, photoEvidence: payload.photoEvidence ?? [] };
    delivery.history.push(`Issue reported: ${payload.reason}`);
    await delivery.save();
    return mapDelivery(delivery);
  },

  async getRoutesData() {
    const routes = await DeliveryRouteModel.find().lean();
    const mapped = routes.map(mapRoute);
    return {
      summary: {
        totalAssigned: mapped.length,
        inProgress: mapped.filter((route) => route.status === "In Progress").length,
        completedToday: mapped.filter((route) => route.status === "Completed").length,
        pending: mapped.filter((route) => route.status === "Pending").length,
        averageDistanceKm: `${Math.round(mapped.reduce((sum, route) => sum + route.plannedDistanceKm, 0) / Math.max(mapped.length, 1))} km`,
        averageDurationHours: `${(mapped.reduce((sum, route) => sum + route.plannedDurationMinutes, 0) / Math.max(mapped.length, 1) / 60).toFixed(1)} hrs`,
      },
      routes: mapped,
    };
  },

  async getRoute(id: string) {
    const route = await DeliveryRouteModel.findById(id).lean();
    if (!route) {
      throw new ApiError(404, "Route not found", "ROUTE_NOT_FOUND");
    }
    return mapRoute(route);
  },

  async startRoute(id: string) {
    const route = await DeliveryRouteModel.findById(id);
    if (!route) {
      throw new ApiError(404, "Route not found", "ROUTE_NOT_FOUND");
    }
    route.status = "In Progress";
    route.startTime = new Date().toISOString();
    await route.save();
    return mapRoute(route);
  },

  async endRoute(id: string) {
    const route = await DeliveryRouteModel.findById(id);
    if (!route) {
      throw new ApiError(404, "Route not found", "ROUTE_NOT_FOUND");
    }
    route.status = "Completed";
    route.completionTime = new Date().toISOString();
    await route.save();
    return mapRoute(route);
  },

  async optimizeRoute(id: string) {
    const route = await DeliveryRouteModel.findById(id).lean();
    if (!route) {
      throw new ApiError(404, "Route not found", "ROUTE_NOT_FOUND");
    }

    try {
      await routingClient.get("https://example.com", { params: { routeId: id } });
    } catch {
      // Ignore outbound failure and fall back to locally computed optimization hints.
    }

    return {
      routeId: id,
      suggestions: route.optimizationSuggestions,
      estimatedSavingsMinutes: route.estimatedSavingsMinutes,
    };
  },

  async getEarnings(period?: string) {
    const multiplier = period === "weekly" ? 1 : period === "monthly" ? 4 : 1;
    return {
      summaryCards: [
        { id: "net", label: "Net earnings", value: `LKR ${(84250 * multiplier).toLocaleString()}`, trend: "+6%", tone: "positive" },
        { id: "bonus", label: "Bonuses", value: `LKR ${(12150 * multiplier).toLocaleString()}`, tone: "positive" },
      ],
      breakdown: {
        baseEarnings: 70000 * multiplier,
        bonusEarnings: 9000 * multiplier,
        incentiveEarnings: 3150 * multiplier,
        deductions: 1900 * multiplier,
        netEarnings: 80250 * multiplier,
        onTimeBonus: 4000 * multiplier,
        performanceBonus: 2500 * multiplier,
        zeroIssueBonus: 1800 * multiplier,
        customerSatisfactionBonus: 2200 * multiplier,
        seasonalIncentives: 650 * multiplier,
      },
      daily: [
        { date: new Date().toISOString().slice(0, 10), dayOfWeek: "Thu", deliveriesCount: 7, baseEarnings: 11200, bonuses: 1800, deductions: 200, totalEarnings: 12800, onTimeRate: 96, performanceScore: 94 },
        { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), dayOfWeek: "Wed", deliveriesCount: 6, baseEarnings: 9800, bonuses: 1450, deductions: 150, totalEarnings: 11100, onTimeRate: 92, performanceScore: 91 },
      ],
      weeklyTrend: [{ period: "Week 1", earnings: 18200 }, { period: "Week 2", earnings: 19400 }, { period: "Week 3", earnings: 20800 }],
      monthlyTrend: [{ period: "Jan", earnings: 74200 }, { period: "Feb", earnings: 79500 }, { period: "Mar", earnings: 84250 }],
      details: {
        current: [
          { deliveryId: "DEL-1", orderId: "order-1001", basePayment: 2200, distanceKm: 14, timeMinutes: 58, onTimeBonus: 350, specialHandlingBonus: 200, performanceRating: 5, customerFeedback: "Great coordination", total: 2750 },
        ],
      },
      payoutHistory: [
        { id: "pay-1", payoutDate: new Date().toISOString(), periodCovered: "01 Mar - 15 Mar", amount: 38500, paymentMethod: "Bank Transfer", status: "Completed", transactionId: "PAYOUT-1001" },
      ],
      incentives: [
        { id: "inc-1", title: "On-time streak", description: "Maintain >95% on-time performance.", qualification: "10 consecutive deliveries", rewardAmount: "LKR 2,500", progress: 70, earned: false, periodLabel: "This week" },
      ],
      structureInfo: ["Base pay per delivery", "Distance uplift above 10km", "Proof and zero-issue incentives"],
      upcomingPayout: {
        estimatedDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        pendingAmount: 18250,
        paymentMethod: "Bank Transfer",
        bankAccountLabel: "HNB xxxx 4451",
      },
    };
  },

  async trackLocation(latitude: number, longitude: number) {
    return {
      latitude,
      longitude,
      accuracy: 6.4,
      battery: 78,
      signal: "4G",
      timestamp: new Date().toISOString(),
    };
  },

  async getNavigation() {
    const route = await DeliveryRouteModel.findOne({ status: "In Progress" }).lean();
    return {
      currentLocation: {
        latitude: route?.currentLocation?.latitude ?? 6.895,
        longitude: route?.currentLocation?.longitude ?? 79.856,
        accuracy: 6.4,
        battery: 78,
        signal: "4G",
        timestamp: new Date().toISOString(),
      },
      destination: route?.stops.find((stop: any) => stop.status === "Not visited")?.address ?? "All stops completed",
      etaMinutes: 12,
      nextTurn: "Turn left onto Duplication Road",
    };
  },

  async captureSignature(name: string) {
    return {
      captured: true,
      signedBy: name,
      timestamp: new Date().toISOString(),
    };
  },
};