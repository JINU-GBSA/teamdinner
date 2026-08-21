/**
 * [회식의 정석 - TDS 스타일 지도 렌더러]
 * - Leaflet & OpenStreetMap 기반
 * - 토스 감성의 커스텀 마커 & 미니멀 팝업
 */

const DinnerMap = {
  mapInstance: null,
  markersLayer: null,
  markerMap: {},

  init(elementId = "map") {
    const mapContainer = document.getElementById(elementId);
    if (!mapContainer) return;

    if (this.mapInstance) {
      this.mapInstance.invalidateSize();
      return;
    }

    // 판교역 기준
    const defaultCenter = [37.394200, 127.111200];

    this.mapInstance = L.map(elementId, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.mapInstance);

    this.markersLayer = L.featureGroup().addTo(this.mapInstance);
  },

  renderTop3(top3Restaurants = [], others = []) {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    if (!this.mapInstance) {
      this.init("map");
    }

    this.clearAll();

    if ((!top3Restaurants || top3Restaurants.length === 0) && (!others || others.length === 0)) {
      return;
    }

    const bounds = [];
    const rankColors = ["#3182F6", "#4E5968", "#6B7684"];

    // 1. Top 3 마커 (토스 블루 & 차콜 핀)
    top3Restaurants.forEach((r, idx) => {
      const color = rankColors[idx] || "#3182F6";
      const isFirst = idx === 0;

      const customIcon = L.divIcon({
        className: "toss-map-pin",
        html: `
          <div style="
            background-color: ${isFirst ? '#3182F6' : '#191F28'};
            color: #ffffff;
            width: ${isFirst ? '36px' : '30px'};
            height: ${isFirst ? '36px' : '30px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: ${isFirst ? '16px' : '13px'};
            box-shadow: 0 4px 12px rgba(25, 31, 40, 0.3);
            border: 2px solid white;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([r.lat, r.lng], { icon: customIcon });
      const tagsHtml = (r.tags || []).map(t => `<span style="background:#E8F3FF;color:#3182F6;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;margin-right:4px;">#${t}</span>`).join("");

      const popupContent = `
        <div style="padding: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; min-width: 200px; line-height: 1.45;">
          <div style="font-size: 11px; font-weight: 800; color: ${isFirst ? '#3182F6' : '#4E5968'}; margin-bottom: 2px;">
            ${idx + 1}순위 추천 (${r.score}점)
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #191F28; margin-bottom: 4px;">${r.name}</div>
          <div style="margin-bottom: 6px;">${tagsHtml}</div>
          <div style="font-size: 13px; color: #4E5968; margin-bottom: 4px;">
            🏷️ ${r.category} · 1인 <strong>${r.avgPrice.toLocaleString()}원</strong>
          </div>
          <div style="font-size: 11px; color: #8B95A1; margin-bottom: 8px;">📍 ${r.address_road || r.address_jibun}</div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; border-top: 1px solid #f2f4f6; padding-top: 6px;">
            <a href="${r.kakao_search_url || `https://map.kakao.com/link/search/${encodeURIComponent(r.name + " 성남")}`}" target="_blank" rel="noopener noreferrer" style="background: #FEE500; color: #191919; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-decoration: none;">
              카카오맵 메뉴판 ↗
            </a>
            <div style="font-size: 12px; font-weight: 700; color: #3182F6;">
              📞 <a href="tel:${r.tel}" style="color: #3182F6; text-decoration: none;">${r.tel}</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
      this.markerMap[r.id] = { marker, lat: r.lat, lng: r.lng };
      bounds.push([r.lat, r.lng]);
    });

    // 2. 추가 후보 (4위 ~ 20위)
    others.forEach((r, idx) => {
      const rankNum = idx + 4;
      const subIcon = L.divIcon({
        className: "toss-sub-pin",
        html: `
          <div style="
            background-color: #8B95A1;
            color: #ffffff;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 11px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 1.5px solid white;
            cursor: pointer;
          ">
            ${rankNum}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12]
      });

      const marker = L.marker([r.lat, r.lng], { icon: subIcon });
      const popupContent = `
        <div style="padding: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #6B7684;">후보 ${rankNum}위 (${r.score}점)</div>
          <div style="font-size: 14px; font-weight: 800; color: #191F28; margin-bottom: 3px;">${r.name}</div>
          <div style="font-size: 12px; color: #4E5968;">${r.category} · 1인 ${r.avgPrice.toLocaleString()}원</div>
          <div style="font-size: 11px; color: #8B95A1; margin-top: 3px;">📞 ${r.tel}</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
      this.markerMap[r.id] = { marker, lat: r.lat, lng: r.lng };
      bounds.push([r.lat, r.lng]);
    });

    // 지도 뷰포트 맞춤
    const updateMapBounds = () => {
      if (!this.mapInstance) return;
      this.mapInstance.invalidateSize();
      if (bounds.length === 1) {
        this.mapInstance.setView(bounds[0], 15);
      } else if (bounds.length > 1) {
        this.mapInstance.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 15
        });
      }
    };

    setTimeout(updateMapBounds, 50);
    setTimeout(updateMapBounds, 250);
  },

  focusRestaurant(id, lat, lng) {
    if (!this.mapInstance) return;

    const item = this.markerMap[id];
    if (item) {
      this.mapInstance.flyTo([lat, lng], 16, { duration: 0.8 });
      setTimeout(() => {
        item.marker.openPopup();
      }, 850);
    } else {
      this.mapInstance.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  },

  clearAll() {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }
    this.markerMap = {};
  }
};
