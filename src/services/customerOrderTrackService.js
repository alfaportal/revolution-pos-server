const { getSupabase } = require("../db");
const { verifyOrderTrackToken } = require("../lib/orderTrackToken");
const { isOrderAccepted } = require("../lib/salesOrderSelect");

function formatCustomerOrderStatus(row) {
  const status = String(row?.status || "ordered").trim().toLowerCase();
  const accepted = isOrderAccepted(row);

  let phase = "pending";
  let label = "Në pritje";
  let detail = "Restoranti do ta pranojë porosinë tuaj.";

  if (status === "cancelled") {
    phase = "cancelled";
    label = "Anuluar";
    detail = "Porosia u anulua.";
  } else if (status === "closed") {
    phase = "closed";
    label = "Përfunduar";
    detail = "Faleminderit! Porosia juaj u përfundua.";
  } else if (status === "ready") {
    phase = "ready";
    label = "Gati";
    detail = "Porosia juaj është gati.";
  } else if (accepted) {
    phase = "preparing";
    label = "Po përgatitet";
    detail = "Porosia u pranua dhe po përgatitet.";
  }

  return {
    ok: true,
    order_id: row.id,
    status,
    phase,
    label,
    detail,
    accepted_at: row.accepted_at || null,
    ready_at: row.ready_at || null,
    closed_at: row.closed_at || null,
    updated_at: row.ready_at || row.accepted_at || row.closed_at || row.ordered_at || null,
  };
}

async function getCustomerOrderStatus(clientId, orderId, token) {
  const oid = String(orderId || "").trim();
  if (!oid) throw new Error("Mungon porosia.");
  if (!verifyOrderTrackToken(clientId, oid, token)) {
    const err = new Error("Linku i statusit nuk është i vlefshëm.");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  const db = getSupabase();
  const { data: row, error } = await db
    .from("sales_orders")
    .select(
      "id, status, accepted_at, accepted_by_waiter_name, ready_at, closed_at, ordered_at, table_number, waiter_name, device_id",
    )
    .eq("client_id", clientId)
    .eq("id", oid)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    const err = new Error("Porosia nuk u gjet.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return formatCustomerOrderStatus(row);
}

module.exports = {
  getCustomerOrderStatus,
  formatCustomerOrderStatus,
};
