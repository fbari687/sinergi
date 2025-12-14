import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export function formatIndonesianDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return format(date, "d MMMM yyyy", { locale: id });
}

export function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return formatDistanceToNow(date, { addSuffix: true, locale: id });
}
