const radiuses = [
  { label: "50m", value: 50 },
  { label: "75m", value: 75 },
  { label: "100m", value: 100 },
  { label: "300m", value: 300 },
  { label: "전체", value: Infinity },
];

let selectedRadius = 100;
let selectedFilter = "all";

const radiusTabs = document.querySelector("#radiusTabs");
const benefitList = document.querySelector("#benefitList");
const resultCount = document.querySelector("#resultCount");
const savingSummary = document.querySelector("#savingSummary");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const locateButton = document.querySelector("#locateButton");
const locationName = document.querySelector("#locationName");
const locationMeta = document.querySelector("#locationMeta");

function formatMoney(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getVisibleBenefits() {
  const keyword = searchInput.value.trim().toLowerCase();

  return benefits
    .filter((benefit) => benefit.distance <= selectedRadius)
    .filter((benefit) => selectedFilter === "all" || benefit.benefitType === selectedFilter)
    .filter((benefit) => {
      if (!keyword) return true;
      return [benefit.brand, benefit.branch, benefit.title, benefit.provider, benefit.benefitLabel]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    })
    .sort((a, b) => a.distance - b.distance);
}

function renderRadiusTabs() {
  radiusTabs.innerHTML = radiuses
    .map(
      (radius) => `
        <button
          class="radius-tab ${radius.value === selectedRadius ? "is-active" : ""}"
          type="button"
          data-radius="${radius.value}"
          aria-pressed="${radius.value === selectedRadius}"
        >
          ${radius.label}
        </button>
      `,
    )
    .join("");
}

function renderBenefits() {
  const visibleBenefits = getVisibleBenefits();
  const totalSaving = visibleBenefits.reduce((sum, benefit) => sum + benefit.saving, 0);

  resultCount.textContent = `${visibleBenefits.length}개 혜택`;
  savingSummary.textContent = visibleBenefits.length ? `예상 절감 ${formatMoney(totalSaving)}원` : "반경 안 혜택 없음";

  if (!visibleBenefits.length) {
    benefitList.innerHTML = `
      <article class="empty-state">
        <strong>선택한 조건에 맞는 혜택이 없어요.</strong>
        <p>반경을 넓히거나 검색어를 지우면 더 많은 샘플 혜택을 볼 수 있습니다.</p>
      </article>
    `;
    return;
  }

  benefitList.innerHTML = visibleBenefits
    .map(
      (benefit) => `
        <article class="benefit-card" style="--accent:${benefit.accent}">
          <div class="brand-mark" aria-hidden="true">${benefit.brand.slice(0, 1)}</div>
          <div class="benefit-content">
            <div class="card-topline">
              <span>${benefit.distance}m</span>
              <span>${benefit.category}</span>
              <span>${benefit.expiresAt}</span>
            </div>
            <h3>${benefit.brand} ${benefit.branch}</h3>
            <p class="benefit-title">${benefit.title}</p>
            <p class="benefit-description">${benefit.description}</p>
            <div class="benefit-meta">
              <span>${benefit.benefitLabel}</span>
              <span>${benefit.providerType}</span>
              <span>${benefit.provider}</span>
            </div>
          </div>
          <button class="open-app-button" type="button" data-benefit-id="${benefit.id}">
            ${benefit.appName} 열기
          </button>
        </article>
      `,
    )
    .join("");
}

function render() {
  renderRadiusTabs();
  renderBenefits();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function openOfficialApp(benefit) {
  showToast(`${benefit.brand} 혜택을 위해 ${benefit.appName}을 여는 중입니다.`);

  const fallbackTimer = window.setTimeout(() => {
    window.location.href = benefit.fallbackUrl;
  }, 900);

  window.location.href = benefit.appScheme;

  window.addEventListener(
    "pagehide",
    () => {
      window.clearTimeout(fallbackTimer);
    },
    { once: true },
  );
}

radiusTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-radius]");
  if (!button) return;

  selectedRadius = button.dataset.radius === "Infinity" ? Infinity : Number(button.dataset.radius);
  render();
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedFilter = button.dataset.filter;
    renderBenefits();
  });
});

benefitList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-benefit-id]");
  if (!button) return;

  const benefit = benefits.find((item) => item.id === button.dataset.benefitId);
  if (benefit) openOfficialApp(benefit);
});

searchInput.addEventListener("input", renderBenefits);

locateButton.addEventListener("click", () => {
  locationName.textContent = currentLocation.name;
  locationMeta.textContent = "위치를 새로 확인했습니다. 샘플 반경 데이터가 적용됩니다.";
  showToast("현재 위치 기준으로 주변 혜택을 다시 정렬했습니다.");
  renderBenefits();
});

render();
