// Service: regole di business. Non sa nulla di HTTP.
import { CreateCustomerDto, Customer, CustomerStatus, UpdateCustomerDto } from "./customer.types";
import { ICustomerRepository } from "./customer.repository";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

// Codice fiscale persona fisica: 6 lettere, 2 cifre, 1 lettera, 2 cifre, 1 lettera, 3 cifre, 1 lettera
const FISCAL_CODE_REGEX = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CustomerService {
  constructor(private readonly repository: ICustomerRepository) {}

  async getAllCustomers(): Promise<Customer[]> {
    return this.repository.findAll();
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.repository.findById(id);
    if (!customer) throw new NotFoundError("Customer con id " + id + " non trovato");
    return customer;
  }

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    if (!isNonEmptyString(dto.fiscalCode) || !FISCAL_CODE_REGEX.test(dto.fiscalCode)) {
      throw new ValidationError("fiscalCode non valido (16 caratteri, es. RSSMRA80A01H501U)");
    }
    if (!isNonEmptyString(dto.firstName)) throw new ValidationError("firstName obbligatorio");
    if (!isNonEmptyString(dto.lastName)) throw new ValidationError("lastName obbligatorio");
    if (!isNonEmptyString(dto.email) || !EMAIL_REGEX.test(dto.email)) throw new ValidationError("email non valida");
    if (!isNonEmptyString(dto.phone)) throw new ValidationError("phone obbligatorio");

    const existing = await this.repository.findByFiscalCode(dto.fiscalCode);
    if (existing) throw new ConflictError("Codice fiscale già registrato");
    return this.repository.create(dto);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (dto.firstName !== undefined && !isNonEmptyString(dto.firstName)) {
      throw new ValidationError("firstName non può essere vuoto");
    }
    if (dto.lastName !== undefined && !isNonEmptyString(dto.lastName)) {
      throw new ValidationError("lastName non può essere vuoto");
    }
    if (dto.email !== undefined && (!isNonEmptyString(dto.email) || !EMAIL_REGEX.test(dto.email))) {
      throw new ValidationError("email non valida");
    }
    if (dto.phone !== undefined && !isNonEmptyString(dto.phone)) {
      throw new ValidationError("phone non può essere vuoto");
    }
    if (dto.status !== undefined && !Object.values(CustomerStatus).includes(dto.status)) {
      throw new ValidationError("status deve essere uno tra " + Object.values(CustomerStatus).join(", "));
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) throw new NotFoundError("Customer con id " + id + " non trovato");
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Customer con id " + id + " non trovato");
  }
}
