import { Op, UniqueConstraintError, literal, type Order, type WhereOptions } from 'sequelize';
import { toUsd } from '../domain/currency.js';
import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  FilterOptions,
} from '../domain/employee.js';
import { ConflictError } from '../errors.js';
import { CurrencyRate } from '../db/models/currencyRate.js';
import { Employee as EmployeeModel } from '../db/models/employee.js';
import type { EmployeeRepository } from './employeeRepository.js';

const withRate = [
  { model: CurrencyRate, as: 'currencyRate', required: true, attributes: ['rateToUsd'] },
];

const BATCH_SIZE = 1000;

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// LIKE treats % and _ as wildcards; escape them so a search for "50%" means the literal text.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

function toDomain(row: EmployeeModel): Employee {
  const annualSalary = Number(row.annualSalary); // DECIMAL arrives as string (design decision D3)
  return {
    id: Number(row.id), // BIGINT arrives as string
    fullName: row.fullName,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department,
    countryCode: row.countryCode,
    currencyCode: row.currencyCode,
    annualSalary,
    salaryUsd: toUsd(annualSalary, Number(row.currencyRate?.rateToUsd)),
    hireDate: row.hireDate,
  };
}

function toColumns(input: EmployeeInput) {
  return { ...input, annualSalary: input.annualSalary.toFixed(2) };
}

function buildWhere(query: EmployeeListQuery): WhereOptions {
  const where: Record<string | symbol, unknown> = {};
  if (query.country) where.countryCode = query.country;
  if (query.department) where.department = query.department;
  if (query.jobTitle) where.jobTitle = query.jobTitle;
  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`;
    where[Op.or] = [{ fullName: { [Op.like]: pattern } }, { email: { [Op.like]: pattern } }];
  }
  return where;
}

function buildOrder(query: EmployeeListQuery): Order {
  const direction = query.order === 'desc' ? 'DESC' : 'ASC';
  // USD salary is derived (local amount x rate), so it is sorted by expression, not by a column.
  const primary =
    query.sort === 'salaryUsd'
      ? literal('`Employee`.`annual_salary` * `currencyRate`.`rate_to_usd`')
      : query.sort;
  // `id` as tiebreaker keeps page boundaries stable when many rows share the sort value.
  return [
    [primary, direction],
    ['id', 'ASC'],
  ];
}

export class SequelizeEmployeeRepository implements EmployeeRepository {
  async list(query: EmployeeListQuery) {
    const { rows, count } = await EmployeeModel.findAndCountAll({
      where: buildWhere(query),
      include: withRate,
      order: buildOrder(query),
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: rows.map(toDomain), total: count };
  }

  async findById(id: number) {
    const row = await EmployeeModel.findByPk(id, { include: withRate });
    return row ? toDomain(row) : null;
  }

  async create(input: EmployeeInput) {
    try {
      const created = await EmployeeModel.create(toColumns(input));
      return (await this.findById(Number(created.id))) as Employee;
    } catch (err) {
      throw translateUniqueError(err, input.email);
    }
  }

  async update(id: number, input: EmployeeInput) {
    const row = await EmployeeModel.findByPk(id);
    if (!row) return null;
    try {
      await row.update(toColumns(input));
    } catch (err) {
      throw translateUniqueError(err, input.email);
    }
    return this.findById(id);
  }

  async delete(id: number) {
    return (await EmployeeModel.destroy({ where: { id } })) > 0;
  }

  async findExistingEmails(emails: string[]) {
    const existing = new Set<string>();
    for (const chunk of chunks(emails, BATCH_SIZE)) {
      const rows = await EmployeeModel.findAll({
        where: { email: { [Op.in]: chunk } },
        attributes: ['email'],
      });
      rows.forEach((r) => existing.add(r.email));
    }
    return existing;
  }

  async createMany(inputs: EmployeeInput[]) {
    try {
      await EmployeeModel.sequelize!.transaction(async (transaction) => {
        for (const chunk of chunks(inputs, BATCH_SIZE)) {
          await EmployeeModel.bulkCreate(chunk.map(toColumns), { transaction });
        }
      });
    } catch (err) {
      // Another request may have added one of these emails after we checked; the whole batch rolls back.
      throw translateUniqueError(err, 'in this file');
    }
    return inputs.length;
  }

  async currencyExists(code: string) {
    return (await CurrencyRate.count({ where: { code } })) > 0;
  }

  async currencyCodes() {
    const rows = await CurrencyRate.findAll({ attributes: ['code'], order: [['code', 'ASC']] });
    return rows.map((r) => r.code);
  }

  async filterOptions(): Promise<FilterOptions> {
    const distinct = async (column: 'countryCode' | 'department' | 'jobTitle') => {
      const rows = await EmployeeModel.findAll({
        attributes: [column],
        group: [column],
        order: [[column, 'ASC']],
        raw: true,
      });
      return rows.map((r) => String((r as unknown as Record<string, string>)[column]));
    };
    const [countries, departments, jobTitles] = await Promise.all([
      distinct('countryCode'),
      distinct('department'),
      distinct('jobTitle'),
    ]);
    return { countries, departments, jobTitles };
  }
}

function translateUniqueError(err: unknown, email: string): unknown {
  return err instanceof UniqueConstraintError
    ? new ConflictError(`An employee with email ${email} already exists`)
    : err;
}
