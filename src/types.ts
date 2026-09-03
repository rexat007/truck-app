export type TruckType = 
  | 'تريلا قلاب 32م' 
  | 'تريلا قلاب 24م' 
  | 'تريلا سطحة' 
  | 'شاحنة دمبر 18م' 
  | 'صهريج مياه/وقود' 
  | 'دينا نقل';

export type TruckStatus = 'Available' | 'In-Transit' | 'Maintenance' | 'Loading' | 'Unloading';

export interface DriverTruck {
  Plate_Number: string;        // رقم اللوحة (مثال: أ ب ج 1234)
  Truck_Type: TruckType | string; // نوع الشاحنة
  Driver_Name: string;         // اسم السائق
  Phone_Number: string;        // رقم الجوال
  Iqama_ID: string;            // رقم الهوية / الإقامة
  Nationality: string;         // الجنسية
  Status?: TruckStatus;
  Current_Trip_ID?: string | null;
  Last_Odometer_KM?: number;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
  timestamp?: string;
  speed?: number; // km/h
  heading?: number;
  accuracy?: number; // meters
}

export interface Project {
  Project_Name: string;
  Client_Name?: string;
  Loading_Location: GPSLocation;   // موقع التحميل
  Unloading_Location: GPSLocation; // موقع التفريغ
  Distance_KM: number;             // المسافة بالكيلومتر
  Fuel_Rate_L_KM: number;          // معدل استهلاك الوقود (لتر / كم)
  Status?: 'Active' | 'Completed' | 'Paused';
}

export type TripStatus = 'Draft' | 'In-Transit' | 'Unloaded' | 'Discrepancy';

export interface TripLog {
  Trip_ID: string;                 // رقم الرد
  Timestamp: string;               // وقت الإنشاء
  Project_Name: string;            // اسم المشروع
  Plate_Number: string;            // رقم اللوحة
  Driver_Name: string;             // اسم السائق
  Tare_Weight_Tons: number;        // الوزن فارغ
  Gross_Weight_Tons: number;       // الوزن الإجمالي (مشحون)
  Net_Weight_Tons: number;         // صافي الوزن المحمل (Gross - Tare)
  Unload_Weight_Tons: number;      // الوزن عند التفريغ
  Weight_Diff_Tons: number;        // فرق الوزن (Net - Unload)
  Current_GPS_Location: GPSLocation; // الموقع الجغرافي الحالي
  Trip_Status: TripStatus;         // حالة الرحلة
  Waybill_Image?: string;          // صورة بوليصة التحميل / الميزان
  Notes?: string;
  Start_Time?: string;
  End_Time?: string;
  Route_History?: GPSLocation[];
}

export interface ProjectPettyCash {
  Entry_ID: string;
  Date: string;
  Project_Name: string;
  Amount_SAR: number;
  Received_By: string;
  Reference_No: string;
  Notes?: string;
}

export interface FuelExpense {
  Fuel_ID: string;
  Date: string;
  Project_Name: string;
  Plate_Number: string;
  Liters_Filled: number;
  Cost_Per_Liter: number;
  Total_Cost_SAR: number;
  Odometer_KM: number;
  Fuel_Station?: string;
  Receipt_Image?: string;
}

export interface MaintenanceExpense {
  Maint_ID: string;
  Date: string;
  Project_Name: string;
  Plate_Number: string;
  Category: 'إطارات' | 'زيوت وفلاتر' | 'ميكانيكا' | 'كهرباء' | 'هيدروليك' | 'أخرى' | string;
  Description: string;
  Cost_SAR: number;
  Vendor_Name: string;
  Invoice_No?: string;
}

export interface RouteOptimizationResult {
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMins: number;
  fuelEstimatedLiters: number;
  trafficStatus: 'normal' | 'moderate' | 'heavy' | 'unknown';
  recommendedRoute: string;
  source: 'google_script_api' | 'fallback_engine';
  rawApiResponse?: any;
  optimizedWaypoints?: { lat: number; lng: number; name?: string }[];
}
