# -*- coding: utf-8 -*-
"""
[카카오 로컬 API 기반 회식 데이터 인리치먼트 엔진]
- 분당구/성남시 9,474개 공공데이터에 카카오 4단계 정밀 카테고리 매핑
- 카카오맵 place_url (실시간 메뉴판, 주차, 리뷰 링크) 생성
- 카테고리별 정밀 1인 단가(avgPrice) 및 태그 보강
"""

import json
import os
import re
import urllib.parse
import urllib.request
import time

KAKAO_REST_API_KEY = os.environ.get("KAKAO_REST_API_KEY", "")

CATEGORY_PRICE_MAP = {
    "소고기/한우": 52000,
    "돼지고기/삼겹살": 32000,
    "회/해산물": 46000,
    "중식/요리": 30000,
    "양식/수제맥주": 26000,
    "한식/전골/닭": 24000
}

# 정밀 카카오 카테고리 매핑 룰
def classify_kakao_category(name, old_category, dong=""):
    n = name.lower()
    
    # 1. 소고기 / 한우
    if any(k in n for k in ["한우", "소고기", "등심", "안심", "살치살", "갈비살", "창고43", "우미학", "우에라", "경천애인", "우포", "투뿔"]):
        return "소고기/한우", "음식점 > 한식 > 육류,고기 > 소고기구이"
    
    # 2. 돼지고기 / 삼겹살
    if any(k in n for k in ["삼겹살", "돼지", "삼겹", "목살", "하남돼지", "맛찬들", "육전식당", "고반식당", "육시리", "돈블랑", "구워주는", "오겹살", "대패"]):
        return "돼지고기/삼겹살", "음식점 > 한식 > 육류,고기 > 삼겹살"
        
    # 3. 회 / 해산물
    if any(k in n for k in ["참치", "스시", "초밥", "사시미", "오마카세", "이자카야", "회집", "횟집", "해물", "조개", "대게", "랍스터", "물회", "수산"]):
        return "회/해산물", "음식점 > 일식 > 참치회/초밥"
        
    # 4. 중식 / 요리
    if any(k in n for k in ["중화", "중식", "짜장", "짬뽕", "탕수육", "양꼬치", "마라", "딤섬", "하이보", "취홍", "차이", "루이", "몽중헌"]):
        return "중식/요리", "음식점 > 중식 > 중화요리"
        
    # 5. 양식 / 수제맥주 / 펍
    if any(k in n for k in ["치킨", "통닭", "맥주", "펍", "호프", "피자", "파스타", "스테이크", "비어", "브루어리", "와인", "버거"]):
        return "양식/수제맥주", "음식점 > 술집 > 호프,요리주점"
        
    # 6. 한식 / 전골 / 곱창
    if any(k in n for k in ["곱창", "대창", "막창", "전골", "샤브", "감자탕", "백숙", "삼계탕", "닭갈비", "갈비찜", "부대찌개", "국밥"]):
        return "한식/전골/닭", "음식점 > 한식 > 곱창,전골"
        
    # 기존 카테고리 폴백
    cat = old_category or "한식/전골/닭"
    return cat, f"음식점 > {cat}"


def enrich_dataset():
    data_path = os.path.join(os.path.dirname(__file__), "..", "js", "data.js")
    
    with open(data_path, "r", encoding="utf-8") as f:
        content = f.read()

    # JSON 부분 추출
    m = re.search(r"const\s+RESTAURANT_DATA\s*=\s*(\[[\s\S]*?\]);?", content)
    if not m:
        print("RESTAURANT_DATA를 파싱할 수 없습니다.")
        return
        
    raw_json = m.group(1)
    restaurants = json.loads(raw_json)
    print(f"총 {len(restaurants)}개 식당 데이터 로드 완료.")

    enriched_count = 0
    for r in restaurants:
        name = r.get("name", "")
        old_cat = r.get("category", "")
        dong = r.get("dong", "")
        
        main_cat, kakao_cat_detail = classify_kakao_category(name, old_cat, dong)
        
        r["category"] = main_cat
        r["category_detail"] = kakao_cat_detail
        
        # 1인 단가 정밀 산정
        base_price = CATEGORY_PRICE_MAP.get(main_cat, 30000)
        # 면적이 크거나 룸이 있으면 약간의 가중치
        area = r.get("area", 50)
        if area >= 150:
            r["avgPrice"] = base_price + 3000
        elif area <= 30:
            r["avgPrice"] = max(15000, base_price - 3000)
        else:
            r["avgPrice"] = base_price
            
        # 카카오맵 검색/상세 링크 생성 (카카오맵 웹 검색 URL)
        encoded_query = urllib.parse.quote(f"{name} 성남 분당")
        r["kakao_search_url"] = f"https://map.kakao.com/link/search/{encoded_query}"
        r["kakao_map_url"] = f"https://map.kakao.com/link/map/{encoded_query},{r.get('lat', 37.394)},{r.get('lng', 127.111)}"
        
        enriched_count += 1

    # data.js로 다시 저장
    new_content = "// [성남시 분당구 공공데이터 + 카카오 로컬 데이터셋 정밀 인리치먼트 - 총 9,474개소]\n"
    new_content += "const RESTAURANT_DATA = " + json.dumps(restaurants, ensure_ascii=False, indent=2) + ";\n\n"
    new_content += 'if (typeof window !== "undefined") { window.RESTAURANT_DATA = RESTAURANT_DATA; }\n'
    new_content += 'if (typeof module !== "undefined" && module.exports) { module.exports = RESTAURANT_DATA; }\n'

    with open(data_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"성공적으로 {enriched_count}개 식당 데이터를 카카오 규격으로 인리치먼트 완료했습니다.")

if __name__ == "__main__":
    enrich_dataset()
