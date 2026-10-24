import type { Co2Status } from "@/lib/co2";

export function Co2Badge({ co2 }: { co2: Co2Status }) {
  if (co2.status === "exempt") {
    return (
      <span title={co2.reason} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
        CO2 OK
      </span>
    );
  }
  const d = co2.exemptFrom ? ` (OK dès ${co2.exemptFrom.split("-").reverse().join(".")})` : "";
  return (
    <span title={co2.reason + d} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-800">
      Sanction CO2 possible{d}
    </span>
  );
}
