import React, { useState } from 'react';
import { DriverTruck, Project, TruckType } from '../types';
import { Truck, Briefcase, Plus, Phone, CreditCard, Flag, MapPin, Gauge, Edit3, Check } from 'lucide-react';

interface TrucksProjectsManagerProps {
  trucks: DriverTruck[];
  projects: Project[];
  onAddTruck: (truck: DriverTruck) => void;
  onAddProject: (project: Project) => void;
}

export const TrucksProjectsManager: React.FC<TrucksProjectsManagerProps> = ({
  trucks,
  projects,
  onAddTruck,
  onAddProject,
}) => {
  const [activeTab, setActiveTab] = useState<'trucks' | 'projects'>('trucks');
  const [showTruckModal, setShowTruckModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  // New Truck Form State
  const [plateNumber, setPlateNumber] = useState('');
  const [truckType, setTruckType] = useState<TruckType>('تريلا قلاب 32م');
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+9665');
  const [iqamaId, setIqamaId] = useState('');
  const [nationality, setNationality] = useState('سعودي');

  // New Project Form State
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [loadName, setLoadName] = useState('موقع الكسارة / التحميل');
  const [loadLat, setLoadLat] = useState('24.5885');
  const [loadLng, setLoadLng] = useState('46.3325');
  const [unloadName, setUnloadName] = useState('موقع التفريغ / الردم');
  const [unloadLat, setUnloadLat] = useState('24.6210');
  const [unloadLng, setUnloadLng] = useState('46.4550');
  const [distanceKm, setDistanceKm] = useState('32.0');
  const [fuelRate, setFuelRate] = useState('0.38');

  const handleSaveTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const newTruck: DriverTruck = {
      Plate_Number: plateNumber,
      Truck_Type: truckType,
      Driver_Name: driverName,
      Phone_Number: phoneNumber,
      Iqama_ID: iqamaId,
      Nationality: nationality,
      Status: 'Available',
      Last_Odometer_KM: 120000,
    };
    onAddTruck(newTruck);
    setShowTruckModal(false);
    // Reset
    setPlateNumber('');
    setDriverName('');
    setIqamaId('');
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProj: Project = {
      Project_Name: projectName,
      Client_Name: clientName,
      Loading_Location: {
        lat: parseFloat(loadLat) || 24.58,
        lng: parseFloat(loadLng) || 46.33,
        name: loadName,
      },
      Unloading_Location: {
        lat: parseFloat(unloadLat) || 24.62,
        lng: parseFloat(unloadLng) || 46.45,
        name: unloadName,
      },
      Distance_KM: parseFloat(distanceKm) || 30,
      Fuel_Rate_L_KM: parseFloat(fuelRate) || 0.38,
      Status: 'Active',
    };
    onAddProject(newProj);
    setShowProjectModal(false);
    setProjectName('');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('trucks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'trucks'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>الشاحنات والسائقون ({trucks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'projects'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>المشاريع ومسارات الرد ({projects.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'trucks' ? (
            <button
              onClick={() => setShowTruckModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شاحنة وسائق</span>
            </button>
          ) : (
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشروع جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Trucks & Drivers */}
      {activeTab === 'trucks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => (
            <div
              key={truck.Plate_Number}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">رقم اللوحة</span>
                  <h3 className="text-base font-black text-slate-900 font-mono">{truck.Plate_Number}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  truck.Status === 'In-Transit'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : truck.Status === 'Maintenance'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {truck.Status === 'In-Transit' ? 'في رد نشط' : truck.Status === 'Maintenance' ? 'صيانة' : 'جاهزة ومتاحة'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">نوع الشاحنة:</span>
                  <span className="font-bold text-slate-800">{truck.Truck_Type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">اسم السائق:</span>
                  <span className="font-bold text-slate-900">{truck.Driver_Name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم الجوال:</span>
                  <span className="font-mono font-bold text-sky-700" style={{ direction: 'ltr' }}>{truck.Phone_Number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم الإقامة/الهوية:</span>
                  <span className="font-mono text-slate-700">{truck.Iqama_ID}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">الجنسية:</span>
                  <span className="text-slate-700 font-medium">{truck.Nationality}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Projects */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.Project_Name}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{proj.Project_Name}</h3>
                  <span className="text-xs text-sky-600 font-medium">{proj.Client_Name || 'عميل معتمد'}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {proj.Distance_KM} كم
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">موقع التحميل (Loading):</span>
                    <span className="text-slate-800 font-semibold">{proj.Loading_Location.name || 'موقع الكسارة'}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Lat: {proj.Loading_Location.lat.toFixed(4)}, Lng: {proj.Loading_Location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 border-t border-slate-200/60 pt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">موقع التفريغ (Unloading):</span>
                    <span className="text-slate-800 font-semibold">{proj.Unloading_Location.name || 'موقع الردم'}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Lat: {proj.Unloading_Location.lat.toFixed(4)}, Lng: {proj.Unloading_Location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                  <span className="text-slate-500 font-medium">معدل استهلاك الوقود:</span>
                  <span className="font-bold text-amber-600 font-mono">{proj.Fuel_Rate_L_KM} لتر/كم</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Truck Modal */}
      {showTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <span>إضافة شاحنة وسائق (Drivers_Trucks)</span>
              </h3>
              <button
                onClick={() => setShowTruckModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTruck} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم اللوحة (Plate_Number):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ ب ج 1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الشاحنة (Truck_Type):</label>
                <select
                  value={truckType}
                  onChange={(e) => setTruckType(e.target.value as TruckType)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="تريلا قلاب 32م">تريلا قلاب 32م</option>
                  <option value="تريلا قلاب 24م">تريلا قلاب 24م</option>
                  <option value="تريلا سطحة">تريلا سطحة</option>
                  <option value="شاحنة دمبر 18م">شاحنة دمبر 18م</option>
                  <option value="صهريج مياه/وقود">صهريج مياه/وقود</option>
                  <option value="دينا نقل">دينا نقل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم السائق (Driver_Name):</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الجوال:</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الإقامة / الهوية:</label>
                  <input
                    type="text"
                    required
                    value={iqamaId}
                    onChange={(e) => setIqamaId(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الجنسية:</label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition"
                >
                  حفظ الشاحنة والسائق
                </button>
                <button
                  type="button"
                  onClick={() => setShowTruckModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <span>إضافة مشروع جديد (Projects)</span>
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المشروع (Project_Name):</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العميل / الجهة المالكة:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Loading Location */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-amber-700 block">موقع التحميل (Loading_Location):</span>
                <input
                  type="text"
                  placeholder="اسم موقع التحميل (مثال: كسارة القدية)"
                  value={loadName}
                  onChange={(e) => setLoadName(e.target.value)}
                  className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat (مثال: 24.5885)"
                    value={loadLat}
                    onChange={(e) => setLoadLat(e.target.value)}
                    className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lng (مثال: 46.3325)"
                    value={loadLng}
                    onChange={(e) => setLoadLng(e.target.value)}
                    className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Unloading Location */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-700 block">موقع التفريغ (Unloading_Location):</span>
                <input
                  type="text"
                  placeholder="اسم موقع التفريغ (مثال: ميدان الردم)"
                  value={unloadName}
                  onChange={(e) => setUnloadName(e.target.value)}
                  className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat (مثال: 24.6210)"
                    value={unloadLat}
                    onChange={(e) => setUnloadLat(e.target.value)}
                    className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lng (مثال: 46.4550)"
                    value={unloadLng}
                    onChange={(e) => setUnloadLng(e.target.value)}
                    className="w-full bg-white text-slate-800 p-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Distance & Fuel Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المسافة (Distance_KM):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">معدل الوقود (Fuel_Rate_L_KM):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelRate}
                    onChange={(e) => setFuelRate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  حفظ المشروع
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
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
