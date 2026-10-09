export function formatDate(date: Date | string | null, format: string = "DD.MM.YYYY") {
  if (!date || date === "0001-01-01T00:00:00Z") {
    return "";
  }
  try {
    if (typeof date === "string") {
      date = new Date(date);
      if (isNaN(date.getTime())) {
        return "";
      }
    }
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    const ampm = hours24 >= 12 ? "PM" : "AM";

    return format
      .replace("YYYY", year.toString())
      .replace("MM", month)
      .replace("DD", day)
      .replace("hh", ("0" + hours12).slice(-2))
      .replace("mm", minutes)
      .replace("ss", seconds)
      .replace("A", ampm);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

export function timeAgo(dateString: Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return "just now";
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `${monthsAgo} month${monthsAgo > 1 ? "s" : ""} ago`;
  const yearsAgo = Math.floor(monthsAgo / 12);
  return `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago`;
}
