import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import type { CurrencyRate } from './currencyRate.js';

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  declare fullName: string;
  declare email: string;
  declare jobTitle: string;
  declare department: string;
  declare countryCode: string; // ISO 3166-1 alpha-2
  declare currencyCode: string; // ISO 4217
  declare annualSalary: string; // DECIMAL(14,2) arrives as string; mapped to number in the repository
  declare hireDate: string; // DATEONLY -> "YYYY-MM-DD"
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare currencyRate?: NonAttribute<CurrencyRate>; // present when the query includes the join
}

export function initEmployee(sequelize: Sequelize): void {
  Employee.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false, field: 'full_name' },
      email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
      jobTitle: { type: DataTypes.STRING(100), allowNull: false, field: 'job_title' },
      department: { type: DataTypes.STRING(100), allowNull: false },
      countryCode: { type: DataTypes.CHAR(2), allowNull: false, field: 'country_code' },
      currencyCode: { type: DataTypes.CHAR(3), allowNull: false, field: 'currency_code' },
      annualSalary: { type: DataTypes.DECIMAL(14, 2), allowNull: false, field: 'annual_salary' },
      hireDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'hire_date' },
      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    },
    { sequelize, tableName: 'employees', timestamps: true },
  );
}
