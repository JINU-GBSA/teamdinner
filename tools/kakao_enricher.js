const fs = require('fs');
const path = require('path');

const CATEGORY_PRICE_MAP = {
  "소고기/한우": 52000,
  "돼지고기/삼겹살": 32000,
  "회/해산물": 46000,
  "중식/요리": 30000,
  "양식/수제맥주": 26000,
  "한식/전골/닭": 24000
};

function classifyKakaoCategory(name, oldCategory, dong) {
  const n = (name || "").toLowerCase();

  // 1. 소고기 / 한우
  if (["한우", "소고기", "등심", "안심", "살치살", "갈비살", "창고43", "우미학", "우에라", "경천애인", "우포", "투뿔", "우대", "소갈비"].some(k => n.includes(k))) {
    return { mainCat: "소고기/한우", detailCat: "음식점 > 한식 > 육류,고기 > 소고기구이" };
  }

  // 2. 돼지고기 / 삼겹살
  if (["삼겹살", "돼지", "삼겹", "목살", "하남돼지", "맛찬들", "육전식당", "고반식당", "육시리", "돈블랑", "구워주는", "오겹살", "대패", "돝고기", "돼지갈비"].some(k => n.includes(k))) {
    return { mainCat: "돼지고기/삼겹살", detailCat: "음식점 > 한식 > 육류,고기 > 삼겹살" };
  }

  // 3. 회 / 해산물
  if (["참치", "스시", "초밥", "사시미", "오마카세", "이자카야", "회집", "횟집", "해물", "조개", "대게", "랍스터", "물회", "수산", "바다"].some(k => n.includes(k))) {
    return { mainCat: "회/해산물", detailCat: "음식점 > 일식 > 참치회/초밥/사시미" };
  }

  // 4. 중식 / 요리
  if (["중화", "중식", "짜장", "짬뽕", "탕수육", "양꼬치", "마라", "딤섬", "하이보", "취홍", "차이", "루이", "몽중헌", "동천홍", "팔선"].some(k => n.includes(k))) {
    return { mainCat: "중식/요리", detailCat: "음식점 > 중식 > 중화요리/양꼬치" };
  }

  // 5. 양식 / 수제맥주 / 펍
  if (["치킨", "통닭", "맥주", "펍", "호프", "피자", "파스타", "스테이크", "비어", "브루어리", "와인", "버거", "다이닝", "비스트로"].some(k => n.includes(k))) {
    return { mainCat: "양식/수제맥주", detailCat: "음식점 > 술집 > 호프,요리주점/펍" };
  }

  // 6. 한식 / 전골 / 곱창
  if (["곱창", "대창", "막창", "전골", "샤브", "감자탕", "백숙", "삼계탕", "닭갈비", "갈비찜", "부대찌개", "국밥", "순대", "보쌈", "족발"].some(k => n.includes(k))) {
    return { mainCat: "한식/전골/닭", detailCat: "음식점 > 한식 > 곱창,전골,보쌈" };
  }

  const fallback = oldCategory || "한식/전골/닭";
  return { mainCat: fallback, detailCat: `음식점 > ${fallback}` };
}

const dataPath = path.join(__dirname, '..', 'js', 'data.js');
let fileContent = fs.readFileSync(dataPath, 'utf8');

// module.exports 임시 치환하여 안전하게 파싱
fileContent = fileContent.replace('const RESTAURANT_DATA =', 'module.exports =');
const tempPath = path.join(__dirname, 'data_temp.js');
fs.writeFileSync(tempPath, fileContent, 'utf8');

const restaurants = require(tempPath);
fs.unlinkSync(tempPath);

console.log(`총 ${restaurants.length}개 식당 데이터 로드 완료.`);

let count = 0;
restaurants.forEach(r => {
  const { mainCat, detailCat } = classifyKakaoCategory(r.name, r.category, r.dong);
  r.category = mainCat;
  r.category_detail = detailCat;

  const basePrice = CATEGORY_PRICE_MAP[mainCat] || 30000;
  const area = r.area || 50;
  if (area >= 150) {
    r.avgPrice = basePrice + 3000;
  } else if (area <= 30) {
    r.avgPrice = Math.max(15000, basePrice - 3000);
  } else {
    r.avgPrice = basePrice;
  }

  const query = encodeURIComponent(`${r.name} 성남`);
  r.kakao_search_url = `https://map.kakao.com/link/search/${query}`;
  r.kakao_map_url = `https://map.kakao.com/link/to/${query},${r.lat},${r.lng}`;
  count++;
});

let newContent = '// [성남시 분당구 공공데이터 + 카카오 로컬 정밀 인리치먼트 - 총 9,474개소]\n';
newContent += 'const RESTAURANT_DATA = ' + JSON.stringify(restaurants, null, 2) + ';\n\n';
newContent += 'if (typeof window !== "undefined") { window.RESTAURANT_DATA = RESTAURANT_DATA; }\n';
newContent += 'if (typeof module !== "undefined" && module.exports) { module.exports = RESTAURANT_DATA; }\n';

fs.writeFileSync(dataPath, newContent, 'utf8');
console.log(`✅ 성공적으로 ${count}개 식당 데이터에 카카오 정밀 카테고리 & 카카오맵 링크 인리치먼트를 완료했습니다.`);
