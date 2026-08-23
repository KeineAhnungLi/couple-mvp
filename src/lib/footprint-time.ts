export const FOOTPRINT_TIME_ZONE = "Asia/Shanghai";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: FOOTPRINT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: FOOTPRINT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatShanghaiDateKey = (value: Date | string): string =>
  dateKeyFormatter.format(typeof value === "string" ? new Date(value) : value);

export const getShanghaiDateParts = (value: Date | string = new Date()) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = partsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
};

export const formatShanghaiMonthKey = (value: Date | string): string => {
  const { year, month } = getShanghaiDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}`;
};

export const formatShanghaiMonthDayLabel = (value: Date | string): string => {
  const { month, day } = getShanghaiDateParts(value);
  return `${month}月${day}日`;
};
