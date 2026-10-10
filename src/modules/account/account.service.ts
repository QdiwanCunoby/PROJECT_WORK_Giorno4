// Service: regole di business. Non sa nulla di HTTP.
import { Account, AccountStatus, AccountType, CreateAccountDto, UpdateAccountDto } from "./account.types";
import { IAccountRepository } from "./account.repository";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export class AccountService {
  constructor(private readonly repository: IAccountRepository) {}

  async getAllAccounts(): Promise<Account[]> {
    return this.repository.findAll();
  }

  async getAccountById(id: string): Promise<Account> {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundError("Account con id " + id + " non trovato");
    return account;
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    if (!isNonEmptyString(dto.iban)) throw new ValidationError("iban obbligatorio");
    if (!isNonEmptyString(dto.holderName)) throw new ValidationError("holderName obbligatorio");
    if (!isNonEmptyString(dto.customerId)) throw new ValidationError("customerId obbligatorio");
    if (typeof dto.balance !== "number" || Number.isNaN(dto.balance)) {
      throw new ValidationError("balance deve essere un numero");
    }
    if (dto.balance < 0) throw new ValidationError("Saldo iniziale non può essere negativo");
    if (!Object.values(AccountType).includes(dto.accountType)) {
      throw new ValidationError("accountType deve essere uno tra " + Object.values(AccountType).join(", "));
    }

    const existing = await this.repository.findByIban(dto.iban);
    if (existing) throw new ConflictError("IBAN già registrato");
    return this.repository.create(dto);
  }

  async updateAccount(id: string, dto: UpdateAccountDto): Promise<Account> {
    if (dto.holderName !== undefined && !isNonEmptyString(dto.holderName)) {
      throw new ValidationError("holderName non può essere vuoto");
    }
    if (dto.customerId !== undefined && !isNonEmptyString(dto.customerId)) {
      throw new ValidationError("customerId non può essere vuoto");
    }
    if (dto.accountType !== undefined && !Object.values(AccountType).includes(dto.accountType)) {
      throw new ValidationError("accountType deve essere uno tra " + Object.values(AccountType).join(", "));
    }
    if (dto.status !== undefined && !Object.values(AccountStatus).includes(dto.status)) {
      throw new ValidationError("status deve essere uno tra " + Object.values(AccountStatus).join(", "));
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) throw new NotFoundError("Account con id " + id + " non trovato");
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Account con id " + id + " non trovato");
  }
}
