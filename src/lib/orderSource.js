const WEB_WAITER = "WEB-WAITER";
const WEB_KIOSK = "WEB-KIOSK";

function isKioskWaiterName(name) {
  const n = String(name || "").trim().toLowerCase();
  return n === "kiosk" || n.startsWith("tavolin");
}

function orderSourceLabel({ device_id, waiter_name } = {}) {
  const device = String(device_id || "").trim().toUpperCase();
  if (device === WEB_KIOSK || isKioskWaiterName(waiter_name)) {
    return { code: "table", label: "Tavolinë", icon: "🪑" };
  }
  if (device === WEB_WAITER) {
    return { code: "waiter", label: "Kamarier", icon: "📱" };
  }
  return { code: "pos", label: "POS", icon: "🖥️" };
}

function isBarMobileOrder(order) {
  const device = String(order?.device_id || "").trim().toUpperCase();
  return device === WEB_WAITER || device === WEB_KIOSK;
}

module.exports = {
  WEB_WAITER,
  WEB_KIOSK,
  isKioskWaiterName,
  orderSourceLabel,
  isBarMobileOrder,
};
