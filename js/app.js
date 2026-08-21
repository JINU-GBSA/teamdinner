/**
 * [회식의 정석 - 메인 애플리케이션 컨트롤러]
 */

const AppState = {
  currentStep: 1,
  candidateDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-27(목)", "2026-08-28(금)"],
  members: [
    { name: "김팀장", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-27(목)"] },
    { name: "이수석", availableDates: ["2026-08-26(수)", "2026-08-27(목)", "2026-08-28(금)"] },
    { name: "박책임", availableDates: ["2026-08-26(수)", "2026-08-27(목)"] },
    { name: "최선임", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-28(금)"] },
    { name: "정프로", availableDates: ["2026-08-26(수)"] },
    { name: "강신입", availableDates: ["2026-08-26(수)", "2026-08-27(목)"] }
  ],
  region: "분당구 전체",
  preferredCategories: ["돼지고기/삼겹살", "소고기/한우"],
  dislikedCategories: [],
  targetBudget: 28000,
  mustHaveParking: true,
  mustHaveRoom: true,
  mustCanReserve: true,
  
  result: {
    schedule: null,
    budget: null,
    top3: [],
    others: [],
    totalMatched: 0
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  bindEvents();
});

function initUI() {
  renderDateCheckboxes();
  renderMemberList();
  updateBudgetDisplay();
}

function bindEvents() {
  // 예산 슬라이더
  const budgetSlider = document.getElementById("budgetSlider");
  if (budgetSlider) {
    budgetSlider.addEventListener("input", (e) => {
      AppState.targetBudget = parseInt(e.target.value, 10);
      updateBudgetDisplay();
    });
  }

  // 참석자 추가 폼
  const btnAddMember = document.getElementById("btnAddMember");
  if (btnAddMember) btnAddMember.addEventListener("click", handleAddMember);

  // 샘플 팀원 자동 채우기
  const btnFillSample = document.getElementById("btnFillSample");
  if (btnFillSample) btnFillSample.addEventListener("click", handleFillSample);

  // 위저드 네비게이션
  const btnNextToStep2 = document.getElementById("btnNextToStep2");
  const btnPrevToStep1 = document.getElementById("btnPrevToStep1");
  const btnNextToStep3 = document.getElementById("btnNextToStep3");
  const btnPrevToStep2 = document.getElementById("btnPrevToStep2");
  const btnCalculate = document.getElementById("btnCalculate");
  const btnRestart = document.getElementById("btnRestart");

  if (btnNextToStep2) btnNextToStep2.addEventListener("click", () => goToStep(2));
  if (btnPrevToStep1) btnPrevToStep1.addEventListener("click", () => goToStep(1));
  if (btnNextToStep3) btnNextToStep3.addEventListener("click", () => goToStep(3));
  if (btnPrevToStep2) btnPrevToStep2.addEventListener("click", () => goToStep(2));
  if (btnCalculate) btnCalculate.addEventListener("click", handleCalculateAndRecommend);
  if (btnRestart) btnRestart.addEventListener("click", () => goToStep(1));

  // 추가 후보군 토글 버튼
  const btnToggleOthers = document.getElementById("btnToggleOthers");
  if (btnToggleOthers) {
    btnToggleOthers.addEventListener("click", () => {
      const container = document.getElementById("othersContainer");
      const btnText = document.getElementById("btnToggleOthersText");
      if (container.style.display === "none") {
        container.style.display = "block";
        btnText.textContent = "목록 접기 ▲";
      } else {
        container.style.display = "none";
        btnText.textContent = "목록 보기 ▼";
      }
    });
  }

  // 텍스트 공지 복사 버튼
  const btnCopyNotice = document.getElementById("btnCopyNotice");
  if (btnCopyNotice) btnCopyNotice.addEventListener("click", copyNoticeText);
}

function renderDateCheckboxes() {
  const container = document.getElementById("dateCheckboxesContainer");
  if (!container) return;
  container.innerHTML = "";
  AppState.candidateDates.forEach((date, idx) => {
    const label = document.createElement("label");
    label.className = "checkbox-chip";
    label.innerHTML = `
      <input type="checkbox" name="memberDate" value="${date}" ${idx === 1 ? "checked" : ""}>
      <span>${date}</span>
    `;
    container.appendChild(label);
  });
}

function renderMemberList() {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  AppState.members.forEach((m, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td>${m.availableDates.map(d => `<span class="badge-date">${d}</span>`).join(" ")}</td>
      <td>
        <button type="button" class="btn-sm-del" onclick="deleteMember(${idx})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const countBadge = document.getElementById("memberCountBadge");
  if (countBadge) countBadge.textContent = `현재 취합 인원: ${AppState.members.length}명`;
}

function handleAddMember() {
  const nameInput = document.getElementById("inputMemberName");
  const name = nameInput.value.trim();
  if (!name) {
    alert("참석자 이름을 입력해주세요.");
    return;
  }

  const checkedDates = Array.from(document.querySelectorAll('input[name="memberDate"]:checked'))
    .map(cb => cb.value);

  if (checkedDates.length === 0) {
    alert("가능한 날짜를 최소 1개 이상 선택해주세요.");
    return;
  }

  AppState.members.push({ name, availableDates: checkedDates });
  nameInput.value = "";
  renderMemberList();
}

function deleteMember(idx) {
  AppState.members.splice(idx, 1);
  renderMemberList();
}

function handleFillSample() {
  AppState.members = [
    { name: "김팀장", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-27(목)"] },
    { name: "이수석", availableDates: ["2026-08-26(수)", "2026-08-27(목)", "2026-08-28(금)"] },
    { name: "박책임", availableDates: ["2026-08-26(수)", "2026-08-27(목)"] },
    { name: "최선임", availableDates: ["2026-08-25(화)", "2026-08-26(수)", "2026-08-28(금)"] },
    { name: "정프로", availableDates: ["2026-08-26(수)"] },
    { name: "강신입", availableDates: ["2026-08-26(수)", "2026-08-27(목)"] }
  ];
  renderMemberList();
}

function updateBudgetDisplay() {
  const budgetSlider = document.getElementById("budgetSlider");
  const budgetValue = document.getElementById("budgetValue");
  if (budgetSlider && budgetValue) {
    budgetValue.textContent = parseInt(budgetSlider.value, 10).toLocaleString() + "원";
  }
}

function goToStep(step) {
  AppState.currentStep = step;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) el.classList.toggle("active", i === step);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleCalculateAndRecommend() {
  try {
    if (AppState.members.length === 0) {
      alert("최소 1명 이상의 참석자 일정이 필요합니다.");
      goToStep(1);
      return;
    }

    const regionEl = document.getElementById("selectRegion");
    if (regionEl) AppState.region = regionEl.value;
    
    AppState.preferredCategories = Array.from(document.querySelectorAll('input[name="categoryPref"]:checked'))
      .map(cb => cb.value);
    
    AppState.dislikedCategories = Array.from(document.querySelectorAll('input[name="categoryDislike"]:checked'))
      .map(cb => cb.value);

    const chkParking = document.getElementById("chkParking");
    const chkRoom = document.getElementById("chkRoom");
    const chkReserve = document.getElementById("chkReserve");

    AppState.mustHaveParking = chkParking ? chkParking.checked : false;
    AppState.mustHaveRoom = chkRoom ? chkRoom.checked : false;
    AppState.mustCanReserve = chkReserve ? chkReserve.checked : false;

    const scheduleResult = DinnerCalculator.aggregateSchedule(AppState.members);
    const budgetResult = DinnerCalculator.calculateBudget(scheduleResult.attendanceCount, AppState.targetBudget);
    
    const rankResult = DinnerCalculator.filterAndRankRestaurants({
      region: AppState.region,
      preferredCategories: AppState.preferredCategories,
      dislikedCategories: AppState.dislikedCategories,
      targetBudget: AppState.targetBudget,
      mustHaveParking: AppState.mustHaveParking,
      mustHaveRoom: AppState.mustHaveRoom,
      mustCanReserve: AppState.mustCanReserve,
      attendeeCount: scheduleResult.attendanceCount
    });

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
    alert("분석 중 오류가 발생했습니다: " + err.message);
  }
}

function renderResults() {
  const { schedule, budget, top3, others, totalMatched } = AppState.result;

  const resBestDate = document.getElementById("resBestDate");
  const resAttendanceRate = document.getElementById("resAttendanceRate");
  const resTotalBudget = document.getElementById("resTotalBudget");
  const resPerPersonBudget = document.getElementById("resPerPersonBudget");

  if (resBestDate) resBestDate.textContent = schedule.bestDate || "미정";
  if (resAttendanceRate) resAttendanceRate.textContent = `${schedule.rate}% (${schedule.attendanceCount}/${schedule.totalMembers}명)`;
  if (resTotalBudget) resTotalBudget.textContent = budget.formattedTotal;
  if (resPerPersonBudget) resPerPersonBudget.textContent = `${budget.perPersonBudget.toLocaleString()}원 / 1인`;

  // Top 3 비교 카드
  const container = document.getElementById("top3CardsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!top3 || top3.length === 0) {
    container.innerHTML = `
      <div class="empty-notice" style="grid-column: 1/-1; padding: 24px; text-align: center; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px;">
        ⚠️ 선택하신 조건(지역: ${AppState.region})에 맞는 식당을 찾지 못했습니다.<br>
        필수 옵션(주차/룸/예약)을 완화하거나 다른 메뉴를 선택해보세요!
      </div>
    `;
    updateNoticePreview();
    return;
  }

  const rankBadges = ["🥇 1순위 (Best Pick)", "🥈 2순위 (Great Choice)", "🥉 3순위 (Solid Pick)"];
  const rankClasses = ["rank-gold", "rank-silver", "rank-bronze"];

  top3.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = `compare-card ${rankClasses[idx] || ""}`;

    const tagsHtml = (r.tags || []).map(t => `<span class="tag-badge">#${t}</span>`).join("");

    card.innerHTML = `
      <div class="card-header">
        <span class="rank-tag">${rankBadges[idx] || `${idx + 1}순위`}</span>
        <span class="score-tag">종합 ${r.score}점</span>
      </div>
      <h3 class="restaurant-name">${r.name}</h3>
      <div style="margin-bottom: 6px;">${tagsHtml}</div>
      <p class="restaurant-desc">${r.description || ""}</p>
      
      <div class="card-metrics">
        <div class="metric-row">
          <span class="metric-label">대표 메뉴/업종</span>
          <span class="metric-value font-bold">${r.category}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">1인 평균 단가</span>
          <span class="metric-value font-bold text-blue">${r.avgPrice.toLocaleString()}원</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">팀 예상 총비용</span>
          <span class="metric-value font-bold text-green">${r.estimatedTotal.toLocaleString()}원</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">면적 & 편의</span>
          <span class="metric-value">
            🏢${r.area || 50}㎡ | 
            ${r.hasRoom ? '🚪단체룸' : '일반석'} | 
            ${r.hasParking ? '🚗주차' : '주차불가'}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">소재지(도로명)</span>
          <span class="metric-value text-sm">${r.address_road || r.address_jibun}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">예약 문의</span>
          <span class="metric-value"><a href="tel:${r.tel}" class="tel-link">📞 ${r.tel}</a></span>
        </div>
      </div>

      <div class="reasoning-box">
        💡 <strong>선정 이유:</strong> ${r.reasoning}
      </div>
    `;
    container.appendChild(card);
  });

  // 추가 후보군(4위 ~ 20위) 렌더링
  const othersBadge = document.getElementById("othersCountBadge");
  if (othersBadge) othersBadge.textContent = `(총 ${others.length}곳 / 전체 매칭 ${totalMatched}곳)`;

  const othersTbody = document.getElementById("othersTableBody");
  if (othersTbody) {
    othersTbody.innerHTML = "";
    others.forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color: #2563EB;">${idx + 4}위</strong></td>
        <td><strong>${r.name}</strong> <span style="font-size: 11px; color: var(--text-muted);">(${r.score}점)</span></td>
        <td>${r.category}</td>
        <td>${r.avgPrice.toLocaleString()}원</td>
        <td>${r.area}㎡ / ${r.hasRoom ? '🚪룸' : '홀'}</td>
        <td style="font-size: 11px; max-width: 180px;">${r.address_road || r.address_jibun}</td>
        <td>
          <button type="button" class="btn-focus-map" onclick="DinnerMap.focusRestaurant(${r.id}, ${r.lat}, ${r.lng})">
            지도보기 📍
          </button>
        </td>
      `;
      othersTbody.appendChild(tr);
    });
  }

  updateNoticePreview();
}

/**
 * 텍스트 공지문 포맷 생성기
 */
function generateNoticeText() {
  const { schedule, budget, top3 } = AppState.result;
  if (!schedule || !top3 || top3.length === 0) return "";

  let text = `📢 [팀 회식 안내 & 후보 식당 투표]\n\n`;
  text += `🗓️ 일시: ${schedule.bestDate} (참석률 ${schedule.rate}%)\n`;
  text += `👥 참석 확정: ${schedule.attendees.join(", ")} (총 ${schedule.attendanceCount}명)\n`;
  if (schedule.absentees.length > 0) {
    text += `⚠️ 불참/미정: ${schedule.absentees.join(", ")}\n`;
  }
  text += `💰 예상 예산: 1인당 약 ${budget.perPersonBudget.toLocaleString()}원 (총 약 ${budget.formattedTotal})\n`;
  text += `📍 권역: ${AppState.region}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏆 [추천 식당 Top 3]\n`;

  top3.forEach((r, idx) => {
    const tags = (r.tags || []).join(", ");
    text += `\n${idx + 1}. ${r.name} (${r.category}) [${tags}]\n`;
    text += `   • 1인단가: 약 ${r.avgPrice.toLocaleString()}원 (예상 총 ${r.estimatedTotal.toLocaleString()}원)\n`;
    text += `   • 면적/편의: ${r.area}㎡, ${r.hasRoom ? '룸 완비' : '일반석'}, ${r.hasParking ? '주차 가능' : '주차 불가'}\n`;
    text += `   • 주소: ${r.address_road || r.address_jibun}\n`;
    text += `   • 추천사유: ${r.reasoning}\n`;
    text += `   • 예약문의: ${r.tel}\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `가장 마음에 드는 식당 번호를 스레드/답장으로 알려주세요! 😊`;

  return text;
}

function updateNoticePreview() {
  const preview = document.getElementById("noticeTextPreview");
  if (preview) {
    preview.value = generateNoticeText();
  }
}

function copyNoticeText() {
  const preview = document.getElementById("noticeTextPreview");
  if (!preview) return;
  preview.select();
  navigator.clipboard.writeText(preview.value).then(() => {
    alert("✅ 회식 공지 텍스트가 클립보드에 복사되었습니다!\n슬랙이나 카카오톡에 붙여넣어 공유하세요.");
  }).catch(() => {
    document.execCommand("copy");
    alert("✅ 회식 공지 텍스트가 복사되었습니다!");
  });
}
