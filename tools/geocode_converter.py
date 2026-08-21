"""
[공공데이터 지오코딩 및 data.js 일괄 변환기]
- 네이버 클라우드 플랫폼(NCP) Maps Geocoding API를 사용하여
  공공데이터 CSV의 주소(도로명/지번)를 정확한 위도(lat)/경도(lng)로 변환하고
  웹앱용 js/data.js 파일로 자동 빌드합니다.
"""

import csv
import json
import os
import urllib.request
import urllib.parse

# 1. 네이버 클라우드 플랫폼 Maps API 키 설정
# 환경변수 또는 직접 입력 (https://www.ncloud.com -> Application 등록)
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "YOUR_CLIENT_ID_HERE")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "YOUR_CLIENT_SECRET_HERE")

def get_coordinates_naver(address: str):
    """
    네이버 지오코딩 API를 호출하여 주소 -> (위도, 경도) 변환
    """
    if NAVER_CLIENT_ID == "YOUR_CLIENT_ID_HERE":
        print("[Notice] 네이버 API 키가 설정되지 않아 더미 좌표를 반환합니다.")
        return 37.441865, 127.135431

    encoded_addr = urllib.parse.quote(address)
    url = f"https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query={encoded_addr}"
    
    req = urllib.request.Request(url)
    req.add_header("X-NCP-APIGW-API-KEY-ID", NAVER_CLIENT_ID)
    req.add_header("X-NCP-APIGW-API-KEY", NAVER_CLIENT_SECRET)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                res_body = response.read().decode('utf-8')
                data = json.loads(res_body)
                if data.get("addresses") and len(data["addresses"]) > 0:
                    item = data["addresses"][0]
                    lng = float(item["x"])  # 네이버 x: 경도
                    lat = float(item["y"])  # 네이버 y: 위도
                    return lat, lng
    except Exception as e:
        print(f"[Error] 지오코딩 실패 ({address}): {e}")
    
    return None, None

def convert_csv_to_data_js(csv_file_path: str, output_js_path: str):
    """
    공공데이터 CSV를 읽어 지오코딩 수행 후 data.js 생성
    """
    if not os.path.exists(csv_file_path):
        print(f"[Warning] CSV 파일이 존재하지 않습니다: {csv_file_path}")
        return

    restaurants = []
    print(f"[*] 공공데이터 CSV 변환 시작: {csv_file_path}")
    
    with open(csv_file_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        idx = 1
        for row in reader:
            name = row.get("식당명") or row.get("상호명") or row.get("사업장명")
            road_addr = row.get("소재지(도로명)") or row.get("도로명주소", "")
            jibun_addr = row.get("소재지(지번)") or row.get("지번주소", "")
            category = row.get("업종") or row.get("카테고리", "한식/기타")
            tel = row.get("전화번호", "02-000-0000")
            
            query_addr = road_addr if road_addr else jibun_addr
            if not query_addr:
                continue
                
            print(f"[{idx}] {name} 지오코딩 중: {query_addr}")
            lat, lng = get_coordinates_naver(query_addr)
            
            if lat and lng:
                restaurants.append({
                    "id": idx,
                    "name": name,
                    "region": row.get("지역", "수도권"),
                    "category": category,
                    "address_road": road_addr,
                    "address_jibun": jibun_addr,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "avgPrice": int(row.get("평균가격", 28000)),
                    "hasParking": True if row.get("주차여부", "Y").upper() == "Y" else False,
                    "hasRoom": True if row.get("룸여부", "Y").upper() == "Y" else False,
                    "canReserve": True if row.get("예약가능", "Y").upper() == "Y" else False,
                    "rating": float(row.get("평점", 4.3)),
                    "tel": tel,
                    "description": row.get("설명", "공공데이터 안심/모범음식점")
                })
                idx += 1

    js_content = f"// [공공데이터 자동 변환 생성 파일 - Naver Maps Geocoding API 기반]\nconst RESTAURANT_DATA = {json.dumps(restaurants, ensure_ascii=False, indent=2)};\n"
    with open(output_js_path, mode="w", encoding="utf-8") as out_f:
        out_f.write(js_content)
        
    print(f"[성공] 총 {len(restaurants)}개 식당이 {output_js_path} 에 저장되었습니다.")

if __name__ == "__main__":
    convert_csv_to_data_js("sample_data.csv", "../js/data.js")
