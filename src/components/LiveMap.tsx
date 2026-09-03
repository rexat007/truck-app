import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DriverTruck, Project, TripLog, GPSLocation } from '../types';
import { Truck, MapPin, Navigation, Eye, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface LiveMapProps {
  trucks: DriverTruck[];
  projects: Project[];
  trips: TripLog[];
  selectedTruckPlate?: string | null;
  onSelectTruck?: (plate: string) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  trucks,
  projects,
  trips,
  selectedTruckPlate,
  onSelectTruck,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routesGroupRef = useRef<L.LayerGroup | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Riyadh / Central Saudi Arabia
      const map = L.map(mapContainerRef.current, {
        center: [24.65, 46.6],
        zoom: 10,
        zoomControl: false,
      });

      // Add clean dark/modern tiles from CartoDB or OpenStreetMap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topleft' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      routesGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // cleanup handled on unmount if necessary
    };
  }, []);

  // Update Markers & Polylines whenever trucks, trips, or projects change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const routesGroup = routesGroupRef.current;
    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Plot Project Loading and Unloading Sites
    projects.forEach((proj) => {
      if (selectedProject !== 'all' && proj.Project_Name !== selectedProject) return;

      const loadLat = proj.Loading_Location.lat;
      const loadLng = proj.Loading_Location.lng;
      const unloadLat = proj.Unloading_Location.lat;
      const unloadLng = proj.Unloading_Location.lng;

      bounds.extend([loadLat, loadLng]);
      bounds.extend([unloadLat, unloadLng]);

      // Loading Site Icon (Amber / Quarry)
      const loadIcon = L.divIcon({
        className: 'custom-hub-icon',
        html: `
          <div style="background-color: #d97706; border: 2px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); color: white; font-size: 16px;">
            🏗️
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const loadMarker = L.marker([loadLat, loadLng], { icon: loadIcon });
      loadMarker.bindPopup(`
        <div style="text-align: right; font-family: Tajawal, sans-serif; min-width: 180px;">
          <h4 style="font-weight: bold; color: #f59e0b; margin-bottom: 4px;">موقع التحميل / الكسارة</h4>
          <p style="font-size: 13px; font-weight: bold; margin: 0; color: #fff;">${proj.Loading_Location.name || proj.Project_Name}</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">المشروع: ${proj.Project_Name}</p>
        </div>
      `);
      markersGroup.addLayer(loadMarker);

      // Loading Geofence circle
      const loadCircle = L.circle([loadLat, loadLng], {
        radius: 600,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
      });
      routesGroup.addLayer(loadCircle);

      // Unloading Site Icon (Emerald / Dump Site)
      const unloadIcon = L.divIcon({
        className: 'custom-hub-icon',
        html: `
          <div style="background-color: #059669; border: 2px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); color: white; font-size: 16px;">
            🎯
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const unloadMarker = L.marker([unloadLat, unloadLng], { icon: unloadIcon });
      unloadMarker.bindPopup(`
        <div style="text-align: right; font-family: Tajawal, sans-serif; min-width: 180px;">
          <h4 style="font-weight: bold; color: #10b981; margin-bottom: 4px;">موقع التفريغ / الردم</h4>
          <p style="font-size: 13px; font-weight: bold; margin: 0; color: #fff;">${proj.Unloading_Location.name || proj.Project_Name}</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">المسافة المعتمدة: ${proj.Distance_KM} كم</p>
        </div>
      `);
      markersGroup.addLayer(unloadMarker);

      // Unloading Geofence circle
      const unloadCircle = L.circle([unloadLat, unloadLng], {
        radius: 600,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
      });
      routesGroup.addLayer(unloadCircle);

      // Route Polyline connecting them
      const routeLine = L.polyline(
        [
          [loadLat, loadLng],
          [(loadLat + unloadLat) / 2 + 0.015, (loadLng + unloadLng) / 2 - 0.01],
          [unloadLat, unloadLng],
        ],
        {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.6,
          dashArray: '6, 6',
        }
      );
      routesGroup.addLayer(routeLine);
    });

    // 2. Plot Trucks & Active Trips
    trucks.forEach((truck) => {
      // Find current active trip or last trip for this truck
      const activeTrip = trips.find(
        (t) => t.Plate_Number === truck.Plate_Number && t.Trip_Status === 'In-Transit'
      );
      const lastTrip = trips.find((t) => t.Plate_Number === truck.Plate_Number);

      const truckStatus = activeTrip
        ? 'In-Transit'
        : truck.Status === 'Maintenance'
        ? 'Maintenance'
        : 'Available';

      // Status filtering
      if (filterStatus === 'loaded' && !activeTrip) return;
      if (filterStatus === 'empty' && activeTrip) return;
      if (filterStatus === 'maintenance' && truckStatus !== 'Maintenance') return;

      // Determine GPS position
      let lat = 24.62;
      let lng = 46.55;
      let speed = 0;
      let locationLabel = 'الموقع التقديري للأسطول';

      if (activeTrip && activeTrip.Current_GPS_Location) {
        lat = activeTrip.Current_GPS_Location.lat;
        lng = activeTrip.Current_GPS_Location.lng;
        speed = activeTrip.Current_GPS_Location.speed || 60;
        locationLabel = activeTrip.Current_GPS_Location.name || 'في المسار النشط';
      } else if (lastTrip?.Current_GPS_Location) {
        lat = lastTrip.Current_GPS_Location.lat;
        lng = lastTrip.Current_GPS_Location.lng;
        locationLabel = 'آخر موقع مسجل';
      } else {
        // distribute slightly around depot
        lat = 24.60 + (truck.Plate_Number.charCodeAt(0) % 5) * 0.02;
        lng = 46.50 + (truck.Plate_Number.charCodeAt(1) % 5) * 0.02;
      }

      bounds.extend([lat, lng]);

      // Color coding:
      // Emerald: Loaded & In-Transit
      // Sky/Blue: Available / Empty
      // Rose: Discrepancy or Maintenance
      const isLoaded = activeTrip && (activeTrip.Net_Weight_Tons || 0) > 0;
      const isDiscrepancy = activeTrip?.Trip_Status === 'Discrepancy' || lastTrip?.Trip_Status === 'Discrepancy';
      const bgColor = isDiscrepancy
        ? '#ef4444'
        : isLoaded
        ? '#10b981'
        : truckStatus === 'Maintenance'
        ? '#f59e0b'
        : '#0284c7';

      const truckIcon = L.divIcon({
        className: 'truck-marker-pin',
        html: `
          <div style="position: relative; cursor: pointer;">
            <div style="background-color: ${bgColor}; border: 2.5px solid #ffffff; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transform: rotate(${activeTrip?.Current_GPS_Location?.heading || 0}deg); transition: all 0.3s ease;">
              <span style="font-size: 18px;">🚛</span>
            </div>
            ${
              isLoaded
                ? `<span style="position: absolute; -top: 6px; -right: 6px; background-color: #10b981; color: #0f172a; font-size: 9px; font-weight: 900; padding: 2px 4px; border-radius: 9999px; border: 1px solid white;">محملة</span>`
                : `<span style="position: absolute; -top: 6px; -right: 6px; background-color: #38bdf8; color: #0f172a; font-size: 9px; font-weight: 900; padding: 2px 4px; border-radius: 9999px; border: 1px solid white;">فارغة</span>`
            }
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([lat, lng], { icon: truckIcon });

      const popupHtml = `
        <div style="text-align: right; font-family: Tajawal, sans-serif; min-width: 220px; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-weight: 800; font-size: 14px; color: #0f172a;">${truck.Plate_Number}</span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; background-color: ${bgColor}20; color: ${bgColor}; border: 1px solid ${bgColor};">
              ${isLoaded ? 'محملة (في الرد)' : truckStatus === 'Maintenance' ? 'صيانة' : 'فارغة / جاهزة'}
            </span>
          </div>

          <p style="margin: 3px 0; font-size: 12px; color: #475569;">السائق: <strong style="color: #0f172a;">${truck.Driver_Name}</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;">الهاتف: <span style="direction: ltr; display: inline-block;">${truck.Phone_Number}</span></p>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;">نوع الشاحنة: ${truck.Truck_Type}</p>
          
          ${
            activeTrip
              ? `
            <div style="background-color: #f8fafc; padding: 6px 8px; border-radius: 8px; margin: 8px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #4f46e5;">المشروع: <strong>${activeTrip.Project_Name}</strong></p>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px;">
                <span style="color: #64748b;">الحمولة الصافية:</span>
                <span style="color: #059669; font-weight: bold;">${activeTrip.Net_Weight_Tons} طن</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 11px;">
                <span style="color: #64748b;">السرعة الحالية:</span>
                <span style="color: #d97706; font-weight: bold;">${speed} كم/س</span>
              </div>
            </div>
            `
              : ''
          }
          
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">الموقع: ${locationLabel}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectTruck) {
          onSelectTruck(truck.Plate_Number);
        }
      });

      markersGroup.addLayer(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [trucks, projects, trips, filterStatus, selectedProject, onSelectTruck]);

  // Center on selected truck if requested
  useEffect(() => {
    if (!selectedTruckPlate || !mapInstanceRef.current) return;
    const activeTrip = trips.find((t) => t.Plate_Number === selectedTruckPlate);
    if (activeTrip?.Current_GPS_Location) {
      mapInstanceRef.current.setView(
        [activeTrip.Current_GPS_Location.lat, activeTrip.Current_GPS_Location.lng],
        13,
        { animate: true }
      );
    }
  }, [selectedTruckPlate, trips]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col">
      {/* Bento Map Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex flex-wrap justify-between items-center gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">خريطة التتبع المباشر (GPS Tracking)</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> محملة ({trips.filter((t) => t.Trip_Status === 'In-Transit').length})
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span> فارغة ({trucks.filter((t) => t.Status === 'Available').length})
          </span>
        </div>
      </div>

      {/* Top Filter Overlay Controls */}
      <div className="absolute top-16 right-3 left-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md pointer-events-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({trucks.length})
          </button>
          <button
            onClick={() => setFilterStatus('loaded')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterStatus === 'loaded'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>محملة</span>
          </button>
          <button
            onClick={() => setFilterStatus('empty')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterStatus === 'empty'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>فارغة</span>
          </button>
        </div>

        {/* Project Selector */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-md pointer-events-auto flex items-center gap-2 text-xs">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">جميع المشاريع</option>
            {projects.map((p) => (
              <option key={p.Project_Name} value={p.Project_Name}>
                {p.Project_Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full flex-grow relative" />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md text-xs text-slate-700 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span>محملة في الطريق</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
          <span>فارغة / متاحة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🏗️</span>
          <span>موقع التحميل / الكسارة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🎯</span>
          <span>موقع التفريغ / الردم</span>
        </div>
      </div>
    </div>
  );
};
