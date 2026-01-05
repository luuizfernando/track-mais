import { DailyShipmentReport } from "@prisma/client";

export class Vehicle {
  private _model: string;
  private _plate: string;
  private _category: string;
  private _brand: string;
  private _dailyReports: DailyShipmentReport[];

  constructor(
    model: string,
    plate: string,
    category: string,
    brand: string,
    dailyReports: DailyShipmentReport[],
  ) {
    this._model = model;
    this._plate = plate;
    this._category = category;
    this._brand = brand;
    this._dailyReports = dailyReports;
  }

  getModel() {
    return this._model;
  }

  getPlate() {
    return this._plate;
  }

  getCategory() {
    return this._category;
  }

  getBrand() {
    return this._brand;
  }

  getDailyReports() {
    return this._dailyReports;
  }
}
