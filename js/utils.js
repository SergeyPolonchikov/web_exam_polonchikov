import { PAGE_SIZE } from "./config.js";


export function showToast(type, title, message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const id = `toast-${crypto.randomUUID()}`;
  const icon = type === "success" ? "✅" : type === "warning" ? "⚠️" : "❌";
  const headerClass = type === "success" ? "text-bg-success" : type === "warning" ? "text-bg-warning" : "text-bg-danger";

  const html = `
    <div id="${id}" class="toast align-items-center ${headerClass} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
      <div class="d-flex">
        <div class="toast-body">
          <div class="fw-semibold">${icon} ${escapeHtml(title)}</div>
          <div>${escapeHtml(message)}</div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", html);

  // eslint-disable-next-line no-undef
  const toastEl = document.getElementById(id);
  // eslint-disable-next-line no-undef
  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDateISOToRu(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

export function formatDateTimeToRu(isoDateTime) {
  if (!isoDateTime) return "";
  const date = new Date(isoDateTime);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}

export function addHoursToTime(timeHHMM, hoursToAdd) {
  const [h, m] = timeHHMM.split(":").map((x) => parseInt(x, 10));
  const totalMin = h * 60 + m + Math.round(hoursToAdd * 60);
  const hh = Math.floor((totalMin % (24 * 60)) / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  const start = (current - 1) * pageSize;
  const end = start + pageSize;

  return {
    page: current,
    totalPages,
    slice: items.slice(start, end),
  };
}

export function renderPagination(rootEl, page, totalPages, onPage) {
  if (!rootEl) return;
  if (totalPages <= 1) {
    rootEl.innerHTML = "";
    return;
  }

  const makeItem = (p, label, disabled = false, active = false) => `
    <li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
      <a class="page-link" href="#" data-page="${p}">${label}</a>
    </li>
  `;

  const items = [];
  items.push(makeItem(page - 1, "«", page <= 1));

  // compact range
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  if (start > 1) items.push(makeItem(1, "1", false, page === 1));
  if (start > 2) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);

  for (let p = start; p <= end; p += 1) {
    items.push(makeItem(p, String(p), false, p === page));
  }

  if (end < totalPages - 1) items.push(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
  if (end < totalPages) items.push(makeItem(totalPages, String(totalPages), false, page === totalPages));

  items.push(makeItem(page + 1, "»", page >= totalPages));

  rootEl.innerHTML = `<ul class="pagination pagination-sm justify-content-center mb-0">${items.join("")}</ul>`;

  rootEl.querySelectorAll("a.page-link[data-page]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const p = Number(a.getAttribute("data-page"));
      if (!Number.isFinite(p)) return;
      onPage(p);
    });
  });
}

export function unique(arr) {
  return [...new Set(arr)];
}

export function pickLanguageFromCourse(courseName, knownLanguages) {
  const lower = (courseName || "").toLowerCase();
  // try exact match of known languages
  const found = knownLanguages.find((l) => lower.includes(l.toLowerCase()));
  return found || "";
}

export function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
