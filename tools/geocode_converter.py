"""
[네이버 Maps API 기반 지오코딩 일괄 변환기]
- 신규 Maps 엔드포인트: https://maps.apigw.ntruss.com/map-geocode/v2/geocode
- 캐시(geocode_cache.json)를 활용해 중복 호출 방지 및 API 할당량 절약
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

CACHE_FILE = Path(__file__).parent / "geocode_cache.json"

def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def load_cache():
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def geocode_address(address, client_id, client_secret, cache):
    if not address or address in ("-", "nan", "None"):
        return None, None
        
    clean_addr = address.strip()
    if clean_addr in cache:
        return cache[clean_addr]["lat"], cache[clean_addr]["lng"]
        
    url = f"https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query={urllib.parse.quote(clean_addr)}"
    req = urllib.request.Request(url)
    req.add_header("X-NCP-APIGW-API-KEY-ID", client_id)
    req.add_header("X-NCP-APIGW-API-KEY", client_secret)
    
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.getcode() == 200:
                data = json.loads(res.read().decode("utf-8"))
                if data.get("addresses") and len(data["addresses"]) > 0:
                    item = data["addresses"][0]
                    lat = float(item["y"])
                    lng = float(item["x"])
                    cache[clean_addr] = {"lat": lat, "lng": lng}
                    return lat, lng
    except Exception as e:
        pass
        
    return None, None
