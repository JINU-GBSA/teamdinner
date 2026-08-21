/**
 * [회식 추천 & 분석 계산 엔진 (빅테크 다면 평가 알고리즘 업그레이드)]
 * - 참석자 일정 취합 (최다 참석일 도출)
 * - 1인당 예산 및 총비용 계산
 * - 매장 면적(쾌적도), 역세권 접근성, 가성비 효용 곡선 기반 고도화 스코어링
 * - 테마별 특화 뱃지 (대형회식, 역세권, 가성비, 프라이빗) 자동 부여
 */

const DinnerCalculator = {
  /**
   * 1. 참석자 일정 취합
   */
  aggregateSchedule(members) {
    if (!members || members.length === 0) {
      return { bestDate: "", attendanceCount: 0, totalMembers: 0, rate: 0, attendees: [], absentees: [] };
    }

    const dateCounts = {};
    members.forEach(member => {
      member.availableDates.forEach(date => {
        if (!dateCounts[date]) {
          dateCounts[date] = [];
        }
        dateCounts[date].push(member.name);
      });
    });

    let bestDate = "";
    let maxCount = -1;
    let attendees = [];

    for (const [date, attendeeList] of Object.entries(dateCounts)) {
      if (attendeeList.length > maxCount) {
        maxCount = attendeeList.length;
        bestDate = date;
        attendees = attendeeList;
      }
    }

    const totalMembers = members.length;
    const attendanceCount = attendees.length;
    const rate = totalMembers > 0 ? Math.round((attendanceCount / totalMembers) * 100) : 0;
    const absentees = members
      .filter(m => !attendees.includes(m.name))
      .map(m => m.name);

    return {
      bestDate,
      attendanceCount,
      totalMembers,
      rate,
      attendees,
      absentees
    };
  },

  /**
   * 2. 예산 계산기
   */
  calculateBudget(memberCount, perPersonBudget) {
    const count = memberCount > 0 ? memberCount : 1;
    const total = count * perPersonBudget;
    return {
      perPersonBudget,
      totalBudget: total,
      formattedTotal: total.toLocaleString() + "원"
    };
  },

  /**
   * 3. 고도화된 다면 평가 스코어링 엔진
   */
  filterAndRankRestaurants(options, dataset = (typeof RESTAURANT_DATA !== 'undefined' ? RESTAURANT_DATA : [])) {
    const {
      region = "분당구 전체",
      preferredCategories = [],
      dislikedCategories = [],
      targetBudget = 28000,
      mustHaveParking = false,
      mustHaveRoom = false,
      mustCanReserve = false,
      attendeeCount = 1
    } = options;

    if (!dataset || dataset.length === 0) return { top3: [], others: [], totalMatched: 0 };

    // 1단계: Hard Filtering
    let filtered = dataset.filter(r => {
      // 지역 필터
      if (region && region !== "분당구 전체") {
        const matchRegion = r.region === region || 
                            (r.address_road && r.address_road.includes(region.split("/")[0])) ||
                            (r.address_jibun && r.address_jibun.includes(region.split("/")[0]));
        if (!matchRegion) return false;
      }

      // 필수 제약 조건
      if (mustHaveParking && !r.hasParking) return false;
      if (mustHaveRoom && !r.hasRoom) return false;
      if (mustCanReserve && !r.canReserve) return false;

      // 기피 메뉴 필터
      if (dislikedCategories.length > 0 && dislikedCategories.includes(r.category)) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      filtered = dataset.filter(r => {
        if (dislikedCategories.length > 0 && dislikedCategories.includes(r.category)) return false;
        return true;
      });
    }

    // 핵심 역세권/상권 도로명 키워드 (접근성 가산점용)
    const PRIME_LOCATIONS = ["판교역로", "대왕판교로", "동판교로", "정자일로", "황새울로", "서현로", "야탑로", "성남대로", "불정로", "수내로"];

    // 2단계: 고도화 다면 스코어링 (100점 만점 세분화)
    const scored = filtered.map(r => {
      let score = 0;
      let tags = [];
      let reasons = [];

      // A. 메뉴 적합도 (최대 25점)
      if (preferredCategories.includes(r.category)) {
        score += 25;
        reasons.push(`선호 메뉴 [${r.category}]`);
      } else {
        score += 10;
      }

      // B. 매장 면적 & 단체 수용 쾌적도 점수 (최대 20점) ★차별점 1
      const area = r.area || 40.0;
      if (area >= 120.0) {
        score += 20;
        tags.push("대규모 쾌적공간");
        reasons.push(`대형 매장(${Math.round(area)}㎡)으로 단체 회식에 최적`);
      } else if (area >= 70.0) {
        score += 15;
        if (r.hasRoom) tags.push("프라이빗 룸");
      } else if (area >= 40.0) {
        score += 10;
      } else {
        score += 5; // 협소 매장은 점수 낮춤
      }

      // C. 역세권 / 상업지구 접근성 점수 (최대 15점) ★차별점 2
      const fullAddr = `${r.address_road} ${r.address_jibun}`;
      const isPrimeLocation = PRIME_LOCATIONS.some(loc => fullAddr.includes(loc));
      if (isPrimeLocation) {
        score += 15;
        tags.push("역세권/접근성 우수");
        reasons.push("오피스/지하철 역세권 상권 위치");
      } else {
        score += 8;
      }

      // D. 예산 부합도 및 가성비 효용 (최대 25점) ★차별점 3
      const priceDiff = targetBudget - r.avgPrice;
      const budgetDiffRatio = Math.abs(priceDiff) / targetBudget;

      if (priceDiff >= 0 && priceDiff <= targetBudget * 0.3) {
        // 예산 이내이면서 가성비가 좋은 경우 최고점 부여
        score += 25;
        tags.push("가성비 갓성비");
        reasons.push(`예산 대비 1인 약 ${priceDiff.toLocaleString()}원 절감 효과`);
      } else {
        const budgetScore = Math.max(0, 25 * (1 - budgetDiffRatio));
        score += budgetScore;
        if (budgetDiffRatio <= 0.15) {
          reasons.push(`희망 예산과 약 ${Math.round((1 - budgetDiffRatio) * 100)}% 일치`);
        }
      }

      // E. 편의 옵션 보너스 (최대 10점)
      let facilityScore = 0;
      if (r.hasParking) { facilityScore += 4; tags.push("주차가능"); }
      if (r.hasRoom) { facilityScore += 4; }
      if (r.canReserve) { facilityScore += 2; }
      score += Math.min(10, facilityScore);

      // F. 공공인증 평점 (최대 5점)
      const rating = r.rating || 4.2;
      score += (rating / 5.0) * 5;

      const totalScore = Math.round(score * 10) / 10;

      // 대표 태그 2~3개만 선정
      const uniqueTags = Array.from(new Set(tags)).slice(0, 3);

      return {
        ...r,
        score: totalScore,
        tags: uniqueTags,
        reasoning: reasons.slice(0, 2).join(" • "),
        estimatedTotal: r.avgPrice * (attendeeCount > 0 ? attendeeCount : 1)
      };
    });

    // 점수 내림차순 정렬
    scored.sort((a, b) => b.score - a.score);

    return {
      top3: scored.slice(0, 3),
      others: scored.slice(3, 20), // 4위부터 20위까지 추가 후보군
      totalMatched: scored.length
    };
  }
};
