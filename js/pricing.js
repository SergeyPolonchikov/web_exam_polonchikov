import { addHoursToTime } from "./utils.js";

const FIXED_HOLIDAYS = [

  "01-01", "01-02", "01-03", "01-04", "01-05", "01-06", "01-07", "01-08",
  "02-23",
  "03-08",
  "05-01",
  "05-09",
  "06-12",
  "11-04",
];

export function isWeekendOrHoliday(dateISO) {
  if (!dateISO) return 1;
  const d = new Date(dateISO + "T00:00:00");
  const dow = d.getDay(); // 0 Sunday
  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const isHoliday = FIXED_HOLIDAYS.includes(mmdd);
  const weekend = dow === 0 || dow === 6;
  return (weekend || isHoliday) ? 1.5 : 1;
}

export function timeSurcharges(timeHHMM) {
  if (!timeHHMM) return { morning: 0, evening: 0 };
  const [h] = timeHHMM.split(":").map((x) => parseInt(x, 10));
  const morning = (h >= 9 && h < 12) ? 400 : 0;
  const evening = (h >= 18 && h < 20) ? 1000 : 0;
  return { morning, evening };
}


export function computePrice({
  feePerHour,
  durationHours,
  dateISO,
  timeHHMM,
  students,
  options,
  courseWeeks = 0,
  weeklyHours = 0,
}) {
  const multWeekend = isWeekendOrHoliday(dateISO);
  const { morning, evening } = timeSurcharges(timeHHMM);

  let total = ((feePerHour * durationHours * multWeekend) + morning + evening) * students;


  if (options.early_registration) total *= 0.9; // -10%
  if (options.group_enrollment) total *= 0.85; // -15%
  if (options.intensive_course) total *= 1.2; // +20%


  if (options.excursions) total *= 1.25; // +25%
  if (options.interactive) total *= 1.5; // +50%

  if (options.supplementary) total += 2000 * students;
  if (options.personalized) total += 1500 * Math.max(0, courseWeeks);
  if (options.assessment) total += 300;

  return Math.round(total);
}

export function computeCourseEndDate(dateISO, totalWeeks) {
  if (!dateISO || !totalWeeks) return "";
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + (Math.max(1, totalWeeks) - 1) * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function computeLessonEndTime(timeStart, lessonHours) {
  return addHoursToTime(timeStart, lessonHours);
}

export function inferAutoOptions({ dateISO, persons, weeklyHours }) {
  const now = new Date();
  const start = dateISO ? new Date(dateISO + "T00:00:00") : null;
  const early = start ? (start.getTime() - now.getTime()) >= (30 * 24 * 60 * 60 * 1000) : false;
  const group = persons >= 5;
  const intensive = weeklyHours >= 5;
  return { early, group, intensive };
}
