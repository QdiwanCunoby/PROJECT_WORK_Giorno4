// Repository in-memory: unico punto che sa DOVE stanno i dati
import { randomUUID } from "node:crypto";
import { CreateCustomerDto, Customer, CustomerStatus, UpdateCustomerDto } from "./customer.types";

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByFiscalCode(fiscalCode: string): Promise<Customer | null>;
  create(dto: CreateCustomerDto): Promise<Customer>;
  update(id: string, dto: UpdateCustomerDto): Promise<Customer | null>;
  delete(id: string): Promise<boolean>;
}

export class CustomerRepository implements ICustomerRepository {
  private customers: Customer[] = [];

  async findAll(): Promise<Customer[]> { return [...this.customers]; }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.find(c => c.id === id) ?? null;
  }

  async findByFiscalCode(fiscalCode: string): Promise<Customer | null> {
    const fc = fiscalCode.toUpperCase();
    return this.customers.find(c => c.fiscalCode === fc) ?? null;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer: Customer = {
      id: randomUUID(), ...dto,
      fiscalCode: dto.fiscalCode.toUpperCase(),
      status: CustomerStatus.ACTIVE,
    };
    this.customers.push(customer);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer | null> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    // Scarta i campi undefined: altrimenti lo spread cancellerebbe i valori esistenti
    const changes = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    this.customers[index] = { ...this.customers[index], ...changes };
    return this.customers[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.customers.splice(index, 1);
    return true;
  }
}
