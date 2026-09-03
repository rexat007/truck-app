import React, { useState } from 'react';
import { 
  Wallet, DollarSign, Wrench, Fuel, BarChart3, TrendingDown, 
  AlertTriangle, CheckCircle, Plus, FileText, Calendar, Building2, User
} from 'lucide-react';
import { Project, TripLog, ProjectPettyCash, FuelExpense, MaintenanceExpense, DriverTruck } from '../types';

interface PettyCashReportProps {
  projects: Project[];
  trips: TripLog[];
  pettyCashList: ProjectPettyCash[];
  fuelExpenses: FuelExpense[];
  maintenanceExpenses: MaintenanceExpense[];
  trucks: DriverTruck[];
  onAddPettyCash: (entry: ProjectPettyCash) => void;
  onAddMaintenance: (entry: MaintenanceExpense) => void;
}

export const PettyCashReport: React.FC<PettyCashReportProps> = ({
  projects,
  trips,
  pettyCashList,
  fuelExpenses,
  maintenanceExpenses,
  trucks,
  onAddPettyCash,
  onAddMaintenance,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showPettyModal, setShowPettyModal] = useState<boolean>(false);
  const [showMaintModal, setShowMaintModal] = useState<boolean>(false);

  // New Petty Cash Form State
  const [pcDate, setPcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pcProject, setPcProject] = useState<string>(projects[0]?.Project_Name || '');
  const [pcAmount, setPcAmount] = useState<string>('20000');
  const [pcReceiver, setPcReceiver] = useState<string>('مشرف الموقع الميداني');
  const [pcRef, setPcRef] = useState<string>(`TR-BANK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [pcNotes, setPcNotes] = useState<string>('دفعة عهدة تشغيلية');

  // New Maintenance Form State
  const [maintDate, setMaintDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [maintProject, setMaintProject] = useState<string>(projects[0]?.Project_Name || '');
  const [maintPlate, setMaintPlate] = useState<string>(trucks[0]?.Plate_Number || '');
  const [maintCategory, setMaintCategory] = useState<string>('إطارات');
  const [maintDesc, setMaintDesc] = useState<string>('تبديل كفر دبل وميزانية هواء');
  const [maintCost, setMaintCost] = useState<string>('1200');
  const [maintVendor, setMaintVendor] = useState<string>('مركز الصيانة السريعة');
  const [maintInvoice, setMaintInvoice] = useState<string>(`INV-${Math.floor(10000 + Math.random() * 90000)}`);

  // Filter calculations
  const filteredProjects = selectedProject === 'all'
    ? projects
    : projects.filter(p => p.Project_Name === selectedProject);

  const filterPetty = selectedProject === 'all'
    ? pettyCashList
    : pettyCashList.filter(p => p.Project_Name === selectedProject);

  const filterFuel = selectedProject === 'all'
    ? fuelExpenses
    : fuelExpenses.filter(f => f.Project_Name === selectedProject);

  const filterMaint = selectedProject === 'all'
    ? maintenanceExpenses
    : maintenanceExpenses.filter(m => m.Project_Name === selectedProject);

  const filterTrips = selectedProject === 'all'
    ? trips.filter(t => t.Trip_Status === 'Unloaded' || t.Trip_Status === 'Discrepancy')
    : trips.filter(t => t.Project_Name === selectedProject && (t.Trip_Status === 'Unloaded' || t.Trip_Status === 'Discrepancy'));

  // Aggregations
  const totalPettyCashReceived = filterPetty.reduce((sum, p) => sum + p.Amount_SAR, 0);
  const totalFuelCost = filterFuel.reduce((sum, f) => sum + f.Total_Cost_SAR, 0);
  const totalMaintCost = filterMaint.reduce((sum, m) => sum + m.Cost_SAR, 0);
  const totalExpenses = totalFuelCost + totalMaintCost;
  const remainingPettyCash = totalPettyCashReceived - totalExpenses;
  const burnRatePercent = totalPettyCashReceived > 0 
    ? Math.round((totalExpenses / totalPettyCashReceived) * 100) 
    : 0;

  // Efficiency KPIs
  const totalNetTons = filterTrips.reduce((sum, t) => sum + (t.Net_Weight_Tons || 0), 0);
  const totalTripsCount = filterTrips.length;
  const avgTonsPerTrip = totalTripsCount > 0 ? Math.round((totalNetTons / totalTripsCount) * 100) / 100 : 0;
  const costPerTon = totalNetTons > 0 ? Math.round((totalExpenses / totalNetTons) * 100) / 100 : 0;
  const fuelCostPerTon = totalNetTons > 0 ? Math.round((totalFuelCost / totalNetTons) * 100) / 100 : 0;

  // Save Petty Cash
  const handleSavePettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: ProjectPettyCash = {
      Entry_ID: `PC-${Date.now().toString().slice(-6)}`,
      Date: pcDate,
      Project_Name: pcProject,
      Amount_SAR: parseFloat(pcAmount) || 0,
      Received_By: pcReceiver,
      Reference_No: pcRef,
      Notes: pcNotes,
    };
    onAddPettyCash(entry);
    setShowPettyModal(false);
  };

  // Save Maintenance
  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: MaintenanceExpense = {
      Maint_ID: `MN-${Date.now().toString().slice(-6)}`,
      Date: maintDate,
      Project_Name: maintProject,
      Plate_Number: maintPlate,
      Category: maintCategory,
      Description: maintDesc,
      Cost_SAR: parseFloat(maintCost) || 0,
      Vendor_Name: maintVendor,
      Invoice_No: maintInvoice,
    };
    onAddMaintenance(entry);
    setShowMaintModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>تقرير العهدة النقدية وكفاءة المشروع (Petty Cash & Efficiency)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            حساب العهدة المتبقية تلقائياً ومتابعة تكلفة الطن المنقول ونسب استهلاك المحروقات والصيانة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">جميع المشاريع</option>
            {projects.map((p) => (
              <option key={p.Project_Name} value={p.Project_Name}>
                {p.Project_Name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowPettyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إيداع عهدة</span>
          </button>

          <button
            onClick={() => setShowMaintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Wrench className="w-4 h-4" />
            <span>تسجيل صيانة</span>
          </button>
        </div>
      </div>

      {/* Petty Cash Financial Balance Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Received */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>إجمالي العهدة المستلمة</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalPettyCashReceived.toLocaleString()} <span className="text-xs font-normal text-slate-500">ريال</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            من واقع {filterPetty.length} سندات إيداع وصرف معتمدة
          </div>
        </div>

        {/* Total Fuel */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>منصرفات الوقود (ديزل)</span>
            <Fuel className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {totalFuelCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">ريال</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تمثل {totalExpenses > 0 ? Math.round((totalFuelCost / totalExpenses) * 100) : 0}% من إجمالي المنصرف
          </div>
        </div>

        {/* Total Maintenance */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>منصرفات الصيانة والإصلاح</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {totalMaintCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">ريال</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إطارات، زيوت، هيدروليك، ورش خارجية
          </div>
        </div>

        {/* Remaining Petty Cash Balance */}
        <div className={`p-4 rounded-3xl border shadow-sm ${
          remainingPettyCash < 5000
            ? 'bg-rose-50/60 border-rose-200 text-rose-800'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">الرصيد المتبقي من العهدة</span>
            {remainingPettyCash < 5000 ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-black">
            {remainingPettyCash.toLocaleString()} <span className="text-xs font-normal">ريال</span>
          </div>
          <div className="text-[11px] font-bold mt-1">
            نسبة استهلاك العهدة: {burnRatePercent}%
          </div>
          {remainingPettyCash < 5000 && (
            <div className="text-[10px] text-rose-600 font-bold mt-1">
              تنبيه: يلزم تعزيز العهدة فوراً للموقع
            </div>
          )}
        </div>
      </div>

      {/* Project Transport Efficiency Metrics */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">مؤشرات كفاءة الأداء ونقل الحمولة (Project Efficiency KPIs)</h3>
          </div>
          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">حساب آلي فوري</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">إجمالي الأطنان المنقولة</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{totalNetTons.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">طن صافي</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">الردود المنفذة</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-600">{totalTripsCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">رحلة رد</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">معدل الحمولة / الرد</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600">{avgTonsPerTrip}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">طن / شاحنة</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">تكلفة تشغيل الطن الواحد</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{costPerTon}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">ريال / طن منقول</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 font-medium">
          <span>تكلفة الوقود للطن الواحد: <strong className="text-amber-600 font-bold">{fuelCostPerTon} ر.س/طن</strong></span>
          <span>تكلفة الصيانة للطن الواحد: <strong className="text-indigo-600 font-bold">{totalNetTons > 0 ? (totalMaintCost / totalNetTons).toFixed(2) : 0} ر.س/طن</strong></span>
          <span>الوفورات المحققة من الضبط: <strong className="text-emerald-600 font-bold">~14.5%</strong></span>
        </div>
      </div>

      {/* Tabs / Subtables: Petty Cash Log & Maintenance Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Petty Cash Payments Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>دفعات العهدة المستلمة (Project_Petty_Cash)</span>
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              {totalPettyCashReceived.toLocaleString()} ر.س
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">رقم الإدخال</th>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">المبلغ (ريال)</th>
                  <th className="p-2.5">المستلم</th>
                  <th className="p-2.5">رقم الحوالة/المرجع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filterPetty.map((entry) => (
                  <tr key={entry.Entry_ID} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{entry.Entry_ID}</td>
                    <td className="p-2.5 text-slate-500">{entry.Date}</td>
                    <td className="p-2.5 font-bold text-emerald-600">{entry.Amount_SAR.toLocaleString()} ر.س</td>
                    <td className="p-2.5 font-medium">{entry.Received_By}</td>
                    <td className="p-2.5 font-mono text-slate-500">{entry.Reference_No}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Expenses Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>فواتير الصيانة والإصلاح (Maintenance_Expenses)</span>
            </h4>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
              {totalMaintCost.toLocaleString()} ر.س
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">رقم الفاتورة</th>
                  <th className="p-2.5">اللوحة</th>
                  <th className="p-2.5">التصنيف</th>
                  <th className="p-2.5">الوصف</th>
                  <th className="p-2.5">التكلفة (ريال)</th>
                  <th className="p-2.5">الورشة / المورد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filterMaint.map((m) => (
                  <tr key={m.Maint_ID} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{m.Maint_ID}</td>
                    <td className="p-2.5 font-bold text-indigo-700">{m.Plate_Number}</td>
                    <td className="p-2.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 border border-slate-200">
                        {m.Category}
                      </span>
                    </td>
                    <td className="p-2.5 max-w-[150px] truncate" title={m.Description}>{m.Description}</td>
                    <td className="p-2.5 font-bold text-slate-900">{m.Cost_SAR.toLocaleString()} ر.س</td>
                    <td className="p-2.5 text-slate-500">{m.Vendor_Name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deposit Petty Cash Modal */}
      {showPettyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>إيداع عهدة نقدية جديدة (Petty Cash Deposit)</span>
              </h3>
              <button
                onClick={() => setShowPettyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePettyCash} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">التاريخ:</label>
                <input
                  type="date"
                  required
                  value={pcDate}
                  onChange={(e) => setPcDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المشروع المستفيد:</label>
                <select
                  value={pcProject}
                  onChange={(e) => setPcProject(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.Project_Name} value={p.Project_Name}>
                      {p.Project_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المبلغ المودع (ريال):</label>
                <input
                  type="number"
                  required
                  step="1"
                  value={pcAmount}
                  onChange={(e) => setPcAmount(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المستلم / أمين العهدة:</label>
                <input
                  type="text"
                  required
                  value={pcReceiver}
                  onChange={(e) => setPcReceiver(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الحوالة / السند المرجعي:</label>
                <input
                  type="text"
                  required
                  value={pcRef}
                  onChange={(e) => setPcRef(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات:</label>
                <input
                  type="text"
                  value={pcNotes}
                  onChange={(e) => setPcNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  حفظ وتغذية العهدة
                </button>
                <button
                  type="button"
                  onClick={() => setShowPettyModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <span>تسجيل فاتورة صيانة وإصلاح (Maintenance Expense)</span>
              </h3>
              <button
                onClick={() => setShowMaintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المشروع:</label>
                  <select
                    value={maintProject}
                    onChange={(e) => setMaintProject(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.Project_Name} value={p.Project_Name}>{p.Project_Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم اللوحة:</label>
                  <select
                    value={maintPlate}
                    onChange={(e) => setMaintPlate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {trucks.map((t) => (
                      <option key={t.Plate_Number} value={t.Plate_Number}>{t.Plate_Number} ({t.Driver_Name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التصنيف:</label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="إطارات">إطارات</option>
                    <option value="زيوت وفلاتر">زيوت وفلاتر</option>
                    <option value="ميكانيكا">ميكانيكا</option>
                    <option value="كهرباء">كهرباء</option>
                    <option value="هيدروليك">هيدروليك</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">وصف الصيانة أو العطل:</label>
                <input
                  type="text"
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التكلفة (ريال):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={maintCost}
                    onChange={(e) => setMaintCost(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الفاتورة:</label>
                  <input
                    type="text"
                    value={maintInvoice}
                    onChange={(e) => setMaintInvoice(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الورشة / اسم المورد:</label>
                <input
                  type="text"
                  value={maintVendor}
                  onChange={(e) => setMaintVendor(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                >
                  حفظ الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
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
