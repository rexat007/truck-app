import React, { useState } from 'react';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Plus, Filter, Calendar, DollarSign, Gauge } from 'lucide-react';
import { DriverTruck, Project, TripLog, FuelExpense } from '../types';

interface FuelReconciliationProps {
  trucks: DriverTruck[];
  projects: Project[];
  trips: TripLog[];
  fuelExpenses: FuelExpense[];
  onAddFuelExpense: (expense: FuelExpense) => void;
}

export const FuelReconciliation: React.FC<FuelReconciliationProps> = ({
  trucks,
  projects,
  trips,
  fuelExpenses,
  onAddFuelExpense,
}) => {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedTruckFilter, setSelectedTruckFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Fuel Form State
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newProject, setNewProject] = useState<string>(projects[0]?.Project_Name || '');
  const [newPlate, setNewPlate] = useState<string>(trucks[0]?.Plate_Number || '');
  const [newLiters, setNewLiters] = useState<string>('200');
  const [newCostPerLiter, setNewCostPerLiter] = useState<string>('1.15');
  const [newOdometer, setNewOdometer] = useState<string>('145000');
  const [newStation, setNewStation] = useState<string>('محطة الدريس المركزية');

  // Filtered lists
  const filteredProjects = selectedProjectFilter === 'all'
    ? projects
    : projects.filter(p => p.Project_Name === selectedProjectFilter);

  // Calculate Reconciliation per Project
  const projectStats = filteredProjects.map((project) => {
    // completed trips in this project
    const projectTrips = trips.filter(
      (t) => t.Project_Name === project.Project_Name && (t.Trip_Status === 'Unloaded' || t.Trip_Status === 'Discrepancy')
    );

    const totalDistanceKM = projectTrips.length * project.Distance_KM;
    // Estimated Liters = Distance * Fuel_Rate
    const estimatedLiters = Math.round(totalDistanceKM * project.Fuel_Rate_L_KM * 10) / 10;
    const avgCostPerLiter = 1.15; // standard diesel in KSA
    const estimatedCostSAR = Math.round(estimatedLiters * avgCostPerLiter * 100) / 100;

    // Actual fuel expenses for this project
    const projectFuelRecords = fuelExpenses.filter(
      (f) => f.Project_Name === project.Project_Name && (selectedTruckFilter === 'all' || f.Plate_Number === selectedTruckFilter)
    );
    const actualLiters = projectFuelRecords.reduce((sum, f) => sum + f.Liters_Filled, 0);
    const actualCostSAR = projectFuelRecords.reduce((sum, f) => sum + f.Total_Cost_SAR, 0);

    // Variance
    const litersVariance = Math.round((actualLiters - estimatedLiters) * 10) / 10;
    const costVariance = Math.round((actualCostSAR - estimatedCostSAR) * 100) / 100;
    const variancePercent = estimatedLiters > 0
      ? Math.round(((actualLiters - estimatedLiters) / estimatedLiters) * 100)
      : 0;

    return {
      project,
      tripsCount: projectTrips.length,
      totalDistanceKM,
      estimatedLiters,
      estimatedCostSAR,
      actualLiters,
      actualCostSAR,
      litersVariance,
      costVariance,
      variancePercent,
      recordsCount: projectFuelRecords.length,
    };
  });

  // Totals
  const totalTrips = projectStats.reduce((sum, p) => sum + p.tripsCount, 0);
  const totalEstimatedLiters = projectStats.reduce((sum, p) => sum + p.estimatedLiters, 0);
  const totalActualLiters = projectStats.reduce((sum, p) => sum + p.actualLiters, 0);
  const totalEstimatedCost = projectStats.reduce((sum, p) => sum + p.estimatedCostSAR, 0);
  const totalActualCost = projectStats.reduce((sum, p) => sum + p.actualCostSAR, 0);
  const netLitersDiff = Math.round((totalActualLiters - totalEstimatedLiters) * 10) / 10;
  const netCostDiff = Math.round((totalActualCost - totalEstimatedCost) * 100) / 100;

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const liters = parseFloat(newLiters) || 0;
    const cpl = parseFloat(newCostPerLiter) || 1.15;
    const total = Math.round(liters * cpl * 100) / 100;

    const expense: FuelExpense = {
      Fuel_ID: `FL-${Date.now().toString().slice(-6)}`,
      Date: newDate,
      Project_Name: newProject,
      Plate_Number: newPlate,
      Liters_Filled: liters,
      Cost_Per_Liter: cpl,
      Total_Cost_SAR: total,
      Odometer_KM: parseFloat(newOdometer) || 0,
      Fuel_Station: newStation,
    };

    onAddFuelExpense(expense);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            <span>مطابقة استهلاك الوقود (Fuel Reconciliation)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مقارنة الوقود التقديري (المسافة المقطوعة × معدل الاستهلاك) مع فواتير الوقود الفعلية المسجلة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">جميع المشاريع</option>
            {projects.map((p) => (
              <option key={p.Project_Name} value={p.Project_Name}>
                {p.Project_Name}
              </option>
            ))}
          </select>

          {/* Add Fuel Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة وقود</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Estimated Fuel */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>الوقود التقديري المطلوب</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalEstimatedLiters.toLocaleString()} <span className="text-sm font-normal text-slate-500">لتر</span>
          </div>
          <div className="text-xs text-indigo-600 font-semibold mt-1">
            القيمة التقديرية: {totalEstimatedCost.toLocaleString()} ريال
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            بناءً على {totalTrips} رد منفذ بمعدل الاستهلاك المعتمد
          </div>
        </div>

        {/* Actual Fuel */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>الوقود الفعلي المنصرف</span>
            <Fuel className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {totalActualLiters.toLocaleString()} <span className="text-sm font-normal text-slate-500">لتر</span>
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1">
            إجمالي التكلفة: {totalActualCost.toLocaleString()} ريال
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            من واقع سندات وفواتير المحطات المسجلة
          </div>
        </div>

        {/* Variance in Liters */}
        <div className={`p-4 rounded-3xl border shadow-sm ${
          netLitersDiff > 0
            ? 'bg-rose-50/60 border-rose-200 text-rose-800'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">فارق الاستهلاك (لتر)</span>
            {netLitersDiff > 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-black">
            {netLitersDiff > 0 ? `+${netLitersDiff.toLocaleString()}` : netLitersDiff.toLocaleString()} <span className="text-sm font-normal">لتر</span>
          </div>
          <div className="text-xs mt-1 font-bold">
            {netLitersDiff > 0 ? 'استهلاك زائد عن المعيار' : 'وفر محقق في الوقود'}
          </div>
          <div className="text-[10px] mt-1 opacity-75">
            نسبة الانحراف: {totalEstimatedLiters > 0 ? Math.round((netLitersDiff / totalEstimatedLiters) * 100) : 0}%
          </div>
        </div>

        {/* Financial Variance in SAR */}
        <div className={`p-4 rounded-3xl border shadow-sm ${
          netCostDiff > 0
            ? 'bg-rose-50/60 border-rose-200 text-rose-800'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">الفارق المالي (ريال)</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black">
            {netCostDiff > 0 ? `+${netCostDiff.toLocaleString()}` : netCostDiff.toLocaleString()} <span className="text-sm font-normal">ريال</span>
          </div>
          <div className="text-xs mt-1 font-bold">
            {netCostDiff > 0 ? 'تكلفة إضافية مستهلكة' : 'وفر مالي محقق'}
          </div>
          <div className="text-[10px] mt-1 opacity-75">
            بمتوسط سعر الديزل 1.15 ريال/لتر
          </div>
        </div>
      </div>

      {/* Comparison Table by Project */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-bold text-slate-800 text-sm">
            جدول مطابقة الوقود حسب المشروع (معادلة: المسافة × معدل الاستهلاك مقابل الفعلي)
          </h3>
          <span className="text-xs font-semibold text-slate-500">سعر اللتر: 1.15 ريال</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">المشروع</th>
                <th className="p-3.5">المسافة / الرد</th>
                <th className="p-3.5">معدل الاستهلاك</th>
                <th className="p-3.5">الردود المنفذة</th>
                <th className="p-3.5">إجمالي المسافة</th>
                <th className="p-3.5">التقديري (لتر)</th>
                <th className="p-3.5">الفعلي (لتر)</th>
                <th className="p-3.5">الفارق (لتر)</th>
                <th className="p-3.5">الفارق المالي</th>
                <th className="p-3.5">الحالة والتقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projectStats.map((item) => (
                <tr key={item.project.Project_Name} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900">{item.project.Project_Name}</td>
                  <td className="p-3.5">{item.project.Distance_KM} كم</td>
                  <td className="p-3.5 font-mono">{item.project.Fuel_Rate_L_KM} لتر/كم</td>
                  <td className="p-3.5 font-bold text-indigo-700">{item.tripsCount} رد</td>
                  <td className="p-3.5">{item.totalDistanceKM} كم</td>
                  <td className="p-3.5 font-semibold text-slate-600">{item.estimatedLiters} لتر</td>
                  <td className="p-3.5 font-bold text-amber-600">{item.actualLiters} لتر</td>
                  <td className="p-3.5 font-bold">
                    <span className={item.litersVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {item.litersVariance > 0 ? `+${item.litersVariance}` : item.litersVariance} لتر
                    </span>
                  </td>
                  <td className="p-3.5 font-bold">
                    <span className={item.costVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {item.costVariance > 0 ? `+${item.costVariance}` : item.costVariance} ر.س
                    </span>
                  </td>
                  <td className="p-3.5">
                    {item.variancePercent > 10 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        هدر وقود ({item.variancePercent}%)
                      </span>
                    ) : item.variancePercent < -5 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle className="w-3 h-3" />
                        وفر وقود ({Math.abs(item.variancePercent)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        ضمن المعدل النمطي
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fuel Expenses Details Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>سجل فواتير الوقود المسجلة (Fuel_Expenses)</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{fuelExpenses.length} فاتورة مسجلة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم السند</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المشروع</th>
                <th className="p-3">رقم اللوحة</th>
                <th className="p-3">الكمية (لتر)</th>
                <th className="p-3">سعر اللتر</th>
                <th className="p-3">الإجمالي (ريال)</th>
                <th className="p-3">قراءة العداد (كم)</th>
                <th className="p-3">محطة الوقود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {fuelExpenses.map((exp) => (
                <tr key={exp.Fuel_ID} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900 font-mono">{exp.Fuel_ID}</td>
                  <td className="p-3 text-slate-500">{exp.Date}</td>
                  <td className="p-3 font-medium">{exp.Project_Name}</td>
                  <td className="p-3 font-bold text-indigo-700">{exp.Plate_Number}</td>
                  <td className="p-3 font-bold text-amber-600">{exp.Liters_Filled} لتر</td>
                  <td className="p-3">{exp.Cost_Per_Liter} ر.س</td>
                  <td className="p-3 font-bold text-slate-900">{exp.Total_Cost_SAR.toFixed(2)} ر.س</td>
                  <td className="p-3 font-mono">{exp.Odometer_KM.toLocaleString()} كم</td>
                  <td className="p-3 text-slate-500">{exp.Fuel_Station || 'غير محدد'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fuel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                <span>إضافة فاتورة وقود جديدة (Fuel Expense)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFuel} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المشروع:</label>
                  <select
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.Project_Name} value={p.Project_Name}>
                        {p.Project_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم اللوحة:</label>
                  <select
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {trucks.map((t) => (
                      <option key={t.Plate_Number} value={t.Plate_Number}>
                        {t.Plate_Number} ({t.Driver_Name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الكمية (باللتر):</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newLiters}
                    onChange={(e) => setNewLiters(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سعر اللتر (ريال):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCostPerLiter}
                    onChange={(e) => setNewCostPerLiter(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">قراءة العداد Odometer (كم):</label>
                  <input
                    type="number"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المحطة أو المورد:</label>
                <input
                  type="text"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-amber-800 font-bold">إجمالي القيمة:</span>
                <span className="text-lg font-black text-amber-600">
                  {((parseFloat(newLiters) || 0) * (parseFloat(newCostPerLiter) || 1.15)).toFixed(2)} ريال
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition"
                >
                  حفظ الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
