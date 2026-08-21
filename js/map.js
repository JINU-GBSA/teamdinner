/**
 * [오픈소스 지도 렌더러 (Leaflet.js + OpenStreetMap - Zero API Key)]
 */

const DinnerMap = {
  mapInstance: null,
  markersLayer: null,
  markerMap: {},

  init(elementId = "map") {
    const mapContainer = document.getElementById(elementId);
    if (!mapContainer) return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.mapInstance = L.map(elementId).setView([37.394200, 127.111200], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.mapInstance);

    this.markersLayer = L.featureGroup().addTo(this.mapInstance);
    this.markerMap = {};
  },

  renderTop3(top3Restaurants, others = []) {
    if (!this.mapInstance) {
      this.init("map");
    }

    this.mapInstance.invalidateSize();
    this.markersLayer.clearLayers();
    this.markerMap = {};

    if (!top3Restaurants || top3Restaurants.length === 0) return;

    const rankColors = ["#EAB308", "#94A3B8", "#D97706"];
    const rankBadges = ["🥇 1순위 추천", "🥈 2순위 추천", "🥉 3순위 추천"];
    const bounds = [];

    // Top 3 마커 렌더링
    top3Restaurants.forEach((r, idx) => {
      const color = rankColors[idx] || "#3B82F6";
      const rankTitle = rankBadges[idx] || `${idx + 1}순위`;

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: ${color};
            color: #fff;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 15px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([r.lat, r.lng], { icon: customIcon });

      const tagsHtml = (r.tags || []).map(t => `<span style="background:#EFF6FF;color:#1D4ED8;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;margin-right:3px;">#${t}</span>`).join("");

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="font-size: 11px; font-weight: bold; color: ${color}; margin-bottom: 2px;">${rankTitle} (종합 ${r.score}점)</div>
          <div style="font-size: 15px; font-weight: bold; margin-bottom: 4px;">${r.name}</div>
          <div style="margin-bottom: 6px;">${tagsHtml}</div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">🏷️ ${r.category} | 1인 약 ${r.avgPrice.toLocaleString()}원</div>
          <div style="font-size: 11px; color: #6B7280; margin-bottom: 6px;">📍 ${r.address_road || r.address_jibun}</div>
          <div style="font-size: 11px; background: #F3F4F6; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
            ${r.hasRoom ? '🚪단체룸/석 ' : ''}${r.hasParking ? '🚗주차가능 ' : ''}🏢면적 ${r.area || 50}㎡
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #2563EB;">📞 <a href="tel:${r.tel}" style="color: #2563EB; text-decoration: none;">${r.tel}</a></div>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
      this.markerMap[r.id] = marker;
      bounds.push([r.lat, r.lng]);
    });

    // 추가 후보군(4위~20위) 서브 마커 렌더링 (연한 파란색 작은 핀)
    others.forEach((r, idx) => {
      const rankNum = idx + 4;
      const subIcon = L.divIcon({
        className: "custom-sub-pin",
        html: `
          <div style="
            background-color: #3B82F6;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 11px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 1.5px solid white;
          ">
            ${rankNum}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([r.lat, r.lng], { icon: subIcon });
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-size: 11px; font-weight: bold; color: #2563EB; margin-bottom: 2px;">후보 ${rankNum}위 (${r.score}점)</div>
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${r.name}</div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">🏷️ ${r.category} | 1인 약 ${r.avgPrice.toLocaleString()}원</div>
          <div style="font-size: 11px; color: #6B7280; margin-bottom: 6px;">📍 ${r.address_road || r.address_jibun}</div>
          <div style="font-size: 12px; font-weight: bold; color: #2563EB;">📞 <a href="tel:${r.tel}" style="color: #2563EB; text-decoration: none;">${r.tel}</a></div>
        </div>
      `;
      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
      this.markerMap[r.id] = marker;
      bounds.push([r.lat, r.lng]);
    });

    if (bounds.length === 1) {
      this.mapInstance.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      this.mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  },

  focusRestaurant(id, lat, lng) {
    if (!this.mapInstance) return;
    this.mapInstance.flyTo([lat, lng], 16, { duration: 0.8 });
    const marker = this.markerMap[id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 900);
    }
  }
};
