const WEB_WAITER = "WEB-WAITER";
const WEB_KIOSK = "WEB-KIOSK";
const WEB_PUBLIC = "WEB-PUBLIC";

function isKioskWaiterName(name) {
  const n = String(name || "").trim().toLowerCase();
  return n === "kiosk" || n.startsWith("tavolin");
}

function publicOrderWaiterLabel(orderType, name, phone, deliveryAddress) {
  const kind = orderType === "delivery" ? "Delivery" : "Takeaway";
  const customer = String(name || "").trim();
  const tel = String(phone || "").trim();
  let label = `${kind}: ${customer} (${tel})`;
  if (orderType === "delivery") {
    const addr = String(deliveryAddress || "").trim();
    if (addr) label += ` · ${addr}`;
  }
  return label;
}

function publicOrderTypeFromWaiter(waiterName) {
  const w = String(waiterName || "").trim().toLowerCase();
  if (w.startsWith("delivery")) return "delivery";
  if (w.startsWith("takeaway")) return "takeaway";
  return null;
}

function orderSourceLabel({ device_id, waiter_name } = {}) {
  const device = String(device_id || "").trim().toUpperCase();
  if (device === WEB_PUBLIC) {
    const kind = publicOrderTypeFromWaiter(waiter_name);
    if (kind === "delivery") return { code: "delivery", label: "Delivery", icon: "🛵" };
    return { code: "takeaway", label: "Takeaway", icon: "🥡" };
  }
  if (device === WEB_KIOSK || isKioskWaiterName(waiter_name)) {
    return { code: "table", label: "Tavolinë", icon: "🪑" };
  }
  if (device === WEB_WAITER) {
    return { code: "waiter", label: "Kamarier", icon: "📱" };
  }
  return { code: "pos", label: "POS", icon: "🖥️" };
}

function isPublicWebOrder(order) {
  return String(order?.device_id || "").trim().toUpperCase() === WEB_PUBLIC;
}

function isBarMobileOrder(order) {
  const device = String(order?.device_id || "").trim().toUpperCase();
  if (device === WEB_WAITER || device === WEB_KIOSK || device === WEB_PUBLIC) return true;
  if (isKioskWaiterName(order?.waiter_name)) return true;
  return false;
}

module.exports = {
  WEB_WAITER,
  WEB_KIOSK,
  WEB_PUBLIC,
  isKioskWaiterName,
  publicOrderWaiterLabel,
  publicOrderTypeFromWaiter,
  orderSourceLabel,
  isPublicWebOrder,
  isBarMobileOrder,
};
