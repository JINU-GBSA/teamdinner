/**
 * [회식 추천 & 분석 계산 엔진 (빅테크 다면 평가 알고리즘)]
 * - 참석자 일정 취합 (최다 참석일 도출)
 * - 1인당 예산 및 총비용 계산
 * - 매장 면적(쾌적도), 역세권 접근성, 가성비 효용 곡선 기반 고도화 스코어링
 * - 테마별 특화 뱃지 (대형회식, 역세권, 가성비, 프라이빗) 자동 부여
 */

const DinnerCalculator = {
  /**
   * 1. 참석자 일정 취합 (findBestDate / aggregateSchedule 모두 호환)
   */
  findBestDate(members, candidates = []) {
    return this.aggregateSchedule(members, candidates);
  },

  aggregateSchedule(members, candidates = []) {
    if (!members || members.length === 0) {
      return {
        bestDate: "",
        attendingCount: 0,
        attendanceCount: 0,
        totalMembers: 0,
        attendanceRate: 0,
        rate: 0,
        attendingMembers: [],
        attendees: [],
        absentees: []
      };
    }

    const dateCounts = {};
    members.forEach(member => {
      (member.availableDates || []).forEach(date => {
        if (!dateCounts[date]) {
          dateCounts[date] = [];
        }
        dateCounts[date].push(member.name);
      });
    });

    let bestDate = candidates.length > 0 ? candidates[0] : "";
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
    const attendingCount = attendees.length;
    const attendanceRate = totalMembers > 0 ? Math.round((attendingCount / totalMembers) * 100) : 0;
    const absentees = members
      .filter(m => !attendees.includes(m.name))
      .map(m => m.name);

    return {
      bestDate,
      attendingCount,
      attendanceCount: attendingCount,
      totalMembers,
      attendanceRate,
      rate: attendanceRate,
      attendingMembers: attendees,
      attendees,
      absentees
    };
  },

  /**
   * 2. 예산 계산기
   */
  calculateBudget(memberCount, perPersonBudget) {
    const count = Number(memberCount) || 0;
    const price = Number(perPersonBudget) || 30000;
    return {
      perPerson: price,
      memberCount: count,
      totalEstimated: count * price,
      minRecommended: price * 0.8,
      maxRecommended: price * 1.25
    };
  },

  /**
   * 3. 고도화 다면 평가 랭킹 알고리즘
   */
  rankRestaurants(restaurants, preferences, budgetInfo) {
    if (!restaurants || restaurants.length === 0) {
      return { top3: [], others: [], totalMatched: 0 };
    }

    const { region, categories, dislikes, hasRoom, hasParking, canReserve } = preferences;
    const targetBudget = budgetInfo.perPerson;
    const memberCount = budgetInfo.memberCount || 6;

    // 1단계: 하드 필터링 (지역, 알레르기/기피 메뉴, 필수 편의)
    const filtered = restaurants.filter(r => {
      const dong = (r.dong || "").toString();
      const cat = (r.category || "").toString();
      const addr = ((r.address_road || "") + " " + (r.address_jibun || "")).toString();

      // 1-1. 권역 필터
      if (region && region !== "분당구 전체") {
        if (region.includes("판교") && !dong.includes("삼평") && !dong.includes("백현") && !dong.includes("판교") && !addr.includes("판교")) return false;
        if (region.includes("정자") && !dong.includes("정자") && !dong.includes("금곡") && !dong.includes("구미") && !addr.includes("정자")) return false;
        if (region.includes("서현") && !dong.includes("서현") && !dong.includes("수내") && !addr.includes("서현") && !addr.includes("수내")) return false;
        if (region.includes("야탑") && !dong.includes("야탑") && !dong.includes("이매") && !addr.includes("야탑") && !addr.includes("이매")) return false;
        if (region.includes("수정") && !addr.includes("수정") && !addr.includes("중원") && !addr.includes("모란") && !addr.includes("태평")) return false;
      }

      // 1-2. 기피 메뉴 필터 (완전 배제)
      if (dislikes && dislikes.length > 0) {
        for (const badCat of dislikes) {
          if (cat === badCat || (badCat === "회/해산물" && (cat.includes("일식") || cat.includes("회") || cat.includes("해물")))) {
            return false;
          }
          if (badCat === "돼지고기/삼겹살" && (cat.includes("돼지") || cat.includes("삼겹살"))) {
            return false;
          }
          if (badCat === "중식/요리" && (cat.includes("중식") || cat.includes("중화"))) {
            return false;
          }
        }
      }

      // 1-3. 필수 제약 조건 필터
      if (hasRoom && !r.hasRoom) return false;
      if (hasParking && !r.hasParking) return false;
      if (canReserve && !r.canReserve) return false;

      return true;
    });

    // 2단계: 다면 복합 점수 산출
    const scored = filtered.map(r => {
      let score = 50; // 기본 점수
      const matchReasons = [];
      const tags = [];

      // A. 메뉴 선호도 매칭 (최대 +30점)
      if (categories && categories.length > 0) {
        if (categories.includes(r.category)) {
          score += 25;
          matchReasons.push("선호 메뉴 일치");
        } else {
          score -= 10;
        }
      }

      // B. 매장 면적 및 단체 수용도 (최대 +20점)
      const area = r.area || 50;
      if (area >= 180) {
        score += 20;
        tags.push("대규모 쾌적공간");
        matchReasons.push("180㎡+ 대형 매장");
      } else if (area >= 100) {
        score += 12;
        tags.push("단체석 완비");
      } else if (area < 40 && memberCount >= 8) {
        score -= 15; // 다인원 대비 너무 협소한 매장 감점
      }

      // C. 역세권 및 오피스 접근성 (최대 +15점)
      const addr = (r.address_road || r.address_jibun || "");
      if (addr.includes("판교역로") || addr.includes("정자일로") || addr.includes("황새울로") || addr.includes("야탑로") || addr.includes("성남대로")) {
        score += 15;
        tags.push("역세권/접근성 우수");
        matchReasons.push("주요 역세권 대로변");
      }

      // D. 예산 대비 가성비 & 효용 곡선 (최대 +25점)
      const price = r.avgPrice;
      const budgetDiff = price - targetBudget;

      if (budgetDiff <= 0 && budgetDiff >= -10000) {
        // 타겟 예산 이하로 합리적인 경우
        score += 25;
        tags.push("가성비 갓성비");
        matchReasons.push("예산 완벽 부합");
      } else if (budgetDiff > 0 && budgetDiff <= 10000) {
        // 약간 초과하지만 허용 범위인 경우
        score += 15;
      } else if (budgetDiff > 20000) {
        // 예산 대폭 초과 감점
        score -= 20;
      }

      // E. 편의시설 보너스
      if (r.hasRoom) tags.push("프라이빗 룸");
      if (r.hasParking) tags.push("주차 용이");

      return {
        ...r,
        score: Math.max(10, Math.min(100, score)),
        tags: Array.from(new Set(tags)),
        matchReasons
      };
    });

    // 점수 내림차순 정렬 (동점일 경우 면적 큰 순)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.area || 0) - (a.area || 0);
    });

    const top3 = scored.slice(0, 3);
    const others = scored.slice(3, 20);

    return {
      top3,
      others,
      totalMatched: scored.length
    };
  }
};

if (typeof window !== "undefined") {
  window.DinnerCalculator = DinnerCalculator;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DinnerCalculator;
}

