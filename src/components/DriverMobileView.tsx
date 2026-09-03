import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Navigation, MapPin, Scale, Camera, Image, CheckCircle, 
  AlertOctagon, Play, StopCircle, RefreshCw, Fuel, ChevronDown, 
  Clock, ShieldAlert, ArrowRight, UploadCloud, Info
} from 'lucide-react';
import { DriverTruck, Project, TripLog, FuelExpense, GPSLocation } from '../types';

interface DriverMobileViewProps {
  trucks: DriverTruck[];
  projects: Project[];
  trips: TripLog[];
  onStartTrip: (trip: TripLog) => void;
  onUpdateTrip: (trip: TripLog) => void;
  onAddFuelExpense: (expense: FuelExpense) => void;
  activeTrip: TripLog | null;
  selectedTruckPlate: string;
  onSelectTruck: (plate: string) => void;
}

export const DriverMobileView: React.FC<DriverMobileViewProps> = ({
  trucks,
  projects,
  trips,
  onStartTrip,
  onUpdateTrip,
  onAddFuelExpense,
  activeTrip,
  selectedTruckPlate,
  onSelectTruck,
}) => {
  // Current active driver & truck
  const currentTruck = trucks.find(t => t.Plate_Number === selectedTruckPlate) || trucks[0];

  // Forms and active editing states
  const [selectedProjectName, setSelectedProjectName] = useState<string>(
    activeTrip ? activeTrip.Project_Name : (projects[0]?.Project_Name || '')
  );

  // Weight form states
  const [tareWeight, setTareWeight] = useState<string>(
    activeTrip ? String(activeTrip.Tare_Weight_Tons || '') : '14.80'
  );
  const [grossWeight, setGrossWeight] = useState<string>(
    activeTrip ? String(activeTrip.Gross_Weight_Tons || '') : '46.50'
  );
  const [unloadWeight, setUnloadWeight] = useState<string>(
    activeTrip?.Unload_Weight_Tons ? String(activeTrip.Unload_Weight_Tons) : ''
  );
  const [waybillPreview, setWaybillPreview] = useState<string | null>(
    activeTrip?.Waybill_Image || null
  );
  const [tripNotes, setTripNotes] = useState<string>(activeTrip?.Notes || '');

  // GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState<boolean>(activeTrip?.Trip_Status === 'In-Transit');
  const [gpsCoords, setGpsCoords] = useState<GPSLocation | null>(
    activeTrip?.Current_GPS_Location || {
      lat: projects[0]?.Loading_Location.lat || 24.5885,
      lng: projects[0]?.Loading_Location.lng || 46.3325,
      speed: 58,
      heading: 90,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      name: 'موقع التحميل الأولي',
    }
  );
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState<boolean>(false);
  const [showFuelModal, setShowFuelModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize when active trip changes
  useEffect(() => {
    if (activeTrip) {
      setSelectedProjectName(activeTrip.Project_Name);
      setTareWeight(String(activeTrip.Tare_Weight_Tons || ''));
      setGrossWeight(String(activeTrip.Gross_Weight_Tons || ''));
      setUnloadWeight(activeTrip.Unload_Weight_Tons ? String(activeTrip.Unload_Weight_Tons) : '');
      setWaybillPreview(activeTrip.Waybill_Image || null);
      setTripNotes(activeTrip.Notes || '');
      if (activeTrip.Current_GPS_Location) {
        setGpsCoords(activeTrip.Current_GPS_Location);
      }
    }
  }, [activeTrip]);

  // Calculations
  const tareNum = parseFloat(tareWeight) || 0;
  const grossNum = parseFloat(grossWeight) || 0;
  const netWeightCalc = Math.max(0, Math.round((grossNum - tareNum) * 100) / 100);

  const unloadNum = parseFloat(unloadWeight) || 0;
  // Discrepancy is Net - Unload
  const weightDiffCalc = unloadNum > 0 ? Math.round((netWeightCalc - unloadNum) * 100) / 100 : 0;
  const hasDiscrepancy = Math.abs(weightDiffCalc) > 0.4 && unloadNum > 0;

  // Selected project details
  const currentProject = projects.find(p => p.Project_Name === selectedProjectName) || projects[0];

  // Refs for callbacks and latest values to prevent setState-in-render and dependency cycles
  const activeTripRef = useRef<TripLog | null>(activeTrip);
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  const onUpdateTripRef = useRef(onUpdateTrip);
  useEffect(() => {
    onUpdateTripRef.current = onUpdateTrip;
  }, [onUpdateTrip]);

  const currentProjectRef = useRef<Project>(currentProject);
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  const latestGpsCoordsRef = useRef<GPSLocation | null>(gpsCoords);
  useEffect(() => {
    latestGpsCoordsRef.current = gpsCoords;
  }, [gpsCoords]);

  // Cleanup watchPosition on unmount or watchId change
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // GPS Watch Position Toggle
  const toggleGps = () => {
    if (isGpsActive) {
      // Turn off
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsGpsActive(false);
      setIsSimulatingMovement(false);
      setStatusMessage('تم إيقاف تتبع الموقع الجغرافي');
    } else {
      // Turn on
      setIsGpsActive(true);
      setStatusMessage('جاري تفعيل نظام تتبع الموقع الحي GPS...');

      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const loc: GPSLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
              speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 48,
              heading: pos.coords.heading || 45,
              timestamp: new Date().toLocaleTimeString('ar-SA'),
              name: 'موقع مباشر عبر GPS السائق',
            };
            latestGpsCoordsRef.current = loc;
            setGpsCoords(loc);
            if (activeTripRef.current) {
              onUpdateTripRef.current({
                ...activeTripRef.current,
                Current_GPS_Location: loc,
              });
            }
          },
          (err) => {
            console.warn('Geolocation fallback to simulation:', err.message);
            // In case iframe blocks high accuracy or testing locally, start friendly auto-simulator
            setIsSimulatingMovement(true);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        setWatchId(id);
      } else {
        setIsSimulatingMovement(true);
      }
    }
  };

  // Simulated GPS movement loop along project path if active and simulation is true
  useEffect(() => {
    if (!isGpsActive) return;

    const interval = setInterval(() => {
      const proj = currentProjectRef.current;
      if (!proj) return;

      const prev = latestGpsCoordsRef.current || {
        lat: proj.Loading_Location.lat,
        lng: proj.Loading_Location.lng,
        speed: 50,
        heading: 90,
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        name: 'نقطة الانطلاق',
      };

      // Move slightly towards unloading point
      const targetLat = proj.Unloading_Location.lat;
      const targetLng = proj.Unloading_Location.lng;
      const step = 0.003; // small delta for visible movement

      const dLat = (targetLat - prev.lat) * 0.08;
      const dLng = (targetLng - prev.lng) * 0.08;

      const newLat = prev.lat + (dLat || (Math.random() - 0.5) * step);
      const newLng = prev.lng + (dLng || (Math.random() - 0.5) * step);
      const newSpeed = Math.floor(50 + Math.random() * 25);

      const updated: GPSLocation = {
        lat: Math.round(newLat * 10000) / 10000,
        lng: Math.round(newLng * 10000) / 10000,
        speed: newSpeed,
        heading: Math.floor(Math.random() * 360),
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        name: `طريق ${proj.Project_Name.slice(0, 18)}...`,
      };

      latestGpsCoordsRef.current = updated;
      setGpsCoords(updated);

      if (activeTripRef.current) {
        onUpdateTripRef.current({
          ...activeTripRef.current,
          Current_GPS_Location: updated,
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isGpsActive]);

  // Handle Photo / Waybill upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setWaybillPreview(reader.result as string);
        setStatusMessage('تم إرفاق صورة كرت الميزان / البوليصة بنجاح');
      };
      reader.readAsDataURL(file);
    }
  };

  // Start New Trip
  const handleStartNewTrip = () => {
    if (!currentTruck) return;
    const newTripId = `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const startLoc: GPSLocation = gpsCoords || {
      lat: currentProject.Loading_Location.lat,
      lng: currentProject.Loading_Location.lng,
      name: currentProject.Loading_Location.name,
      timestamp: new Date().toISOString(),
      speed: 0,
    };

    const newTrip: TripLog = {
      Trip_ID: newTripId,
      Timestamp: new Date().toISOString(),
      Project_Name: selectedProjectName,
      Plate_Number: currentTruck.Plate_Number,
      Driver_Name: currentTruck.Driver_Name,
      Tare_Weight_Tons: tareNum,
      Gross_Weight_Tons: grossNum,
      Net_Weight_Tons: netWeightCalc,
      Unload_Weight_Tons: 0,
      Weight_Diff_Tons: 0,
      Current_GPS_Location: startLoc,
      Trip_Status: 'In-Transit',
      Waybill_Image: waybillPreview || undefined,
      Notes: tripNotes || 'تم بدء الرحلة من موقع التحميل',
      Start_Time: new Date().toLocaleTimeString('ar-SA'),
    };

    onStartTrip(newTrip);
    setIsGpsActive(true);
    setStatusMessage(`تم تسجيل وبدء الرحلة بنجاح: ${newTripId}`);
  };

  // Complete Trip / Unload
  const handleCompleteTrip = () => {
    if (!activeTrip) return;

    const unloadTons = parseFloat(unloadWeight) || netWeightCalc;
    const diff = Math.round((netWeightCalc - unloadTons) * 100) / 100;
    const status = Math.abs(diff) > 0.4 ? 'Discrepancy' : 'Unloaded';

    const updatedTrip: TripLog = {
      ...activeTrip,
      Tare_Weight_Tons: tareNum,
      Gross_Weight_Tons: grossNum,
      Net_Weight_Tons: netWeightCalc,
      Unload_Weight_Tons: unloadTons,
      Weight_Diff_Tons: diff,
      Trip_Status: status,
      Waybill_Image: waybillPreview || activeTrip.Waybill_Image,
      Notes: tripNotes || (status === 'Discrepancy' ? 'عجز في وزن الميزان يتطلب التدقيق' : 'تم التفريغ بنجاح'),
      End_Time: new Date().toLocaleTimeString('ar-SA'),
    };

    onUpdateTrip(updatedTrip);
    setIsGpsActive(false);
    setStatusMessage(`تم إنهاء وتوثيق الرد (${activeTrip.Trip_ID}) بحالة: ${status === 'Discrepancy' ? 'تنبيه عجز وزن' : 'تم التفريغ'}`);
  };

  // Fuel modal state
  const [fuelLiters, setFuelLiters] = useState('150');
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState('1.15');
  const [fuelOdometer, setFuelOdometer] = useState(String(currentTruck.Last_Odometer_KM || 142000));
  const [fuelStation, setFuelStation] = useState('محطة الدريس / ساسكو');

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const liters = parseFloat(fuelLiters) || 0;
    const cpl = parseFloat(fuelCostPerLiter) || 1.15;
    const total = Math.round(liters * cpl * 100) / 100;

    const expense: FuelExpense = {
      Fuel_ID: `FL-${Date.now().toString().slice(-6)}`,
      Date: new Date().toISOString().split('T')[0],
      Project_Name: selectedProjectName,
      Plate_Number: currentTruck.Plate_Number,
      Liters_Filled: liters,
      Cost_Per_Liter: cpl,
      Total_Cost_SAR: total,
      Odometer_KM: parseFloat(fuelOdometer) || (currentTruck.Last_Odometer_KM || 0),
      Fuel_Station: fuelStation,
    };

    onAddFuelExpense(expense);
    setShowFuelModal(false);
    setStatusMessage(`تم تسجيل تزويد وقود (${liters} لتر - ${total} ريال)`);
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-5 space-y-4">
      {/* Truck & Driver Selector Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-lg shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">الشاحنة المختارة:</span>
                <select
                  value={selectedTruckPlate}
                  onChange={(e) => onSelectTruck(e.target.value)}
                  className="bg-slate-50 text-slate-800 font-bold text-sm px-3 py-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {trucks.map((t) => (
                    <option key={t.Plate_Number} value={t.Plate_Number}>
                      {t.Plate_Number} ({t.Driver_Name})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                السائق: <strong className="text-slate-900">{currentTruck.Driver_Name}</strong> • {currentTruck.Phone_Number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFuelModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition shadow-xs"
            >
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>تسجيل وقود</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-sky-600 hover:text-sky-900 font-bold">✕</button>
        </div>
      )}

      {/* Active Trip Banner or Huge Start Button */}
      {activeTrip && activeTrip.Trip_Status === 'In-Transit' ? (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-300 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white font-bold text-xs px-3.5 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            رد قيد النقل النشط ({activeTrip.Trip_ID})
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                {activeTrip.Project_Name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                بدأت في: {activeTrip.Start_Time || 'منذ قليل'} • اللوحة: {activeTrip.Plate_Number}
              </p>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-2xl border border-emerald-200 text-right shadow-xs">
              <span className="text-[11px] text-slate-500 block font-medium">صافي الحمولة المحملة</span>
              <span className="text-base font-black text-emerald-700">{activeTrip.Net_Weight_Tons} طن</span>
            </div>
          </div>

          {/* Real-time GPS Location Status Box */}
          <div className="mt-3.5 bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              <div>
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>{gpsCoords?.name || 'جاري التقاط الإحداثيات...'}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                  <span>السرعة: <strong className="text-slate-800">{gpsCoords?.speed || 0} كم/س</strong></span>
                  <span>خط العرض: {gpsCoords?.lat.toFixed(4)}</span>
                  <span>خط الطول: {gpsCoords?.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleGps}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                isGpsActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isGpsActive ? (
                <>
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>إيقاف GPS</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>تفعيل GPS</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* BIG START BUTTON FOR NEW TRIP */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="max-w-md mx-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1 text-right">
              اختر المشروع للرد القادم:
            </label>
            <select
              value={selectedProjectName}
              onChange={(e) => setSelectedProjectName(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 font-bold text-sm sm:text-base p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.Project_Name} value={p.Project_Name}>
                  {p.Project_Name} (المسافة: {p.Distance_KM} كم)
                </option>
              ))}
            </select>
          </div>

          <button
            id="start-trip-big-button"
            onClick={handleStartNewTrip}
            className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl sm:text-2xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-7 h-7 fill-white" />
            <span>تسجيل وبدء رد جديد</span>
          </button>
          <p className="text-xs text-slate-500">
            ضغطة واحدة تُفعّل تتبع الـ GPS وترسل إشعار بدء التحميل لإدارة الأسطول
          </p>
        </div>
      )}

      {/* Scale Weights Card (فارغ / مشحون / تفريغ) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">بيانات ميزان البسكول (الأوزان)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">الوحدة: طن متري</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tare Weight */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              الوزن فارغ (Tare)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                placeholder="14.80"
                className="w-full bg-white text-slate-900 font-bold text-lg p-2.5 rounded-xl border border-slate-200 text-left focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400">طن</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">وزن الشاحنة قبل التحميل</span>
          </div>

          {/* Gross Weight */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              الوزن مشحون (Gross)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
                placeholder="46.50"
                className="w-full bg-white text-slate-900 font-bold text-lg p-2.5 rounded-xl border border-slate-200 text-left focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400">طن</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">الوزن الإجمالي مع الحمولة</span>
          </div>

          {/* Net Calculated Weight */}
          <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 text-right">
            <span className="block text-xs font-bold text-sky-800 mb-1">
              صافي الحمولة (Net)
            </span>
            <div className="text-2xl font-black text-sky-900 flex items-baseline justify-end gap-1">
              <span>{netWeightCalc.toFixed(2)}</span>
              <span className="text-xs text-slate-500">طن</span>
            </div>
            <span className="text-[10px] text-sky-700/80 mt-1 block">
              = المشحون ({grossNum}) - الفارغ ({tareNum})
            </span>
          </div>
        </div>

        {/* Unload Weight & Discrepancy (Available when in-transit or completing) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-amber-800">
                وزن التفريغ في موقع الوصول (Unload Weight)
              </label>
              <p className="text-[11px] text-slate-500">
                يُسجل من تذكرة ميزان موقع التفريغ للتحقق من عدم حدوث فقد في الحمولة
              </p>
            </div>
            <div className="w-full sm:w-48 relative">
              <input
                type="number"
                step="0.01"
                value={unloadWeight}
                onChange={(e) => setUnloadWeight(e.target.value)}
                placeholder={netWeightCalc > 0 ? netWeightCalc.toFixed(2) : "31.50"}
                className="w-full bg-white text-amber-800 font-bold text-lg p-2.5 rounded-xl border border-slate-200 text-left focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400">طن</span>
            </div>
          </div>

          {unloadNum > 0 && (
            <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
              hasDiscrepancy 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                {hasDiscrepancy ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {hasDiscrepancy ? 'تنبيه: وجود عجز وزن (Discrepancy)' : 'الأوزان متطابقة ومقبولة'}
                  </div>
                  <div className="text-[11px]">
                    فارق الوزن: <strong className="underline">{weightDiffCalc.toFixed(2)} طن</strong> ({Math.round(weightDiffCalc * 1000)} كجم)
                  </div>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                hasDiscrepancy ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {hasDiscrepancy ? 'عجز > 0.4 طن' : 'مطابق'}
              </span>
            </div>
          )}
        </div>

        {/* Waybill / Scale Ticket Photo Attachment */}
        <div className="border-t border-slate-100 pt-3">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-600" />
            <span>إرفاق صورة بوليصة التحميل / كرت الميزان (Waybill Photo)</span>
          </label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {waybillPreview ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm">
              <img
                src={waybillPreview}
                alt="Waybill Preview"
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold"
                >
                  استبدال الصورة
                </button>
                <button
                  type="button"
                  onClick={() => setWaybillPreview(null)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                >
                  حذف
                </button>
              </div>
              <div className="p-2.5 bg-white border-t border-slate-100 text-[11px] text-slate-700 flex items-center justify-between">
                <span>تم إرفاق صورة البوليصة</span>
                <button
                  type="button"
                  onClick={() => setWaybillPreview(null)}
                  className="text-rose-600 hover:text-rose-800 font-bold"
                >
                  إزالة
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-sky-600 transition bg-slate-50/60 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-xs font-semibold">اضغط لالتقاط صورة كرت الميزان بالكاميرا أو اختيارها من الجهاز</div>
              <span className="text-[10px] text-slate-400">JPG, PNG بحد أقصى 10 ميجابايت</span>
            </button>
          )}
        </div>

        {/* Action Buttons for Active Trip */}
        {activeTrip && activeTrip.Trip_Status === 'In-Transit' && (
          <div className="pt-2 flex gap-3">
            <button
              onClick={handleCompleteTrip}
              className="flex-1 py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              <span>إنهاء الرد وتسجيل التفريغ</span>
            </button>
          </div>
        )}
      </div>

      {/* GPS Location & Live Movement Sharing Widget */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">مشاركة الموقع الحركي (GPS Live Tracking)</h3>
          </div>
          <button
            onClick={toggleGps}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              isGpsActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isGpsActive ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
            <span>{isGpsActive ? 'الموقع مُشارك مباشر' : 'الموقع متوقف'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          عند تفعيل الزر، يقوم التطبيق بإرسال إحداثيات موقع الشاحنة لحظة بلحظة للوحة تحكم الشركة مع رصد السرعة وحالة المسار حتى الوصول لموقع التفريغ.
        </p>

        {gpsCoords && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">السرعة</span>
              <span className="font-black text-slate-900 text-sm">{gpsCoords.speed || 0} كم/س</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">خط العرض</span>
              <span className="font-mono text-slate-800 font-semibold">{gpsCoords.lat.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">خط الطول</span>
              <span className="font-mono text-slate-800 font-semibold">{gpsCoords.lng.toFixed(4)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">آخر تحديث</span>
              <span className="text-emerald-700 font-bold">{gpsCoords.timestamp || 'الآن'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Driver Recent Trips History */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>سجل ردود السائق اليوم ({currentTruck.Driver_Name})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {trips.filter(t => t.Plate_Number === currentTruck.Plate_Number).length} رد مسجل
          </span>
        </div>

        <div className="space-y-2.5">
          {trips
            .filter(t => t.Plate_Number === currentTruck.Plate_Number)
            .slice(0, 4)
            .map((trip) => (
              <div
                key={trip.Trip_ID}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{trip.Trip_ID}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      trip.Trip_Status === 'In-Transit'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : trip.Trip_Status === 'Discrepancy'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {trip.Trip_Status === 'In-Transit' ? 'قيد النقل' : trip.Trip_Status === 'Discrepancy' ? 'عجز وزن' : 'مكتمل'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {trip.Project_Name} • {trip.Start_Time || 'صباحاً'}
                  </p>
                </div>

                <div className="text-left text-xs">
                  <span className="font-bold text-emerald-700 block">{trip.Net_Weight_Tons} طن</span>
                  {trip.Weight_Diff_Tons !== 0 && (
                    <span className="text-[10px] text-rose-600 block font-medium">فارق: {trip.Weight_Diff_Tons} طن</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Fuel Expense Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-600" />
                <span>تسجيل تفويل وقود (ديزل)</span>
              </h3>
              <button
                onClick={() => setShowFuelModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  كمية الديزل (باللتر):
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    السعر للتر (ريال):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelCostPerLiter}
                    onChange={(e) => setFuelCostPerLiter(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    قراءة العداد (كم):
                  </label>
                  <input
                    type="number"
                    value={fuelOdometer}
                    onChange={(e) => setFuelOdometer(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المحطة:
                </label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-amber-800 font-medium">الإجمالي المحسوب:</span>
                <span className="text-base font-black text-amber-900">
                  {((parseFloat(fuelLiters) || 0) * (parseFloat(fuelCostPerLiter) || 1.15)).toFixed(2)} ريال
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition"
                >
                  حفظ الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
