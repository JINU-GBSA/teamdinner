/**
 * [회식의 정석 - TDS 인터랙션 & 리액티브 컨트롤러]
 */

const AppState = {
  currentStep: 1,
  candidates: [
    "2026-08-25(화)",
    "2026-08-26(수)",
    "2026-08-27(목)",
    "2026-08-28(금)"
  ],
  members: [],
  preferences: {
    region: "분당구 전체",
    categories: ["돼지고기/삼겹살", "소고기/한우"],
    dislikes: [],
    targetBudget: 30000,
    hasRoom: true,
    hasParking: true,
    canReserve: true
  },
  result: null
};

// 아바타 배경용 파스텔 색상 팔레트
const AVATAR_COLORS = [
  "#3182F6", // 토스 블루
  "#00B06B", // 에메랄드
  "#8B5CF6", // 퍼플
  "#F59E0B", // 앰버
  "#EC4899", // 핑크
  "#06B6D4"  // 시안
];

const DOM = {};

document.addEventListener("DOMContentLoaded", () => {
  initDOM();
  renderDateChips();
  setupEventListeners();
  updateStepper(1);
  renderLiveVoteChart();
  updateBudgetSummary();
});

function initDOM() {
  DOM.steps = {
    1: document.getElementById("step1"),
    2: document.getElementById("step2"),
    3: document.getElementById("step3"),
    4: document.getElementById("step4")
  };

  DOM.stepperSteps = document.querySelectorAll(".stepper-step");
  DOM.stepperTracks = document.querySelectorAll(".track-fill");

  // Step 1
  DOM.inputMemberName = document.getElementById("inputMemberName");
  DOM.dateCheckboxesContainer = document.getElementById("dateCheckboxesContainer");
  DOM.btnAddMember = document.getElementById("btnAddMember");
  DOM.btnFillSample = document.getElementById("btnFillSample");
  DOM.memberRowsContainer = document.getElementById("memberRowsContainer");
  DOM.emptyMemberMsg = document.getElementById("emptyMemberMsg");
  DOM.memberCountBadge = document.getElementById("memberCountBadge");
  DOM.liveDateVoteChart = document.getElementById("liveDateVoteChart");
  DOM.btnNextToStep2 = document.getElementById("btnNextToStep2");

  // Step 2
  DOM.regionCards = document.querySelectorAll(".region-card");
  DOM.selectRegion = document.getElementById("selectRegion");
  DOM.btnPrevToStep1 = document.getElementById("btnPrevToStep1");
  DOM.btnNextToStep3 = document.getElementById("btnNextToStep3");

  // Step 3
  DOM.budgetSlider = document.getElementById("budgetSlider");
  DOM.budgetValue = document.getElementById("budgetValue");
  DOM.summaryMemberCount = document.getElementById("summaryMemberCount");
  DOM.summaryTotalCost = document.getElementById("summaryTotalCost");
  DOM.chkRoom = document.getElementById("chkRoom");
  DOM.chkParking = document.getElementById("chkParking");
  DOM.chkReserve = document.getElementById("chkReserve");
  DOM.btnPrevToStep2 = document.getElementById("btnPrevToStep2");
  DOM.btnCalculate = document.getElementById("btnCalculate");

  // Step 4 (Result)
  DOM.resBestDate = document.getElementById("resBestDate");
  DOM.resAttendanceRate = document.getElementById("resAttendanceRate");
  DOM.resTotalBudget = document.getElementById("resTotalBudget");
  DOM.resPerPersonBudget = document.getElementById("resPerPersonBudget");
  DOM.heroCardContainer = document.getElementById("heroCardContainer");
  DOM.subTopContainer = document.getElementById("subTopContainer");
  DOM.othersCountBadge = document.getElementById("othersCountBadge");
  DOM.btnToggleOthers = document.getElementById("btnToggleOthers");
  DOM.othersContainer = document.getElementById("othersContainer");
  DOM.othersListContainer = document.getElementById("othersListContainer");
  DOM.accordionArrow = document.getElementById("accordionArrow");
  DOM.noticeTextPreview = document.getElementById("noticeTextPreview");
  DOM.btnCopyNotice = document.getElementById("btnCopyNotice");
  DOM.copyBtnText = document.getElementById("copyBtnText");
  DOM.btnRestart = document.getElementById("btnRestart");

  // Feedback Overlays
  DOM.tossLoadingModal = document.getElementById("tossLoadingModal");
  DOM.toastNotification = document.getElementById("toastNotification");
}

function updateStepper(step) {
  if (!DOM.stepperSteps) return;
  DOM.stepperSteps.forEach(node => {
    const s = parseInt(node.getAttribute("data-step"), 10);
    node.classList.remove("active", "completed");
    if (s === step) {
      node.classList.add("active");
    } else if (s < step) {
      node.classList.add("completed");
    }
  });

  DOM.stepperTracks.forEach((track, idx) => {
    if (step > idx + 1) {
      track.style.width = "100%";
    } else {
      track.style.width = "0%";
    }
  });
}

function goToStep(step) {
  AppState.currentStep = step;
  Object.keys(DOM.steps).forEach(s => {
    DOM.steps[s].classList.remove("active");
  });
  if (DOM.steps[step]) {
    DOM.steps[step].classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  updateStepper(step);
}

function renderDateChips() {
  DOM.dateCheckboxesContainer.innerHTML = "";
  AppState.candidates.forEach((dateStr, idx) => {
    const label = document.createElement("label");
    label.className = "toss-date-chip";
    label.innerHTML = `
      <input type="checkbox" name="memberDateChoice" value="${dateStr}" ${idx === 0 || idx === 1 ? 'checked' : ''}>
      <span>${dateStr}</span>
    `;
    DOM.dateCheckboxesContainer.appendChild(label);
  });
}

function setupEventListeners() {
  // Step 1: 멤버 추가
  DOM.btnAddMember.addEventListener("click", handleAddMember);
  DOM.inputMemberName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddMember();
  });

  // Step 1: 샘플 채우기
  DOM.btnFillSample.addEventListener("click", fillSampleData);

  // Step 1 -> 2
  DOM.btnNextToStep2.addEventListener("click", () => {
    if (AppState.members.length === 0) {
      showToast("팀원을 최소 1명 이상 등록해주세요");
      DOM.inputMemberName.focus();
      return;
    }
    goToStep(2);
  });

  // Step 2: 지역 카드 선택
  DOM.regionCards.forEach(card => {
    card.addEventListener("click", () => {
      DOM.regionCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const regionVal = card.getAttribute("data-region");
      DOM.selectRegion.value = regionVal;
      showToast(`📍 [${regionVal}] 상권이 선택되었어요`);
    });
  });

  // Step 2 네비게이션
  DOM.btnPrevToStep1.addEventListener("click", () => goToStep(1));
  DOM.btnNextToStep3.addEventListener("click", () => {
    const checkedPrefs = Array.from(document.querySelectorAll('input[name="categoryPref"]:checked')).map(el => el.value);
    if (checkedPrefs.length === 0) {
      showToast("선호하는 메뉴를 최소 1개 선택해주세요");
      return;
    }
    updateBudgetSummary();
    goToStep(3);
  });

  // Step 3: 예산 슬라이더 인터랙션
  DOM.budgetSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    DOM.budgetValue.innerText = val.toLocaleString();
    updateBudgetSummary();
  });

  DOM.btnPrevToStep2.addEventListener("click", () => goToStep(2));

  // Step 3: 분석 실행 (로딩 인터랙션 포함)
  DOM.btnCalculate.addEventListener("click", () => {
    // 1. 로딩 모달 펄스 연출
    DOM.tossLoadingModal.style.display = "flex";
    setTimeout(() => {
      DOM.tossLoadingModal.style.display = "none";
      executeRecommendation();
    }, 550);
  });

  // Step 4: 아코디언 토글
  DOM.btnToggleOthers.addEventListener("click", () => {
    const isHidden = DOM.othersContainer.style.display === "none";
    DOM.othersContainer.style.display = isHidden ? "block" : "none";
    DOM.accordionArrow.innerText = isHidden ? "▲" : "▼";
  });

  // Step 4: 공지문 복사
  DOM.btnCopyNotice.addEventListener("click", () => {
    DOM.noticeTextPreview.select();
    navigator.clipboard.writeText(DOM.noticeTextPreview.value).then(() => {
      DOM.copyBtnText.innerText = "✓ 복사 완료!";
      showToast("공지문이 클립보드에 복사되었어요 📋");
      setTimeout(() => { DOM.copyBtnText.innerText = "📄 공지문 복사"; }, 2000);
    }).catch(() => {
      document.execCommand("copy");
      showToast("공지문이 복사되었어요 📋");
    });
  });

  // 처음으로
  DOM.btnRestart.addEventListener("click", () => goToStep(1));
}

function handleAddMember() {
  const name = DOM.inputMemberName.value.trim();
  if (!name) {
    showToast("참석자 이름을 입력해주세요");
    DOM.inputMemberName.focus();
    return;
  }

  const selectedDates = Array.from(
    DOM.dateCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  if (selectedDates.length === 0) {
    showToast("가능한 날짜를 하나 이상 선택해주세요");
    return;
  }

  AppState.members.push({ name, availableDates: selectedDates });
  DOM.inputMemberName.value = "";
  renderMemberList();
  renderLiveVoteChart();
  updateBudgetSummary();
  showToast(`${name} 님이 등록되었어요`);
}

function fillSampleData() {
  AppState.members = [
    { name: "김팀장", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-27(목)"] },
    { name: "이수석", availableDates: ["2026-08-26(수)", "2026-08-27(목)", "2026-08-28(금)"] },
    { name: "박책임", availableDates: ["2026-08-25(화)", "2026-08-26(수)"] },
    { name: "최선임", availableDates: ["2026-08-26(수)", "2026-08-27(목)"] },
    { name: "정프로", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-28(금)"] },
    { name: "강인턴", availableDates: ["2026-08-26(수)", "2026-08-27(목)", "2026-08-28(금)"] }
  ];
  renderMemberList();
  renderLiveVoteChart();
  updateBudgetSummary();
  showToast("6인 팀원 데이터가 입력되었어요");
}

function renderMemberList() {
  DOM.memberRowsContainer.innerHTML = "";
  const count = AppState.members.length;
  DOM.memberCountBadge.innerText = `${count}명 등록됨`;

  if (count === 0) {
    DOM.emptyMemberMsg.style.display = "block";
    return;
  }
  DOM.emptyMemberMsg.style.display = "none";

  AppState.members.forEach((m, idx) => {
    const row = document.createElement("div");
    row.className = "toss-member-item";

    const dateBadges = m.availableDates.map(d => `<span class="mini-date-tag">${d}</span>`).join("");
    const initial = m.name.charAt(0);
    const bgColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

    row.innerHTML = `
      <div class="member-info-left">
        <div class="member-avatar-circle" style="background-color: ${bgColor};">${initial}</div>
        <div>
          <div class="member-name-txt">${m.name}</div>
          <div class="member-dates-tags">${dateBadges}</div>
        </div>
      </div>
      <button type="button" class="btn-del-icon" onclick="removeMember(${idx})" title="삭제">✕</button>
    `;
    DOM.memberRowsContainer.appendChild(row);
  });
}

function renderLiveVoteChart() {
  if (!DOM.liveDateVoteChart) return;
  DOM.liveDateVoteChart.innerHTML = "";

  const totalMembers = AppState.members.length;
  const counts = {};
  AppState.candidates.forEach(c => counts[c] = 0);

  AppState.members.forEach(m => {
    (m.availableDates || []).forEach(d => {
      if (counts[d] !== undefined) counts[d]++;
    });
  });

  let maxVotes = 0;
  Object.values(counts).forEach(v => { if (v > maxVotes) maxVotes = v; });

  AppState.candidates.forEach(dateStr => {
    const voteCount = counts[dateStr] || 0;
    const percent = totalMembers > 0 ? Math.round((voteCount / totalMembers) * 100) : 0;
    const isLead = voteCount > 0 && voteCount === maxVotes;

    const row = document.createElement("div");
    row.className = "vote-bar-row";
    row.innerHTML = `
      <span class="vote-date-label">${dateStr}</span>
      <div class="vote-bar-track">
        <div class="vote-bar-fill ${isLead ? 'lead' : ''}" style="width: ${percent}%;"></div>
      </div>
      <span class="vote-count-label" style="color: ${isLead ? '#3182F6' : '#191F28'};">${voteCount}명 (${percent}%)</span>
    `;
    DOM.liveDateVoteChart.appendChild(row);
  });
}

window.removeMember = function(idx) {
  AppState.members.splice(idx, 1);
  renderMemberList();
  renderLiveVoteChart();
  updateBudgetSummary();
};

function updateBudgetSummary() {
  const memberCount = AppState.members.length > 0 ? AppState.members.length : 6;
  const perPerson = parseInt(DOM.budgetSlider.value, 10);
  const total = memberCount * perPerson;

  if (DOM.summaryMemberCount) DOM.summaryMemberCount.innerText = memberCount;
  if (DOM.summaryTotalCost) DOM.summaryTotalCost.innerText = `${total.toLocaleString()}원`;
}

function executeRecommendation() {
  try {
    const selectedRegion = DOM.selectRegion.value;
    const categoryPrefs = Array.from(document.querySelectorAll('input[name="categoryPref"]:checked')).map(el => el.value);
    const categoryDislikes = Array.from(document.querySelectorAll('input[name="categoryDislike"]:checked')).map(el => el.value);
    const targetBudget = parseInt(DOM.budgetSlider.value, 10);
    const hasRoom = DOM.chkRoom.checked;
    const hasParking = DOM.chkParking.checked;
    const canReserve = DOM.chkReserve.checked;

    AppState.preferences = {
      region: selectedRegion,
      categories: categoryPrefs,
      dislikes: categoryDislikes,
      targetBudget: targetBudget,
      hasRoom: hasRoom,
      hasParking: hasParking,
      canReserve: canReserve
    };

    const scheduleResult = DinnerCalculator.findBestDate(AppState.members, AppState.candidates);
    const budgetResult = DinnerCalculator.calculateBudget(scheduleResult.attendingCount, targetBudget);
    const rankResult = DinnerCalculator.rankRestaurants(
      typeof RESTAURANT_DATA !== "undefined" ? RESTAURANT_DATA : [],
      AppState.preferences,
      budgetResult
    );

    AppState.result = {
      schedule: scheduleResult,
      budget: budgetResult,
      top3: rankResult.top3,
      others: rankResult.others,
      totalMatched: rankResult.totalMatched
    };

    renderResults();
    goToStep(4);

    setTimeout(() => {
      DinnerMap.renderTop3(rankResult.top3, rankResult.others);
    }, 150);
  } catch (err) {
    console.error("추천 계산 중 오류:", err);
    showToast("분석 중 오류가 발생했습니다: " + err.message);
  }
}

function renderResults() {
  const { schedule, budget, top3, others } = AppState.result;

  DOM.resBestDate.innerText = schedule.bestDate || "일정 조율 필요";
  DOM.resAttendanceRate.innerText = `${schedule.attendanceRate}% (${schedule.attendingCount}명)`;
  DOM.resTotalBudget.innerText = `${budget.totalEstimated.toLocaleString()}원`;
  DOM.resPerPersonBudget.innerText = `1인 약 ${budget.perPerson.toLocaleString()}원`;

  // 1. 🏆 Top 1 대형 히어로 카드
  DOM.heroCardContainer.innerHTML = "";
  if (top3.length > 0) {
    const hero = top3[0];
    const tagsHtml = (hero.tags || []).map(t => `<span class="hero-tag-item">#${t}</span>`).join("");
    const reasonText = (hero.matchReasons && hero.matchReasons.length > 0) ? hero.matchReasons.join(" · ") : "조건에 완벽히 부합해요";

    const heroCard = document.createElement("div");
    heroCard.className = "hero-restaurant-box";
    heroCard.innerHTML = `
      <div class="hero-top-row">
        <div>
          <h3 class="hero-main-name">${hero.name}</h3>
        </div>
        <div class="hero-score-pill">${hero.score}점</div>
      </div>
      <div class="hero-tags-flex">${tagsHtml}</div>
      <div class="hero-match-badge">💡 <strong>추천 이유:</strong> ${reasonText}</div>

      <div class="hero-detail-grid">
        <div>
          <div class="detail-item-lbl">메뉴 및 업종</div>
          <div class="detail-item-val">${hero.category}</div>
        </div>
        <div>
          <div class="detail-item-lbl">1인 예상 단가</div>
          <div class="detail-item-val highlight">${hero.avgPrice.toLocaleString()}원</div>
        </div>
        <div>
          <div class="detail-item-lbl">매장 규모 / 편의</div>
          <div class="detail-item-val">${hero.area || 50}㎡ ${hero.hasRoom ? '· 룸완비' : ''} ${hero.hasParking ? '· 주차' : ''}</div>
        </div>
        <div>
          <div class="detail-item-lbl">위치 (주소)</div>
          <div class="detail-item-val" style="font-size: 13px;">${hero.address_road || hero.address_jibun}</div>
        </div>
      </div>

      <div class="hero-action-buttons">
        <button type="button" class="toss-btn toss-btn-brand toss-btn-l" onclick="focusRestaurant(${hero.id}, ${hero.lat}, ${hero.lng})">
          지도에서 위치 보기 📍
        </button>
        <a href="tel:${hero.tel}" class="toss-btn toss-btn-secondary toss-btn-l">
          전화 문의 📞
        </a>
      </div>
    `;
    DOM.heroCardContainer.appendChild(heroCard);
  }

  // 2. 🥈 🥉 2, 3순위 서브 카드
  DOM.subTopContainer.innerHTML = "";
  const subTops = top3.slice(1, 3);
  subTops.forEach((r, idx) => {
    const rankNum = idx + 2;
    const card = document.createElement("div");
    card.className = "subtop-card-item";
    const tagsHtml = (r.tags || []).slice(0, 2).map(t => `<span class="hero-tag-item">#${t}</span>`).join("");

    card.innerHTML = `
      <div class="subtop-rank-lbl">${rankNum === 2 ? '🥈 2순위 추천' : '🥉 3순위 추천'} (${r.score}점)</div>
      <div class="subtop-item-name">${r.name}</div>
      <div style="font-size: 13px; color: #6b7684; margin-bottom: 4px;">${r.category} · ${r.area || 50}㎡</div>
      <div class="subtop-item-price">1인 약 ${r.avgPrice.toLocaleString()}원</div>
      <div style="margin-bottom: 12px;">${tagsHtml}</div>
      <div class="subtop-bottom-row">
        <span style="font-size: 12px; color: #8b95a1;">${(r.address_road || r.address_jibun).split(' ').slice(2, 4).join(' ')}</span>
        <button type="button" class="toss-btn toss-btn-secondary" style="font-size: 12px; padding: 4px 10px; border-radius: 8px;" onclick="focusRestaurant(${r.id}, ${r.lat}, ${r.lng})">
          지도 📍
        </button>
      </div>
    `;
    DOM.subTopContainer.appendChild(card);
  });

  // 3. 📂 4위 ~ 20위 추가 후보군
  DOM.othersCountBadge.innerText = `${others.length}개`;
  DOM.othersListContainer.innerHTML = "";
  others.forEach((r, idx) => {
    const rankNum = idx + 4;
    const row = document.createElement("div");
    row.className = "others-row-item";
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="others-rank-badge">${rankNum}위</span>
        <div>
          <div class="others-row-name">${r.name}</div>
          <div class="others-row-meta">${r.category} · 1인 약 ${r.avgPrice.toLocaleString()}원 · ${r.area || 50}㎡</div>
        </div>
      </div>
      <button type="button" class="toss-btn toss-btn-text" onclick="focusRestaurant(${r.id}, ${r.lat}, ${r.lng})">
        위치보기 ➔
      </button>
    `;
    DOM.othersListContainer.appendChild(row);
  });

  generateNoticeText();
}

function generateNoticeText() {
  const { schedule, budget, top3 } = AppState.result;
  const bestDate = schedule.bestDate || "미정";
  const attendingNames = (schedule.attendingMembers || []).join(", ");

  let notice = `[팀 회식 확정 공지 📢]\n\n`;
  notice += `팀원 여러분의 투표 결과를 종합하여 최적의 회식 일정이 확정되었습니다!\n\n`;
  notice += `🗓️ 일시: ${bestDate}\n`;
  notice += `👥 참석 확정: ${attendingNames} (총 ${schedule.attendingCount}명 / 참석률 ${schedule.attendanceRate}%)\n`;
  notice += `💰 1인 예상 예산: 약 ${budget.perPerson.toLocaleString()}원 (팀 총예산: 약 ${budget.totalEstimated.toLocaleString()}원)\n\n`;
  notice += `🏆 추천 회식 장소 TOP 3\n`;

  top3.forEach((r, idx) => {
    notice += `\n${idx + 1}. [${r.name}] (${r.category})\n`;
    notice += `   - 1인 예상 단가: 약 ${r.avgPrice.toLocaleString()}원\n`;
    notice += `   - 매장 정보: ${r.tags.join(", ")} (면적 ${r.area || 50}㎡)\n`;
    notice += `   - 위치: ${r.address_road || r.address_jibun}\n`;
    notice += `   - 예약 문의: ${r.tel}\n`;
  });

  notice += `\n세부 장소 조율 및 예약은 위 추천 목록을 참고해 주세요! 감사합니다. ✨`;
  DOM.noticeTextPreview.value = notice;
}

window.focusRestaurant = function(id, lat, lng) {
  DinnerMap.focusRestaurant(id, lat, lng);
  const mapElement = document.getElementById("map");
  if (mapElement) {
    mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

function showToast(message) {
  if (!DOM.toastNotification) return;
  DOM.toastNotification.innerText = message;
  DOM.toastNotification.classList.add("show");
  setTimeout(() => {
    DOM.toastNotification.classList.remove("show");
  }, 2200);
}
