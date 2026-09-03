import React, { useState } from 'react';
import { TripLog, TripStatus } from '../types';
import { 
  Search, Filter, AlertOctagon, CheckCircle2, Navigation, 
  FileText, Image, Download, Eye, ExternalLink, Scale, Clock
} from 'lucide-react';

interface TripsLogTableProps {
  trips: TripLog[];
  onSelectTripOnMap?: (trip: TripLog) => void;
}

export const TripsLogTable: React.FC<TripsLogTableProps> = ({
  trips,
  onSelectTripOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  // Filter logic
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.Trip_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.Plate_Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.Driver_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.Project_Name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || trip.Trip_Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'رقم الرد',
      'التاريخ والوقت',
      'المشروع',
      'رقم اللوحة',
      'اسم السائق',
      'فارغ (طن)',
      'مشحون (طن)',
      'الصافي (طن)',
      'تفريغ (طن)',
      'فارق الوزن (طن)',
      'حالة الرد',
      'ملاحظات'
    ];

    const rows = filteredTrips.map((t) => [
      t.Trip_ID,
      new Date(t.Timestamp).toLocaleString('ar-SA'),
      `"${t.Project_Name}"`,
      t.Plate_Number,
      `"${t.Driver_Name}"`,
      t.Tare_Weight_Tons,
      t.Gross_Weight_Tons,
      t.Net_Weight_Tons,
      t.Unload_Weight_Tons || 0,
      t.Weight_Diff_Tons || 0,
      t.Trip_Status,
      `"${t.Notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Trips_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TripStatus, diff: number) => {
    if (status === 'Discrepancy' || Math.abs(diff) > 0.4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          عجز وزن ({diff} طن)
        </span>
      );
    }
    if (status === 'In-Transit') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Navigation className="w-3 h-3 text-blue-600 animate-pulse" />
          قيد النقل
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        تم التفريغ
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الرد، رقم اللوحة، السائق، أو المشروع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الحالات ({trips.length})</option>
            <option value="In-Transit">قيد النقل (In-Transit)</option>
            <option value="Unloaded">تم التفريغ (Unloaded)</option>
            <option value="Discrepancy">عجز أوزان (Discrepancy)</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رقم الرد</th>
                <th className="p-3.5">المشروع</th>
                <th className="p-3.5">الشاحنة / اللوحة</th>
                <th className="p-3.5">السائق</th>
                <th className="p-3.5">الوزن فارغ (Tare)</th>
                <th className="p-3.5">الوزن مشحون (Gross)</th>
                <th className="p-3.5">الصافي (Net)</th>
                <th className="p-3.5">التفريغ (Unload)</th>
                <th className="p-3.5">فرق الوزن (Diff)</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">البوليصة</th>
                <th className="p-3.5">الموقع / خريطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    لا توجد رحلات مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const isDiscrepant = Math.abs(trip.Weight_Diff_Tons || 0) > 0.4 && (trip.Unload_Weight_Tons || 0) > 0;
                  return (
                    <tr
                      key={trip.Trip_ID}
                      className={`hover:bg-slate-50/80 transition ${
                        isDiscrepant ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Trip ID */}
                      <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {trip.Trip_ID}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(trip.Timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="p-3.5 font-medium text-slate-700 max-w-[140px] truncate" title={trip.Project_Name}>
                        {trip.Project_Name}
                      </td>

                      {/* Plate */}
                      <td className="p-3.5 font-bold text-indigo-700 whitespace-nowrap">
                        {trip.Plate_Number}
                      </td>

                      {/* Driver */}
                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {trip.Driver_Name}
                      </td>

                      {/* Tare */}
                      <td className="p-3.5 font-mono">{trip.Tare_Weight_Tons} طن</td>

                      {/* Gross */}
                      <td className="p-3.5 font-mono font-semibold">{trip.Gross_Weight_Tons} طن</td>

                      {/* Net */}
                      <td className="p-3.5 font-mono font-black text-emerald-600">
                        {trip.Net_Weight_Tons} طن
                      </td>

                      {/* Unload */}
                      <td className="p-3.5 font-mono">
                        {trip.Unload_Weight_Tons ? `${trip.Unload_Weight_Tons} طن` : '-'}
                      </td>

                      {/* Diff */}
                      <td className="p-3.5 font-mono font-bold">
                        {trip.Weight_Diff_Tons !== 0 ? (
                          <span className={isDiscrepant ? 'text-rose-600 font-black' : 'text-slate-600'}>
                            {trip.Weight_Diff_Tons > 0 ? `+${trip.Weight_Diff_Tons}` : trip.Weight_Diff_Tons} طن
                          </span>
                        ) : (
                          <span className="text-slate-400">0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {getStatusBadge(trip.Trip_Status, trip.Weight_Diff_Tons || 0)}
                      </td>

                      {/* Waybill image thumbnail */}
                      <td className="p-3.5">
                        {trip.Waybill_Image ? (
                          <button
                            onClick={() => setActiveImageModal(trip.Waybill_Image || null)}
                            className="relative group w-10 h-10 rounded-xl overflow-hidden border border-slate-200 block shadow-xs"
                            title="عرض صورة بوليصة الميزان"
                          >
                            <img
                              src={trip.Waybill_Image}
                              alt="Waybill"
                              className="w-full h-full object-cover group-hover:scale-110 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">لا يوجد</span>
                        )}
                      </td>

                      {/* GPS Map button */}
                      <td className="p-3.5 whitespace-nowrap">
                        {trip.Current_GPS_Location ? (
                          <button
                            onClick={() => onSelectTripOnMap && onSelectTripOnMap(trip)}
                            className="flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl font-bold transition"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>عرض بالموقع</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waybill Zoom Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-600" />
                <span>صورة بوليصة التحميل / تذكرة ميزان البسكول</span>
              </h3>
              <button
                onClick={() => setActiveImageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden max-h-[70vh] border border-slate-100 p-2">
              <img
                src={activeImageModal}
                alt="Waybill Preview"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
