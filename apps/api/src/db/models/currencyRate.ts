import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export class CurrencyRate extends Model<
  InferAttributes<CurrencyRate>,
  InferCreationAttributes<CurrencyRate>
> {
  declare code: string; // ISO 4217, e.g. "INR"
  declare rateToUsd: string; // DECIMAL comes back as string; 1 unit of `code` in USD
}

export function initCurrencyRate(sequelize: Sequelize): void {
  CurrencyRate.init(
    {
      code: { type: DataTypes.CHAR(3), primaryKey: true },
      rateToUsd: { type: DataTypes.DECIMAL(18, 8), allowNull: false, field: 'rate_to_usd' },
    },
    { sequelize, tableName: 'currency_rates', timestamps: false },
  );
}
