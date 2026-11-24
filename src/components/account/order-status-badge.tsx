import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/server/orders/format";

const TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "new"> = {
  PAID: "neutral",
  PROCESSING: "warning",
  DISPATCHED: "new",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
  PARTIALLY_REFUNDED: "warning",
  PENDING_PAYMENT: "neutral",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={TONE[status] ?? "neutral"}>{ORDER_STATUS_LABEL[status] ?? status}</Badge>;
}
