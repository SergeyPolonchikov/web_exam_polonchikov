import { api } from "./api.js";
import { PAGE_SIZE } from "./config.js";
import {
  showToast,
  paginate,
  renderPagination,
  escapeHtml,
  formatDateISOToRu,
  clampInt,
} from "./utils.js";
import { computePrice, inferAutoOptions } from "./pricing.js";

let orders = [];
let courses = [];
let tutors = [];
let orderPage = 1;

function ensureYear() {
  const el = document.getElementById("yearNow");
  if (el) el.textContent = String(new Date().getFullYear());
}

function findCourse(id) {
  return courses.find((c) => c.id === id) || null;
}

function findTutor(id) {
  return tutors.find((t) => t.id === id) || null;
}

function normalizeBool(x) {
  return Boolean(x);
}

function orderTitle(order) {
  if (order.course_id && order.course_id !== 0) {
    const c = findCourse(order.course_id);
    return c ? `Курс: ${c.name}` : `Курс #${order.course_id}`;
  }
  if (order.tutor_id && order.tutor_id !== 0) {
    const t = findTutor(order.tutor_id);
    return t ? `Репетитор: ${t.name}` : `Репетитор #${order.tutor_id}`;
  }
  return "Заявка";
}

function orderDesc(order) {
  if (order.course_id && order.course_id !== 0) {
    const c = findCourse(order.course_id);
    return c ? (c.description || "") : "";
  }
  return "";
}

function renderOrders() {
  const tbody = document.getElementById("ordersTbody");
  const pagRoot = document.getElementById("ordersPagination");

  const { slice, totalPages, page } = paginate(orders, orderPage, PAGE_SIZE);
  orderPage = page;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-body-secondary">
      У вас пока нет заявок. Перейдите на главную страницу и создайте заявку.
    </td></tr>`;
    renderPagination(pagRoot, 1, 1, () => {});
    return;
  }

  tbody.innerHTML = slice.map((o, idx) => {
    const title = orderTitle(o);
    const date = formatDateISOToRu(o.date_start);
    const time = escapeHtml(o.time_start || "—");
    const price = escapeHtml(String(o.price || "—"));
    return `
      <tr>
        <td>${(orderPage - 1) * PAGE_SIZE + idx + 1}</td>
        <td>
          <div class="fw-semibold">${escapeHtml(title)}</div>
          <div class="small text-body-secondary">ID: ${escapeHtml(String(o.id))}</div>
        </td>
        <td>${escapeHtml(date)}</td>
        <td>${time}</td>
        <td class="fw-semibold">${price} ₽</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" data-action="details" data-id="${o.id}">Подробнее</button>
            <button class="btn btn-outline-primary" data-action="edit" data-id="${o.id}">Изменить</button>
            <button class="btn btn-outline-danger" data-action="delete" data-id="${o.id}">Удалить</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderPagination(pagRoot, orderPage, totalPages, (p) => {
    orderPage = p;
    renderOrders();
  });

  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      const action = e.currentTarget.getAttribute("data-action");
      if (action === "details") openDetailsModal(id);
      if (action === "edit") openEditModal(id);
      if (action === "delete") openDeleteModal(id);
    });
  });
}

function openDetailsModal(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const modalId = "detailsModal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const title = orderTitle(order);
  const desc = orderDesc(order);
  const opts = {
    early_registration: normalizeBool(order.early_registration),
    group_enrollment: normalizeBool(order.group_enrollment),
    intensive_course: normalizeBool(order.intensive_course),
    supplementary: normalizeBool(order.supplementary),
    personalized: normalizeBool(order.personalized),
    excursions: normalizeBool(order.excursions),
    assessment: normalizeBool(order.assessment),
    interactive: normalizeBool(order.interactive),
  };

  const list = Object.entries(opts)
    .filter(([, v]) => v)
    .map(([k]) => `<li><code>${escapeHtml(k)}</code></li>`)
    .join("") || "<li class='text-body-secondary'>Нет</li>";

  const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-0">${escapeHtml(title)}</h5>
              <div class="small text-body-secondary">Заявка #${escapeHtml(String(order.id))}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${desc ? `<p>${escapeHtml(desc)}</p>` : ""}
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Дата</div>
                  <div class="fw-semibold">${escapeHtml(order.date_start)}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Время</div>
                  <div class="fw-semibold">${escapeHtml(order.time_start)}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Стоимость</div>
                  <div class="fw-semibold">${escapeHtml(String(order.price))} ₽</div>
                </div>
              </div>
              <div class="col-12">
                <div class="fw-semibold mb-2">Применённые скидки/надбавки</div>
                <ul class="mb-0">${list}</ul>
              </div>
            </div>
            <div class="small text-body-secondary mt-3">
              Примечание: расчёт стоимости на главной странице выполняется по формуле ТЗ.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
    document.getElementById(modalId).remove();
  });
}

function openDeleteModal(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const modalId = "deleteModal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Подтверждение удаления</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Вы уверены, что хотите удалить заявку?
            <div class="small text-body-secondary mt-2">ID: ${escapeHtml(String(order.id))}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Нет</button>
            <button class="btn btn-danger" type="button" id="confirmDelete">Да</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  document.getElementById("confirmDelete").addEventListener("click", async () => {
    try {
      await api.deleteOrder(orderId);
      orders = orders.filter((o) => o.id !== orderId);
      showToast("success", "Удалено", "Заявка удалена.");
      modal.hide();
      renderOrders();
    } catch (err) {
      showToast("danger", "Ошибка", err.message || "Не удалось удалить заявку.");
    }
  });

  document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
    document.getElementById(modalId).remove();
  });
}

function openEditModal(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const isCourse = order.course_id && order.course_id !== 0;
  const course = isCourse ? findCourse(order.course_id) : null;
  const tutor = !isCourse ? findTutor(order.tutor_id) : null;

  const feePerHour = isCourse ? Number(course?.course_fee_per_hour || 0) : Number(tutor?.price_per_hour || 0);
  const weeklyHours = isCourse ? Number(course?.week_length || 0) : 0;
  const courseWeeks = isCourse ? Number(course?.total_length || 0) : 0;

  const modalId = "editModal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const titleText = isCourse ? "Редактирование заявки" : "Редактирование занятия с репетитором";

  const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <form id="editForm">
            <div class="modal-header">
              <div>
                <h5 class="modal-title mb-0">${escapeHtml(titleText)}</h5>
                <div class="small text-body-secondary">Заявка #${escapeHtml(String(order.id))}</div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Курс</label>
                  <input class="form-control" value="${escapeHtml(isCourse ? (course?.name || `Курс #${order.course_id}`) : "—")}" readonly>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Преподаватель / Репетитор</label>
                  <input class="form-control" value="${escapeHtml(isCourse ? (course?.teacher || "—") : (tutor?.name || `Репетитор #${order.tutor_id}`))}" readonly>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Дата</label>
                  <input type="date" class="form-control" id="dateStart" value="${escapeHtml(order.date_start)}" required>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Время</label>
                  <input type="time" class="form-control" id="timeStart" value="${escapeHtml(order.time_start)}" required>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Кол-во студентов (1–20)</label>
                  <input type="number" class="form-control" id="persons" min="1" max="20" value="${escapeHtml(String(order.persons || 1))}" required>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label">Длительность (ч)</label>
                  <input type="number" class="form-control" id="duration" min="1" max="${isCourse ? "1000" : "40"}" value="${escapeHtml(String(order.duration || 1))}" required>
                  <div class="form-text">${isCourse ? "Для курсов можно оставлять как есть" : "Для репетиторов: 1–40"}</div>
                </div>

                <div class="col-12 col-md-8">
                  <div class="fw-semibold mt-2">Дополнительные опции</div>
                  <div class="row g-2 mt-1">
                    ${checkbox("supplementary", "Доп. материалы (+2000 ₽/студ.)", order.supplementary)}
                    ${checkbox("personalized", "Индивидуальные (+1500 ₽/нед.)", order.personalized)}
                    ${checkbox("excursions", "Экскурсии (+25%)", order.excursions)}
                    ${checkbox("assessment", "Оценка уровня (+300 ₽)", order.assessment)}
                    ${checkbox("interactive", "Интерактив (+50%)", order.interactive)}
                  </div>
                </div>

                <div class="col-12">
                  <div class="card border-0 bg-body-tertiary rounded-4">
                    <div class="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <div class="small text-body-secondary">Новая стоимость (пересчёт по формуле)</div>
                        <div class="fs-4 fw-bold" id="priceOut">—</div>
                        <div class="small text-body-secondary">Будни/выходные и надбавки зависят от даты/времени.</div>
                      </div>
                      <button class="btn btn-outline-secondary" type="button" id="recalcBtn">Пересчитать</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Отмена</button>
              <button class="btn btn-primary" type="submit">Сохранить</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  const dateEl = document.getElementById("dateStart");
  const timeEl = document.getElementById("timeStart");
  const personsEl = document.getElementById("persons");
  const durationEl = document.getElementById("duration");
  const priceOut = document.getElementById("priceOut");

  function currentOptions(dateISO, persons) {
    const auto = inferAutoOptions({ dateISO, persons, weeklyHours });
    return {
      early_registration: auto.early,
      group_enrollment: auto.group,
      intensive_course: auto.intensive,
      supplementary: document.getElementById("opt_supplementary").checked,
      personalized: document.getElementById("opt_personalized").checked,
      excursions: document.getElementById("opt_excursions").checked,
      assessment: document.getElementById("opt_assessment").checked,
      interactive: document.getElementById("opt_interactive").checked,
    };
  }

  function recalc() {
    const dateISO = dateEl.value;
    const timeHHMM = timeEl.value;
    const persons = clampInt(personsEl.value, 1, 20, 1);
    personsEl.value = String(persons);

    let dur = Number(durationEl.value || 1);
    if (!Number.isFinite(dur)) dur = 1;

    if (!isCourse) {
      dur = clampInt(dur, 1, 40, 1);
    } else {
      dur = Math.max(1, Math.round(dur));
    }
    durationEl.value = String(dur);

    const opts = currentOptions(dateISO, persons);

    const price = computePrice({
      feePerHour,
      durationHours: dur,
      dateISO,
      timeHHMM,
      students: persons,
      options: opts,
      courseWeeks,
      weeklyHours,
    });
    priceOut.textContent = `${price} ₽`;
    return { price, opts, dur, persons, dateISO, timeHHMM };
  }

  document.getElementById("recalcBtn").addEventListener("click", () => {
    recalc();
  });

  // initial
  recalc();

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const { price, opts, dur, persons, dateISO, timeHHMM } = recalc();

    // IMPORTANT: booleans must be present in PUT payload
    const payload = {
      date_start: dateISO,
      time_start: timeHHMM,
      duration: dur,
      persons,
      price,
      ...opts,
    };

    try {
      const updated = await api.updateOrder(orderId, payload);
      // replace locally
      orders = orders.map((o) => (o.id === orderId ? updated : o));
      showToast("success", "Успех", "Заявка обновлена.");
      modal.hide();
      renderOrders();
    } catch (err) {
      showToast("danger", "Ошибка", err.message || "Не удалось обновить заявку.");
    }
  });

  document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
    document.getElementById(modalId).remove();
  });
}

function checkbox(key, label, checked) {
  const id = `opt_${key}`;
  return `
    <div class="col-12 col-md-6">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="${id}" ${checked ? "checked" : ""}>
        <label class="form-check-label" for="${id}">${escapeHtml(label)}</label>
      </div>
    </div>
  `;
}

async function loadAll() {
  try {
    // cache courses/tutors to show human-readable titles
    const [c, t, o] = await Promise.all([api.getCourses(), api.getTutors(), api.getOrders()]);
    courses = Array.isArray(c) ? c : [];
    tutors = Array.isArray(t) ? t : [];
    orders = Array.isArray(o) ? o : [];

    // newest first
    orders.sort((a, b) => Number(b.id) - Number(a.id));

    renderOrders();
    showToast("success", "Готово", `Заявок: ${orders.length}`);
  } catch (err) {
    showToast("danger", "Ошибка загрузки", err.message || "Не удалось загрузить заявки.");
    document.getElementById("ordersTbody").innerHTML = `<tr><td colspan="6" class="p-4 text-center text-body-secondary">Ошибка загрузки</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ensureYear();
  loadAll();
});
