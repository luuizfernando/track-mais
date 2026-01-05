// --- Reports Page ---
export type ApiDailyReport = {
  id: number;
  invoiceNumber: string | number;
  customerCode: number | string;
  products: Array<{
    code: number | string;
    quantity: number;
    description?: string;
    sifOrSisbi?: string;
    productTemperature?: number;
    productionDate?: string;
  }>;
  shipmentDate: string;
  productionDate?: string;
  fillingDate?: string;
  userId: number;
  deliverVehicle?: string | null;
  driver?: string;
  hasGoodSanitaryCondition: boolean;
  productTemperature: number;
};

export type ApiCustomer = {
  code: number;
  legal_name: string | null;
  state: string | null;
};

export type ApiProduct = {
  code: number | string;
  description: string | null;
};

export type ApiUser = {
  id: number;
  name: string;
  username: string;
};

export type ApiMonthlyReport = {
  id: number;
  quantity: string | number;
  destination: string;
  temperature: string | number;
  deliverer: string;
  productionDate: string;
  shipmentDate: string;
  productId: number;
  customersId: number;
};

export type ReportRow = {
  reportId: number;
  invoiceNumber: string;
  customerCode?: number;
  clientName: string;
  destination: string;
  userId: number;
  userName?: string;
  deliverVehicle?: string | null;
  driver?: string;
  hasGoodSanitaryCondition: boolean;
  productTemperature: number;
  fillingDate: string;
  fillingDateIso: string;
  products: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    productionDate: string;
    productTemperature?: number;
    sifOrSisbi?: string;
  }>;
};