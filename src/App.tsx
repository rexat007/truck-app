import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DriverMobileView } from './components/DriverMobileView';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  INITIAL_TRUCKS, INITIAL_PROJECTS, INITIAL_TRIPS, 
  INITIAL_PETTY_CASH, INITIAL_FUEL_EXPENSES, INITIAL_MAINTENANCE_EXPENSES 
} from './data/mockData';
import { 
  DriverTruck, Project, TripLog, ProjectPettyCash, 
  FuelExpense, MaintenanceExpense 
} from './types';

export default function App() {
  // Role switcher: 'admin' | 'driver'
  const [currentRole, setCurrentRole] = useState<'admin' | 'driver'>('admin');

  // Core Fleet State
  const [trucks, setTrucks] = useState<DriverTruck[]>(() => {
    const saved = localStorage.getItem('fleet_trucks');
    return saved ? JSON.parse(saved) : INITIAL_TRUCKS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('fleet_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [trips, setTrips] = useState<TripLog[]>(() => {
    const saved = localStorage.getItem('fleet_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [pettyCash, setPettyCash] = useState<ProjectPettyCash[]>(() => {
    const saved = localStorage.getItem('fleet_petty');
    return saved ? JSON.parse(saved) : INITIAL_PETTY_CASH;
  });

  const [fuelExpenses, setFuelExpenses] = useState<FuelExpense[]>(() => {
    const saved = localStorage.getItem('fleet_fuel');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_EXPENSES;
  });

  const [maintenanceExpenses, setMaintenanceExpenses] = useState<MaintenanceExpense[]>(() => {
    const saved = localStorage.getItem('fleet_maint');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_EXPENSES;
  });

  // Selected Truck Plate for driver interface
  const [selectedTruckPlate, setSelectedTruckPlate] = useState<string>(() => {
    return trucks[0]?.Plate_Number || 'أ ب د 4521';
  });

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('fleet_trucks', JSON.stringify(trucks));
  }, [trucks]);

  useEffect(() => {
    localStorage.setItem('fleet_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('fleet_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('fleet_petty', JSON.stringify(pettyCash));
  }, [pettyCash]);

  useEffect(() => {
    localStorage.setItem('fleet_fuel', JSON.stringify(fuelExpenses));
  }, [fuelExpenses]);

  useEffect(() => {
    localStorage.setItem('fleet_maint', JSON.stringify(maintenanceExpenses));
  }, [maintenanceExpenses]);

  // Trip Actions
  const handleStartTrip = (newTrip: TripLog) => {
    setTrips((prev) => [newTrip, ...prev]);
    // update truck status
    setTrucks((prev) =>
      prev.map((t) =>
        t.Plate_Number === newTrip.Plate_Number
          ? { ...t, Status: 'In-Transit', Current_Trip_ID: newTrip.Trip_ID }
          : t
      )
    );
  };

  const handleUpdateTrip = (updatedTrip: TripLog) => {
    setTrips((prev) =>
      prev.map((t) => (t.Trip_ID === updatedTrip.Trip_ID ? updatedTrip : t))
    );

    if (updatedTrip.Trip_Status === 'Unloaded' || updatedTrip.Trip_Status === 'Discrepancy') {
      setTrucks((prev) =>
        prev.map((t) =>
          t.Plate_Number === updatedTrip.Plate_Number
            ? { ...t, Status: 'Available', Current_Trip_ID: null }
            : t
        )
      );
    }
  };

  // Add Fuel
  const handleAddFuelExpense = (expense: FuelExpense) => {
    setFuelExpenses((prev) => [expense, ...prev]);
    // update truck odometer if greater
    if (expense.Odometer_KM) {
      setTrucks((prev) =>
        prev.map((t) =>
          t.Plate_Number === expense.Plate_Number && expense.Odometer_KM > (t.Last_Odometer_KM || 0)
            ? { ...t, Last_Odometer_KM: expense.Odometer_KM }
            : t
        )
      );
    }
  };

  // Add Maintenance
  const handleAddMaintenance = (expense: MaintenanceExpense) => {
    setMaintenanceExpenses((prev) => [expense, ...prev]);
  };

  // Add Petty Cash
  const handleAddPettyCash = (entry: ProjectPettyCash) => {
    setPettyCash((prev) => [entry, ...prev]);
  };

  // Add Truck
  const handleAddTruck = (newTruck: DriverTruck) => {
    setTrucks((prev) => [...prev, newTruck]);
  };

  // Add Project
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [...prev, newProject]);
  };

  // Find active trip for driver view
  const driverActiveTrip = trips.find(
    (t) => t.Plate_Number === selectedTruckPlate && t.Trip_Status === 'In-Transit'
  ) || null;

  // Counts for header badges
  const activeTripsCount = trips.filter((t) => t.Trip_Status === 'In-Transit').length;
  const discrepanciesCount = trips.filter(
    (t) => t.Trip_Status === 'Discrepancy' || Math.abs(t.Weight_Diff_Tons || 0) > 0.4
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col antialiased selection:bg-indigo-500 selection:text-white font-sans" dir="rtl">
      {/* Universal Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeTripsCount={activeTripsCount}
        discrepanciesCount={discrepanciesCount}
        isOnline={isOnline}
      />

      {/* Main Role Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {currentRole === 'driver' ? (
          <div className="max-w-2xl mx-auto">
            <DriverMobileView
              trucks={trucks}
              projects={projects}
              trips={trips}
              onStartTrip={handleStartTrip}
              onUpdateTrip={handleUpdateTrip}
              onAddFuelExpense={handleAddFuelExpense}
              activeTrip={driverActiveTrip}
              selectedTruckPlate={selectedTruckPlate}
              onSelectTruck={setSelectedTruckPlate}
            />
          </div>
        ) : (
          <AdminDashboard
            trucks={trucks}
            projects={projects}
            trips={trips}
            fuelExpenses={fuelExpenses}
            maintenanceExpenses={maintenanceExpenses}
            pettyCash={pettyCash}
            onAddFuelExpense={handleAddFuelExpense}
            onAddMaintenance={handleAddMaintenance}
            onAddPettyCash={handleAddPettyCash}
            onAddTruck={handleAddTruck}
            onAddProject={handleAddProject}
          />
        )}
      </main>

      {/* Bento Footer */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ناقل | TRUCK-TRACK AI © {new Date().getFullYear()}</span>
            <span>•</span>
            <span className="text-indigo-600 font-medium">نظام إدارة أسطول النقل اللوجستي الذكي</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>تحديث البيانات تلقائيًا</span>
            <span>•</span>
            <span>اتصال الـ GPS: مستقر</span>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold border border-indigo-200">
              V2.4.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
