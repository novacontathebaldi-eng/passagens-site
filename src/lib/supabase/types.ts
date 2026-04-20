import type { Database } from "./database.types";

// Convenient type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TourPackage = Database["public"]["Tables"]["tour_packages"]["Row"];
export type Excursion = Database["public"]["Tables"]["excursions"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type PassengerTicket = Database["public"]["Tables"]["passenger_tickets"]["Row"];
export type VehicleLayout = Database["public"]["Tables"]["vehicle_layouts"]["Row"];
export type SavedPassenger = Database["public"]["Tables"]["saved_passengers"]["Row"];
export type GlobalSettings = Database["public"]["Tables"]["global_settings"]["Row"];
export type Promoter = Database["public"]["Tables"]["promoters"]["Row"];
export type Waitlist = Database["public"]["Tables"]["waitlist"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Enums
export type UserRole = Database["public"]["Enums"]["user_role"];
export type ExcursionStatus = Database["public"]["Enums"]["excursion_status"];
export type ReservationStatus = Database["public"]["Enums"]["reservation_status"];

// Joined types for common queries
export type ExcursionWithPackage = Excursion & {
  tour_packages: TourPackage | null;
  vehicle_layouts: VehicleLayout | null;
};

export type ReservationWithDetails = Reservation & {
  excursions: ExcursionWithPackage;
  passenger_tickets: PassengerTicket[];
};

// Driver manifest view
export type DriverManifest = Database["public"]["Views"]["driver_manifest_view"]["Row"];
