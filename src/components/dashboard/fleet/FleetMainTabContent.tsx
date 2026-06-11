import React from 'react';
import { VehicleTable } from './VehicleTable';
import { DriversSection } from './DriversSection';
import { MaintenanceTab } from './MaintenanceTab';
import { AssignmentsTab } from './AssignmentsTab';
import { MileageTab } from './MileageTab';
import { IncidentsTab } from './IncidentsTab';
import { ObligationsTab } from './ObligationsTab';
import { Vehicle, Driver, VehicleDocument, VehicleAssignment, VehicleMaintenance, VehicleMileage, VehicleIncident } from '../../../types';

interface FleetMainTabContentProps {
  activeTab: 'vehicles' | 'drivers' | 'maintenance' | 'assignments' | 'mileage' | 'incidents' | 'obligations';
  vehicles: Vehicle[];
  paginatedVehicles: Vehicle[];
  drivers: Driver[];
  driverSearch: string;
  setDriverSearch: (val: string) => void;
  allDocuments: VehicleDocument[];
  allAssignments: VehicleAssignment[];
  allMaintenance: VehicleMaintenance[];
  allMileageLogs: VehicleMileage[];
  allIncidents: VehicleIncident[];
  allDriverDocuments: any[];
  lang: string;
  t: any;
  isViewer: boolean;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  generateVehicleTitle: (vehicle: Vehicle) => string;
  getVehiclePlate: (id: number) => string;
  safeFormatDate: (date: any, fmt: string) => string;
  
  // Actions
  setSelectedVehicle: (v: Vehicle) => void;
  fetchVehicleDetails: (v: Vehicle) => void;
  setShowDetailModal: (val: boolean) => void;
  setShareVehicle: (v: Vehicle) => void;
  setIsShareModalOpen: (val: boolean) => void;
  setFormData: (val: any) => void;
  setShowAddModal: (val: boolean) => void;
  handleDeleteVehicle: (id: number) => void;
  setDriverFormData: (data: any) => void;
  setShowAddDriverModal: (val: boolean) => void;
  setSelectedDriver: (d: Driver) => void;
  fetchDriverDetails: (d: Driver) => void;
  setShowDriverDetailModal: (val: boolean) => void;
  handleDeleteDriver: (id: number) => void;
  handleEditMaintenance: (m: VehicleMaintenance) => void;
  handleDeleteMaintenance: (id: number) => void;
  handleUpdateAssignment: (id: number, endMileage: number) => void;
  handleDeleteIncident: (id: number) => void;
  handleDeleteDocument: (id: number) => void;
  setAutoContractVehicle: (v: Vehicle) => void;
  setIsAutoContractOpen: (val: boolean) => void;
}

export const FleetMainTabContent: React.FC<FleetMainTabContentProps> = ({
  activeTab,
  vehicles,
  paginatedVehicles,
  drivers,
  driverSearch,
  setDriverSearch,
  allDocuments,
  allAssignments,
  allMaintenance,
  allMileageLogs,
  allIncidents,
  allDriverDocuments,
  lang,
  t,
  isViewer,
  getStatusColor,
  getStatusText,
  generateVehicleTitle,
  getVehiclePlate,
  safeFormatDate,
  
  setSelectedVehicle,
  fetchVehicleDetails,
  setShowDetailModal,
  setShareVehicle,
  setIsShareModalOpen,
  setFormData,
  setShowAddModal,
  handleDeleteVehicle,
  setDriverFormData,
  setShowAddDriverModal,
  setSelectedDriver,
  fetchDriverDetails,
  setShowDriverDetailModal,
  handleDeleteDriver,
  handleEditMaintenance,
  handleDeleteMaintenance,
  handleUpdateAssignment,
  handleDeleteIncident,
  handleDeleteDocument,
  setAutoContractVehicle,
  setIsAutoContractOpen
}) => {
  switch (activeTab) {
    case 'vehicles':
      return (
        <VehicleTable
          vehicles={vehicles}
          paginatedVehicles={paginatedVehicles}
          t={t}
          lang={lang}
          allDocuments={allDocuments}
          allAssignments={allAssignments}
          drivers={drivers}
          allDriverDocuments={allDriverDocuments}
          allMaintenance={allMaintenance}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          generateVehicleTitle={generateVehicleTitle}
          setSelectedVehicle={setSelectedVehicle}
          fetchVehicleDetails={fetchVehicleDetails}
          setShowDetailModal={setShowDetailModal}
          setShareVehicle={setShareVehicle}
          setIsShareModalOpen={setIsShareModalOpen}
          setFormData={setFormData}
          setShowAddModal={setShowAddModal}
          handleDeleteVehicle={handleDeleteVehicle}
          setAutoContractVehicle={setAutoContractVehicle}
          setIsAutoContractOpen={setIsAutoContractOpen}
        />
      );
    case 'drivers':
      return (
        <DriversSection
          drivers={drivers}
          driverSearch={driverSearch}
          setDriverSearch={setDriverSearch}
          lang={lang}
          t={t}
          isViewer={isViewer}
          setShowAddDriverModal={setShowAddDriverModal}
          setSelectedDriver={setSelectedDriver}
          setDriverFormData={setDriverFormData}
          fetchDriverDetails={fetchDriverDetails}
          setShowDriverDetailModal={setShowDriverDetailModal}
          handleDeleteDriver={handleDeleteDriver}
        />
      );
    case 'maintenance':
      return (
        <MaintenanceTab
          maintenance={allMaintenance}
          vehicles={vehicles}
          t={t}
          lang={lang}
          isViewer={isViewer}
          onEdit={handleEditMaintenance}
          safeFormatDate={safeFormatDate}
          getVehiclePlate={getVehiclePlate}
        />
      );
    case 'assignments':
      return (
        <AssignmentsTab
          assignments={allAssignments}
          vehicles={vehicles}
          t={t}
          lang={lang}
          isViewer={isViewer}
          onReturn={(a) => handleUpdateAssignment(a.id, 0)} // Placeholder for returning
          safeFormatDate={safeFormatDate}
          getVehiclePlate={getVehiclePlate}
        />
      );
    case 'mileage':
      return (
        <MileageTab
          mileageLogs={allMileageLogs}
          vehicles={vehicles}
          t={t}
          lang={lang}
          safeFormatDate={safeFormatDate}
          getVehiclePlate={getVehiclePlate}
        />
      );
    case 'incidents':
      return (
        <IncidentsTab
          incidents={allIncidents}
          vehicles={vehicles}
          t={t}
          lang={lang}
          isViewer={isViewer}
          onDelete={handleDeleteIncident}
          safeFormatDate={safeFormatDate}
          getVehiclePlate={getVehiclePlate}
        />
      );
    case 'obligations':
      return (
        <ObligationsTab
          documents={allDocuments}
          vehicles={vehicles}
          t={t}
          lang={lang}
          isViewer={isViewer}
          onDelete={handleDeleteDocument}
          safeFormatDate={safeFormatDate}
          getVehiclePlate={getVehiclePlate}
        />
      );
    default:
      return null;
  }
};
