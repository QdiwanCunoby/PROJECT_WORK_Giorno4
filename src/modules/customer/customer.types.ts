export type UUID = string;

export enum CustomerStatus { ACTIVE = "ACTIVE", INACTIVE = "INACTIVE" }

export interface Customer {
  id: UUID;
  fiscalCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
}

export interface CreateCustomerDto {
  fiscalCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Campi modificabili via PUT (id e fiscalCode sono immutabili)
export type UpdateCustomerDto = Partial<Pick<Customer, "firstName" | "lastName" | "email" | "phone" | "status">>;
