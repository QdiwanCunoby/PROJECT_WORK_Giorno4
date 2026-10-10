// Repository in-memory: unico punto che sa DOVE stanno i dati
import { randomUUID } from "node:crypto";
import { Account, AccountStatus, CreateAccountDto, UpdateAccountDto } from "./account.types";

export interface IAccountRepository {
  findAll(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  findByIban(iban: string): Promise<Account | null>;
  create(dto: CreateAccountDto): Promise<Account>;
  update(id: string, dto: UpdateAccountDto): Promise<Account | null>;
  delete(id: string): Promise<boolean>;
}

export class AccountRepository implements IAccountRepository {
  private accounts: Account[] = [];

  async findAll(): Promise<Account[]> { return [...this.accounts]; }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.find(a => a.id === id) ?? null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    return this.accounts.find(a => a.iban === iban) ?? null;
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    const account: Account = {
      id: randomUUID(), ...dto,
      status: AccountStatus.ACTIVE, createdAt: new Date(),
    };
    this.accounts.push(account);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account | null> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return null;
    // Scarta i campi undefined: altrimenti lo spread cancellerebbe i valori esistenti
    const changes = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    this.accounts[index] = { ...this.accounts[index], ...changes };
    return this.accounts[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.accounts.splice(index, 1);
    return true;
  }
}
