/** RFC 5545 daily reminder with a link to the walk. */
export function buildIcs(opts: { walkId: number; url: string; hour: number; minute: number; tz?: string }): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(now);
  start.setHours(opts.hour, opts.minute, 0, 0);
  if (start.getTime() < now.getTime()) start.setDate(start.getDate() + 1);
  const local = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(opts.hour)}${pad(opts.minute)}00`;
  const tz = opts.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chog Twain//Daily walk//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:walk-${opts.walkId}-${stamp}@chog-twain`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${local}`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Show up for your Chog Twain walk",
    `DESCRIPTION:Tap I'm here before 00:00 UTC. Walk ${opts.walkId}.`,
    `URL:${opts.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Show up for your Chog Twain walk",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(name: string, body: string) {
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}