import { api } from "./api.js";
import { PAGE_SIZE } from "./config.js";
import {
  showToast,
  paginate,
  renderPagination,
  escapeHtml,
  formatDateTimeToRu,
  pickLanguageFromCourse,
  clampInt,
} from "./utils.js";
import {
  computePrice,
  computeCourseEndDate,
  computeLessonEndTime,
  inferAutoOptions,
} from "./pricing.js";

let courses = [];
let tutors = [];

let coursePage = 1;
let filteredCourses = [];
let selectedCourseId = null;

let filteredTutors = [];
let selectedTutorId = null;

function ensureYear() {
  const el = document.getElementById("yearNow");
  if (el) el.textContent = String(new Date().getFullYear());
}

function getCourseById(id) {
  return courses.find((c) => c.id === id) || null;
}

function getTutorById(id) {
  return tutors.find((t) => t.id === id) || null;
}

function computeCourseDurationHours(course) {
  return Number(course.total_length) * Number(course.week_length);
}

function buildStartDatesMap(course) {
  // course.start_dates: Array[DateTime]
  const map = {};
  (course.start_dates || []).forEach((dt) => {
    const d = new Date(dt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateISO = `${yyyy}-${mm}-${dd}`;
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const time = `${hh}:${mi}`;
    if (!map[dateISO]) map[dateISO] = [];
    map[dateISO].push(time);
  });

  // sort times
  Object.keys(map).forEach((date) => {
    map[date] = map[date].sort();
  });
  return map;
}

function renderCourses() {
  const tbody = document.getElementById("coursesTbody");
  const pagRoot = document.getElementById("coursesPagination");
  const btnOpen = document.getElementById("btnOpenOrderCourse");

  const { slice, totalPages, page } = paginate(filteredCourses, coursePage, PAGE_SIZE);
  coursePage = page;

  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-body-secondary">Ничего не найдено</td></tr>`;
    renderPagination(pagRoot, 1, 1, () => {});
    btnOpen.disabled = true;
    selectedCourseId = null;
    return;
  }

  tbody.innerHTML = slice
    .map((c, idx) => {
      const isSelected = c.id === selectedCourseId;
      const badge = c.level ? `<span class="badge text-bg-secondary">${escapeHtml(c.level)}</span>` : "";
      const startPreview = (c.start_dates && c.start_dates.length) ? formatDateTimeToRu(c.start_dates[0]) : "—";
      const desc = escapeHtml(c.description || "");
      const rowClass = isSelected ? "table-primary" : "";
      return `
        <tr class="${rowClass}">
          <td>${(coursePage - 1) * PAGE_SIZE + idx + 1}</td>
          <td>
            <div class="fw-semibold">${escapeHtml(c.name)}</div>
            <div class="small text-body-secondary truncate-2" title="${desc}">${desc}</div>
          </td>
          <td>${badge}</td>
          <td>${escapeHtml(c.teacher || "—")}</td>
          <td class="small">${escapeHtml(startPreview)}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" data-action="details" data-id="${c.id}">Подробнее</button>
              <button class="btn btn-outline-primary" data-action="select" data-id="${c.id}">${isSelected ? "Выбран" : "Выбрать"}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(pagRoot, coursePage, totalPages, (p) => {
    coursePage = p;
    renderCourses();
  });

  btnOpen.disabled = !selectedCourseId;

  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      const action = e.currentTarget.getAttribute("data-action");

      if (action === "select") {
        selectedCourseId = (selectedCourseId === id) ? null : id;
        btnOpen.disabled = !selectedCourseId;
        // try auto-filter tutors by course language
        autoFilterTutorsByCourse();
        renderCourses();
        return;
      }

      if (action === "details") {
        openCourseDetailsModal(id);
      }
    });
  });
}

function openCourseDetailsModal(courseId) {
  const course = getCourseById(courseId);
  if (!course) return;

  const modalId = "courseDetailsModal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-0">${escapeHtml(course.name)}</h5>
              <div class="small text-body-secondary">${escapeHtml(course.level || "")} • ${escapeHtml(course.teacher || "")}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">${escapeHtml(course.description || "")}</p>
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Длительность (нед.)</div>
                  <div class="fw-semibold">${escapeHtml(course.total_length)}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Часов в неделю</div>
                  <div class="fw-semibold">${escapeHtml(course.week_length)}</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Стоимость/час</div>
                  <div class="fw-semibold">${escapeHtml(course.course_fee_per_hour)} ₽</div>
                </div>
              </div>
            </div>

            <hr class="my-4">
            <div class="fw-semibold mb-2">Доступные даты/время старта (из API)</div>
            <ul class="mb-0">
              ${(course.start_dates || []).slice(0, 12).map((dt) => `<li class="small">${escapeHtml(formatDateTimeToRu(dt))}</li>`).join("")}
            </ul>
            ${(course.start_dates || []).length > 12 ? `<div class="small text-body-secondary mt-2">…и ещё ${(course.start_dates || []).length - 12}</div>` : ""}
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Закрыть</button>
            <button class="btn btn-primary" id="chooseCourseFromDetails">Выбрать курс</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // eslint-disable-next-line no-undef
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  document.getElementById("chooseCourseFromDetails").addEventListener("click", () => {
    selectedCourseId = courseId;
    document.getElementById("btnOpenOrderCourse").disabled = false;
    autoFilterTutorsByCourse();
    renderCourses();
    modal.hide();
  });
}

function applyCourseFilters() {
  const name = (document.getElementById("courseSearchName").value || "").trim().toLowerCase();
  const level = document.getElementById("courseSearchLevel").value;

  filteredCourses = courses.filter((c) => {
    const okName = name ? String(c.name || "").toLowerCase().includes(name) : true;
    const okLevel = level ? String(c.level || "") === level : true;
    return okName && okLevel;
  });

  // reset selection if it disappeared
  if (selectedCourseId && !filteredCourses.some((c) => c.id === selectedCourseId)) {
    selectedCourseId = null;
    document.getElementById("btnOpenOrderCourse").disabled = true;
  }

  coursePage = 1;
  renderCourses();
}

function setupCourseSearch() {
  const nameEl = document.getElementById("courseSearchName");
  const levelEl = document.getElementById("courseSearchLevel");
  const resetBtn = document.getElementById("courseResetBtn");

  nameEl.addEventListener("input", applyCourseFilters);
  levelEl.addEventListener("change", applyCourseFilters);
  resetBtn.addEventListener("click", () => {
    nameEl.value = "";
    levelEl.value = "";
    applyCourseFilters();
  });
}

function extractKnownLanguages() {
  const langs = [];
  tutors.forEach((t) => {
    (t.languages_offered || []).forEach((l) => langs.push(l));
  });
  return [...new Set(langs)].sort((a, b) => a.localeCompare(b));
}

function setupTutorFilters() {
  const langSel = document.getElementById("tutorLangSelect");
  const lvlSel = document.getElementById("tutorLevelSelect");
  const expMin = document.getElementById("tutorExperienceMin");

  const known = extractKnownLanguages();
  langSel.innerHTML = `<option value="">Любой</option>` + known.map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");

  const apply = () => {
    const lang = langSel.value;
    const lvl = lvlSel.value;
    const exp = Number(expMin.value || 0);

    filteredTutors = tutors.filter((t) => {
      const okLang = lang ? (t.languages_offered || []).includes(lang) : true;
      const okLvl = lvl ? String(t.language_level || "") === lvl : true;
      const okExp = exp ? Number(t.work_experience || 0) >= exp : true;
      return okLang && okLvl && okExp;
    });

    // reset selection if disappeared
    if (selectedTutorId && !filteredTutors.some((t) => t.id === selectedTutorId)) {
      selectedTutorId = null;
      document.getElementById("btnOpenOrderTutor").disabled = true;
    }

    renderTutors();
  };

  langSel.addEventListener("change", apply);
  lvlSel.addEventListener("change", apply);
  expMin.addEventListener("input", apply);
}

function autoFilterTutorsByCourse() {
  const course = selectedCourseId ? getCourseById(selectedCourseId) : null;
  if (!course) return;

  const langSel = document.getElementById("tutorLangSelect");
  const known = extractKnownLanguages();
  const inferred = pickLanguageFromCourse(course.name, known);

  if (inferred) {
    langSel.value = inferred;
    // trigger filter update
    langSel.dispatchEvent(new Event("change"));
  }
}

function renderTutors() {
  const tbody = document.getElementById("tutorsTbody");
  const btnOpen = document.getElementById("btnOpenOrderTutor");

  if (filteredTutors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-body-secondary">Ничего не найдено</td></tr>`;
    btnOpen.disabled = true;
    selectedTutorId = null;
    return;
  }

  tbody.innerHTML = filteredTutors
    .map((t, idx) => {
      const isSelected = t.id === selectedTutorId;
      const rowClass = isSelected ? "selected-row" : "";
      const spoken = (t.languages_spoken || []).join(", ");
      const offered = (t.languages_offered || []).join(", ");
      const img = "tutor.png";
      return `
        <tr class="${rowClass}">
          <td>${idx + 1}</td>
          <td><img src="${img}" alt="Фото" class="rounded-3" width="56" height="56"></td>
          <td class="fw-semibold">${escapeHtml(t.name)}</td>
          <td><span class="badge text-bg-secondary">${escapeHtml(t.language_level)}</span></td>
          <td class="small">${escapeHtml(spoken)}</td>
          <td class="small">${escapeHtml(offered)}</td>
          <td>${escapeHtml(String(t.work_experience))} лет</td>
          <td>${escapeHtml(String(t.price_per_hour))} ₽/час</td>
          <td class="text-end">
            <button class="btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-primary"}" data-action="selectTutor" data-id="${t.id}">
              ${isSelected ? "Выбран" : "Выбрать"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  btnOpen.disabled = !selectedTutorId;

  tbody.querySelectorAll("button[data-action='selectTutor']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      selectedTutorId = (selectedTutorId === id) ? null : id;
      btnOpen.disabled = !selectedTutorId;
      renderTutors();
    });
  });
}


function openOrderModal(mode) {
  const modalId = "orderModal";
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const isCourse = mode === "course";
  const course = isCourse ? getCourseById(selectedCourseId) : null;
  const tutor = !isCourse ? getTutorById(selectedTutorId) : null;

  if (isCourse && !course) return;
  if (!isCourse && !tutor) return;

  const title = isCourse ? "Оформление заявки" : "Оформление занятия с репетитором";

  const courseStartMap = isCourse ? buildStartDatesMap(course) : {};
  const dateOptions = isCourse
    ? Object.keys(courseStartMap).sort().map((d) => `<option value="${d}">${d}</option>`).join("")
    : "";

  const courseWeeks = isCourse ? Number(course.total_length) : 0;
  const weeklyHours = isCourse ? Number(course.week_length) : 0;
  const durationHours = isCourse ? computeCourseDurationHours(course) : 1;

  const html = `
  <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <form id="orderForm">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-0">${escapeHtml(title)}</h5>
              <div class="small text-body-secondary">${isCourse ? "Заявка на курс" : "Заявка на репетиторство"}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Курс</label>
                <input class="form-control" value="${escapeHtml(isCourse ? course.name : "—")}" readonly>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Преподаватель / Репетитор</label>
                <input class="form-control" value="${escapeHtml(isCourse ? course.teacher : tutor.name)}" readonly>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Дата начала</label>
                ${isCourse ? `
                  <select class="form-select" id="dateStart" required>
                    <option value="" selected disabled>Выберите дату</option>
                    ${dateOptions}
                  </select>
                ` : `
                  <input type="date" class="form-control" id="dateStart" required>
                `}
                <div class="form-text">Формат: YYYY-MM-DD</div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Время занятия</label>
                <select class="form-select" id="timeStart" ${isCourse ? "disabled" : ""} required>
                  <option value="" selected disabled>Выберите время</option>
                </select>
                <div class="form-text" id="timeHelp"></div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">${isCourse ? "Длительность курса" : "Длительность (часов)"}</label>
                <input type="text" class="form-control" id="durationInfo" readonly>
                <div class="form-text" id="durationHelp"></div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Кол-во студентов (1–20)</label>
                <input type="number" class="form-control" id="persons" min="1" max="20" value="1" required>
              </div>

              ${!isCourse ? `
              <div class="col-12 col-md-4">
                <label class="form-label">Оплата/час (₽)</label>
                <input type="text" class="form-control" value="${escapeHtml(String(tutor.price_per_hour))}" readonly>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label">Длительность занятия (1–40 ч)</label>
                <input type="number" class="form-control" id="tutorDurationHours" min="1" max="40" value="1" required>
              </div>
              ` : `
              <div class="col-12 col-md-4">
                <label class="form-label">Стоимость/час (₽)</label>
                <input type="text" class="form-control" value="${escapeHtml(String(course.course_fee_per_hour))}" readonly>
              </div>
              <div class="col-12 col-md-8">
                <div class="border rounded-3 p-3">
                  <div class="small text-body-secondary">Автоприменение</div>
                  <div class="d-flex gap-2 flex-wrap mt-1">
                    <span class="badge text-bg-light border" id="badgeEarly">Ранняя регистрация (-10%)</span>
                    <span class="badge text-bg-light border" id="badgeGroup">Группа ≥ 5 (-15%)</span>
                    <span class="badge text-bg-light border" id="badgeIntensive">Интенсив (≥5 ч/нед) (+20%)</span>
                  </div>
                </div>
              </div>
              `}

              <div class="col-12">
                <div class="fw-semibold mt-2">Дополнительные опции</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="optSupplementary">
                  <label class="form-check-label" for="optSupplementary">Дополнительные учебные материалы (+2000 ₽ за студента)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="optPersonalized">
                  <label class="form-check-label" for="optPersonalized">Индивидуальные занятия (+1500 ₽ за неделю курса)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="optExcursions">
                  <label class="form-check-label" for="optExcursions">Культурные экскурсии (+25%)</label>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="optAssessment">
                  <label class="form-check-label" for="optAssessment">Оценка уровня владения языком (+300 ₽)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="optInteractive">
                  <label class="form-check-label" for="optInteractive">Интерактивная онлайн-платформа (+50%)</label>
                </div>
              </div>

              <div class="col-12">
                <div class="card border-0 bg-body-tertiary rounded-4">
                  <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <div class="small text-body-secondary">Итоговая стоимость</div>
                        <div class="fs-4 fw-bold" id="priceOut">—</div>
                        <div class="small text-body-secondary" id="priceMeta"></div>
                      </div>
                      <div class="text-end small text-body-secondary" id="endInfo"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Отмена</button>
            <button class="btn btn-primary" type="submit">Отправить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  const dateEl = document.getElementById("dateStart");
  const timeEl = document.getElementById("timeStart");
  const personsEl = document.getElementById("persons");
  const priceOut = document.getElementById("priceOut");
  const priceMeta = document.getElementById("priceMeta");
  const durationInfo = document.getElementById("durationInfo");
  const durationHelp = document.getElementById("durationHelp");
  const timeHelp = document.getElementById("timeHelp");
  const endInfo = document.getElementById("endInfo");

  const optSupplementary = document.getElementById("optSupplementary");
  const optPersonalized = document.getElementById("optPersonalized");
  const optExcursions = document.getElementById("optExcursions");
  const optAssessment = document.getElementById("optAssessment");
  const optInteractive = document.getElementById("optInteractive");

  // set initial duration display
  if (isCourse) {
    durationInfo.value = `${courseWeeks} нед. (${durationHours} ч)`;
    durationHelp.textContent = `Дата окончания: выберите дату начала`;
  } else {
    durationInfo.value = "—";
    durationHelp.textContent = "Укажите дату, время и длительность занятия";
  }

  function getOptions(dateISO, persons, weekly) {
    const auto = inferAutoOptions({ dateISO, persons, weeklyHours: weekly });
    return {
      early_registration: auto.early,
      group_enrollment: auto.group,
      intensive_course: auto.intensive,
      supplementary: optSupplementary.checked,
      personalized: optPersonalized.checked,
      excursions: optExcursions.checked,
      assessment: optAssessment.checked,
      interactive: optInteractive.checked,
    };
  }

  function updateAutoBadges(opts) {
    const setBadge = (id, on) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("text-bg-success", on);
      el.classList.toggle("text-bg-light", !on);
      el.classList.toggle("border", !on);
    };
    setBadge("badgeEarly", opts.early_registration);
    setBadge("badgeGroup", opts.group_enrollment);
    setBadge("badgeIntensive", opts.intensive_course);
  }

  function updateTimeSelectForCourse(dateISO) {
    if (!isCourse) return;
    const times = courseStartMap[dateISO] || [];
    timeEl.innerHTML = `<option value="" selected disabled>Выберите время</option>` +
      times.map((t) => {
        const end = computeLessonEndTime(t, weeklyHours);
        return `<option value="${t}">${t}–${end}</option>`;
      }).join("");
    timeEl.disabled = false;
    timeHelp.textContent = times.length ? `Окончание вычислено по week_length = ${weeklyHours} ч` : "Нет доступных времён";
  }

  function updateDerivedInfo(dateISO, timeHHMM, persons, durationOverrideHours) {
    const durationH = isCourse ? durationHours : durationOverrideHours;
    const fee = isCourse ? Number(course.course_fee_per_hour) : Number(tutor.price_per_hour);
    const opts = getOptions(dateISO, persons, weeklyHours);
    if (isCourse) updateAutoBadges(opts);

    const price = computePrice({
      feePerHour: fee,
      durationHours: durationH,
      dateISO,
      timeHHMM,
      students: persons,
      options: opts,
      courseWeeks: isCourse ? courseWeeks : 0,
      weeklyHours,
    });

    priceOut.textContent = `${price} ₽`;
    priceMeta.textContent = `Формула: fee×hours×(будни/выходные)+доплаты → ×студенты (+опции)`;

    if (isCourse && dateISO) {
      const endDate = computeCourseEndDate(dateISO, courseWeeks);
      durationHelp.textContent = `Дата окончания курса: ${endDate}`;
      endInfo.innerHTML = `<div><span class="fw-semibold">Окончание курса:</span> ${endDate}</div>`;
    } else {
      endInfo.textContent = "";
    }
  }

  // tutor-specific time options (simple)
  if (!isCourse) {
    const defaultTimes = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:00"];
    timeEl.innerHTML = `<option value="" selected disabled>Выберите время</option>` + defaultTimes.map((t) => `<option value="${t}">${t}</option>`).join("");
    timeEl.disabled = false;
    timeHelp.textContent = "Примерный список (для репетитора)";
  }

  const tutorDurationEl = document.getElementById("tutorDurationHours");

  const recalc = () => {
    const dateISO = dateEl.value;
    const timeHHMM = timeEl.value;
    const persons = clampInt(personsEl.value, 1, 20, 1);
    personsEl.value = String(persons);

    let tutorDur = 1;
    if (!isCourse) {
      tutorDur = clampInt(tutorDurationEl.value, 1, 40, 1);
      tutorDurationEl.value = String(tutorDur);
      durationInfo.value = `${tutorDur} ч`;
    }

    if (isCourse && dateISO) {
      updateTimeSelectForCourse(dateISO);
    }

    if (dateISO && timeHHMM) {
      updateDerivedInfo(dateISO, timeHHMM, persons, tutorDur);
    } else {
      priceOut.textContent = "—";
      priceMeta.textContent = "Выберите дату и время";
    }
  };

  dateEl.addEventListener("change", recalc);
  timeEl.addEventListener("change", recalc);
  personsEl.addEventListener("input", recalc);
  if (tutorDurationEl) tutorDurationEl.addEventListener("input", recalc);
  [optSupplementary, optPersonalized, optExcursions, optAssessment, optInteractive].forEach((el) => {
    el.addEventListener("change", recalc);
  });

  // initial calculation state
  recalc();

  document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const dateISO = dateEl.value;
    const timeHHMM = timeEl.value;
    const persons = clampInt(personsEl.value, 1, 20, 1);

    if (!dateISO || !timeHHMM) {
      showToast("warning", "Проверьте форму", "Выберите дату и время.");
      return;
    }

    let durationH = isCourse ? durationHours : clampInt(tutorDurationEl.value, 1, 40, 1);

    const fee = isCourse ? Number(course.course_fee_per_hour) : Number(tutor.price_per_hour);

    const opts = (function () {
      const auto = inferAutoOptions({ dateISO, persons, weeklyHours });
      return {
        early_registration: auto.early,
        group_enrollment: auto.group,
        intensive_course: auto.intensive,
        supplementary: optSupplementary.checked,
        personalized: optPersonalized.checked,
        excursions: optExcursions.checked,
        assessment: optAssessment.checked,
        interactive: optInteractive.checked,
      };
    }());

    const price = computePrice({
      feePerHour: fee,
      durationHours: durationH,
      dateISO,
      timeHHMM,
      students: persons,
      options: opts,
      courseWeeks: isCourse ? courseWeeks : 0,
      weeklyHours,
    });

    const payload = {
      tutor_id: isCourse ? 0 : tutor.id,
      course_id: isCourse ? course.id : 0,
      date_start: dateISO,
      time_start: timeHHMM,
      duration: durationH,
      persons,
      price,
      ...opts,
    };

    try {
      await api.createOrder(payload);
      showToast("success", "Успех", "Заявка создана. Посмотрите её в личном кабинете.");
      modal.hide();
    } catch (err) {
      showToast("danger", "Ошибка", err.message || "Не удалось создать заявку.");
    }
  });

  document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
    document.getElementById(modalId).remove();
  });
}

async function loadAll() {
  try {
    const [c, t] = await Promise.all([api.getCourses(), api.getTutors()]);
    courses = Array.isArray(c) ? c : [];
    tutors = Array.isArray(t) ? t : [];
    filteredCourses = [...courses];
    filteredTutors = [...tutors];

    setupCourseSearch();
    setupTutorFilters();
    renderCourses();
    renderTutors();

    showToast("success", "Данные загружены", `Курсов: ${courses.length}, репетиторов: ${tutors.length}`);
  } catch (err) {
    showToast("danger", "Ошибка загрузки", err.message || "Не удалось загрузить данные.");
    document.getElementById("coursesTbody").innerHTML = `<tr><td colspan="6" class="p-4 text-center text-body-secondary">Ошибка загрузки</td></tr>`;
    document.getElementById("tutorsTbody").innerHTML = `<tr><td colspan="9" class="p-4 text-center text-body-secondary">Ошибка загрузки</td></tr>`;
  }
}

function setupButtons() {
  const btnCourse = document.getElementById("btnOpenOrderCourse");
  const btnTutor = document.getElementById("btnOpenOrderTutor");

  btnCourse.addEventListener("click", () => openOrderModal("course"));
  btnTutor.addEventListener("click", () => openOrderModal("tutor"));
}

document.addEventListener("DOMContentLoaded", () => {
  ensureYear();
  setupButtons();
  loadAll();
});
