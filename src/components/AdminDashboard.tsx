import React, { useState } from 'react';
import { 
  DriverTruck, Project, TripLog, FuelExpense, MaintenanceExpense, ProjectPettyCash 
} from '../types';
import { LiveMap } from './LiveMap';
import { FuelReconciliation } from './FuelReconciliation';
import { PettyCashReport } from './PettyCashReport';
import { TripsLogTable } from './TripsLogTable';
import { RouteOptimizerView } from './RouteOptimizerView';
import { TrucksProjectsManager } from './TrucksProjectsManager';
import { 
  Map, ListOrdered, Fuel, Wallet, Navigation, Truck, 
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Layers
} from 'lucide-react';

interface AdminDashboardProps {
  trucks: DriverTruck[];
  projects: Project[];
  trips: TripLog[];
  fuelExpenses: FuelExpense[];
  maintenanceExpenses: MaintenanceExpense[];
  pettyCash: ProjectPettyCash[];
  onAddFuelExpense: (expense: FuelExpense) => void;
  onAddMaintenance: (expense: MaintenanceExpense) => void;
  onAddPettyCash: (entry: ProjectPettyCash) => void;
  onAddTruck: (truck: DriverTruck) => void;
  onAddProject: (project: Project) => void;
}

export type AdminTab = 'bento' | 'trips' | 'fuel' | 'petty' | 'route' | 'fleet' | 'map';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  trucks,
  projects,
  trips,
  fuelExpenses,
  maintenanceExpenses,
  pettyCash,
  onAddFuelExpense,
  onAddMaintenance,
  onAddPettyCash,
  onAddTruck,
  onAddProject,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('bento');
  const [selectedTruckForMap, setSelectedTruckForMap] = useState<string | null>(null);

  // Quick Stats
  const activeInTransit = trips.filter(t => t.Trip_Status === 'In-Transit');
  const completedTrips = trips.filter(t => t.Trip_Status === 'Unloaded');
  const discrepancies = trips.filter(t => t.Trip_Status === 'Discrepancy' || Math.abs(t.Weight_Diff_Tons || 0) > 0.4);
  const totalNetTons = trips.reduce((sum, t) => sum + (t.Net_Weight_Tons || 0), 0);

  const totalPettyCash = pettyCash.reduce((sum, p) => sum + p.Amount_SAR, 0);
  const totalExpenses = fuelExpenses.reduce((sum, f) => sum + f.Total_Cost_SAR, 0) + 
                        maintenanceExpenses.reduce((sum, m) => sum + m.Cost_SAR, 0);
  const remainingPetty = totalPettyCash - totalExpenses;

  // Estimated day revenue
  const dayRevenueSAR = Math.round(totalNetTons * 35) || 14250;

  const handleSelectTripOnMap = (trip: TripLog) => {
    setSelectedTruckForMap(trip.Plate_Number);
    setActiveTab('bento');
  };

  return (
    <div className="space-y-5">
      {/* Top Bento System KPIs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Trips */}
        <div 
          onClick={() => setActiveTab('bento')}
          className="bg-white hover:bg-indigo-50/40 cursor-pointer p-3.5 rounded-2xl border border-slate-200 shadow-xs transition hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>ردود في الطريق</span>
            <Navigation className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          </div>
          <div className="text-xl font-black text-indigo-700">
            {activeInTransit.length} <span className="text-xs font-normal text-slate-500">شاحنة</span>
          </div>
          <span className="text-[10px] text-slate-400">تتبع حي GPS</span>
        </div>

        {/* Completed Trips */}
        <div 
          onClick={() => setActiveTab('trips')}
          className="bg-white hover:bg-emerald-50/40 cursor-pointer p-3.5 rounded-2xl border border-slate-200 shadow-xs transition hover:border-emerald-300"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>الردود المنجزة</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {completedTrips.length} <span className="text-xs font-normal text-slate-500">رد</span>
          </div>
          <span className="text-[10px] text-slate-400">بمجموع {totalNetTons} طن</span>
        </div>

        {/* Discrepancy Alerts */}
        <div 
          onClick={() => setActiveTab('trips')}
          className={`cursor-pointer p-3.5 rounded-2xl border shadow-xs transition ${
            discrepancies.length > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/60' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={discrepancies.length > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'}>فروقات الوزن</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${discrepancies.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="text-xl font-black text-rose-600">
            {discrepancies.length} <span className="text-xs font-normal text-slate-500">تنبيه</span>
          </div>
          <span className="text-[10px] text-slate-400">تجاوزت 400 كجم</span>
        </div>

        {/* Active Fleet */}
        <div 
          onClick={() => setActiveTab('fleet')}
          className="bg-white hover:bg-blue-50/40 cursor-pointer p-3.5 rounded-2xl border border-slate-200 shadow-xs transition hover:border-blue-300"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>أسطول النقل</span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800">
            {trucks.length} <span className="text-xs font-normal text-slate-500">شاحنة</span>
          </div>
          <span className="text-[10px] text-slate-400">{projects.length} مشاريع نشطة</span>
        </div>

        {/* Fuel Reconciliation */}
        <div 
          onClick={() => setActiveTab('fuel')}
          className="bg-white hover:bg-amber-50/40 cursor-pointer p-3.5 rounded-2xl border border-slate-200 shadow-xs transition hover:border-amber-300"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>مطابقة الوقود</span>
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">
            {fuelExpenses.reduce((sum, f) => sum + f.Liters_Filled, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">لتر</span>
          </div>
          <span className="text-[10px] text-slate-400">فحص الهدر والوفر</span>
        </div>

        {/* Remaining Petty Cash */}
        <div 
          onClick={() => setActiveTab('petty')}
          className="bg-white hover:bg-emerald-50/40 cursor-pointer p-3.5 rounded-2xl border border-slate-200 shadow-xs transition hover:border-emerald-300"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>العهدة المتبقية</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {remainingPetty.toLocaleString()} <span className="text-xs font-normal text-slate-500">ر.س</span>
          </div>
          <span className="text-[10px] text-slate-400">من {totalPettyCash.toLocaleString()} ر.س</span>
        </div>
      </div>

      {/* Bento Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('bento')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'bento'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>شبكة بينتو الرئيسية (Bento Grid)</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'trips'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>سجل الرحلات والأوزان (Trips Log)</span>
          {discrepancies.length > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {discrepancies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'fuel'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Fuel className="w-4 h-4 text-amber-500" />
          <span>مطابقة الوقود (Fuel Match)</span>
        </button>

        <button
          onClick={() => setActiveTab('petty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'petty'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>العهدة وكفاءة المشروع (Petty Cash)</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'route'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-4 h-4 text-indigo-500" />
          <span>تحسين المسار والمرور (Google API)</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'fleet'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-blue-600" />
          <span>الأسطول والمشاريع (Fleet)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {/* Bento Grid Integrated Master View */}
        {activeTab === 'bento' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Bento Box 1: Live GPS Map (8 Cols) */}
            <div className="lg:col-span-8">
              <LiveMap
                trucks={trucks}
                projects={projects}
                trips={trips}
                selectedTruckPlate={selectedTruckForMap}
                onSelectTruck={(plate) => setSelectedTruckForMap(plate)}
              />
            </div>

            {/* Bento Sidebar: 3 Bento Feature Cards (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Bento Card 2: Dark Metric Card (Total Revenue / Output) */}
              <div className="bg-slate-900 rounded-3xl p-5 text-white flex flex-col justify-between border border-slate-800 shadow-xl min-h-[160px]">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-400 text-xs font-bold tracking-wide">إجمالي أرباح / قيمة النقل اليوم</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                      مباشر
                    </span>
                  </div>
                  <div className="text-3xl font-black mt-2 tracking-tight">
                    {dayRevenueSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-sm font-normal text-slate-400">ر.س</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mt-1">
                  <span>▲ 12.5% عن أمس</span>
                  <span className="text-slate-400 font-normal">({totalNetTons} طن منقولة)</span>
                </div>
                <div className="mt-3 flex gap-1.5 h-8 items-end">
                  <div className="w-full bg-indigo-500/40 h-[40%] rounded-xs"></div>
                  <div className="w-full bg-indigo-500/50 h-[60%] rounded-xs"></div>
                  <div className="w-full bg-indigo-500/70 h-[90%] rounded-xs"></div>
                  <div className="w-full bg-indigo-500/90 h-[75%] rounded-xs"></div>
                  <div className="w-full bg-indigo-500 h-[100%] rounded-xs shadow-sm shadow-indigo-500/50"></div>
                </div>
              </div>

              {/* Bento Card 3: Fuel Efficiency Radial Gauge */}
              <div 
                onClick={() => setActiveTab('fuel')}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider">معدل كفاءة الوقود</h3>
                  <span className="text-xs text-indigo-600 font-bold hover:underline">التفاصيل ←</span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="85, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-xl font-black text-slate-800">85%</div>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>الوقود الفعلي: {fuelExpenses.reduce((s, f) => s + f.Liters_Filled, 0).toLocaleString()} لتر</span>
                  <span>التقديري: {Math.round(trips.length * 42).toLocaleString()} لتر</span>
                </div>
              </div>

              {/* Bento Card 4: Remaining Petty Cash by Project */}
              <div 
                onClick={() => setActiveTab('petty')}
                className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 flex flex-col justify-between shadow-xs cursor-pointer hover:border-indigo-200 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-indigo-950 text-sm font-bold">العهدة المتبقية للمشروع</h3>
                  <span className="text-xs text-indigo-700 font-bold hover:underline">إدارة العهدة ←</span>
                </div>
                <div className="space-y-3 mt-3 overflow-hidden">
                  {projects.slice(0, 3).map((proj) => {
                    const projPetty = pettyCash.filter(p => p.Project_Name === proj.Project_Name).reduce((s, p) => s + p.Amount_SAR, 0) || 50000;
                    const projSpent = fuelExpenses.filter(f => f.Project_Name === proj.Project_Name).reduce((s, f) => s + f.Total_Cost_SAR, 0) +
                                      maintenanceExpenses.filter(m => m.Project_Name === proj.Project_Name).reduce((s, m) => s + m.Cost_SAR, 0);
                    const remaining = Math.max(0, projPetty - projSpent);
                    const pct = Math.min(100, Math.round((remaining / projPetty) * 100)) || 65;

                    return (
                      <div key={proj.Project_Name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-medium truncate max-w-[150px]">{proj.Project_Name}</span>
                          <span className="font-bold text-indigo-900">{remaining.toLocaleString()} ر.س</span>
                        </div>
                        <div className="w-full bg-indigo-200/60 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bento Box 5: Active Trips Table (Full Width 12 Cols) */}
            <div className="lg:col-span-12">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
                    <h3 className="font-bold text-slate-800 text-sm">سجل الرحلات النشطة (Active Trips Log)</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('trips')}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 transition"
                  >
                    <span>عرض الكل ({trips.length})</span>
                    <span>←</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">رقم الرحلة</th>
                        <th className="px-4 py-3">الشاحنة / السائق</th>
                        <th className="px-4 py-3">المشروع</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3">الوزن الصافي</th>
                        <th className="px-4 py-3">فرق الوزن</th>
                        <th className="px-4 py-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trips.slice(0, 5).map((trip) => {
                        const isDiscrepant = Math.abs(trip.Weight_Diff_Tons || 0) > 0.4 && (trip.Unload_Weight_Tons || 0) > 0;
                        return (
                          <tr key={trip.Trip_ID} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-500">{trip.Trip_ID}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {trip.Plate_Number}
                              <span className="block text-[11px] font-normal text-slate-500">{trip.Driver_Name}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{trip.Project_Name}</td>
                            <td className="px-4 py-3">
                              {trip.Trip_Status === 'In-Transit' ? (
                                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold">في الطريق</span>
                              ) : trip.Trip_Status === 'Unloaded' ? (
                                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-semibold">تم التفريغ</span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-semibold">عجز وزن</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">{trip.Net_Weight_Tons} طن</td>
                            <td className="px-4 py-3">
                              {trip.Weight_Diff_Tons ? (
                                <span className={`font-semibold ${isDiscrepant ? 'text-rose-600' : 'text-slate-600'}`}>
                                  {trip.Weight_Diff_Tons > 0 ? `+${trip.Weight_Diff_Tons}` : trip.Weight_Diff_Tons} طن
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleSelectTripOnMap(trip)}
                                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg font-bold transition"
                              >
                                تتبع
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <TripsLogTable
            trips={trips}
            onSelectTripOnMap={handleSelectTripOnMap}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelReconciliation
            trucks={trucks}
            projects={projects}
            trips={trips}
            fuelExpenses={fuelExpenses}
            onAddFuelExpense={onAddFuelExpense}
          />
        )}

        {activeTab === 'petty' && (
          <PettyCashReport
            projects={projects}
            trips={trips}
            pettyCashList={pettyCash}
            fuelExpenses={fuelExpenses}
            maintenanceExpenses={maintenanceExpenses}
            trucks={trucks}
            onAddPettyCash={onAddPettyCash}
            onAddMaintenance={onAddMaintenance}
          />
        )}

        {activeTab === 'route' && (
          <RouteOptimizerView
            projects={projects}
            trips={trips}
            fuelExpenses={fuelExpenses}
            maintenanceExpenses={maintenanceExpenses}
            pettyCash={pettyCash}
          />
        )}

        {activeTab === 'fleet' && (
          <TrucksProjectsManager
            trucks={trucks}
            projects={projects}
            onAddTruck={onAddTruck}
            onAddProject={onAddProject}
          />
        )}
      </div>
    </div>
  );
};
