// Controller: converte HTTP ↔ business logic. Non contiene logica.
import { Request, Response, NextFunction } from "express";
import { CustomerService } from "./customer.service";
import { ok } from "../../shared/apiResponse";

export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customers = await this.service.getAllCustomers();
      res.status(200).json(ok(customers));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await this.service.getCustomerById(req.params.id);
      res.status(200).json(ok(customer));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Whitelist dei campi: id/status inviati dal client vengono ignorati
      const { fiscalCode, firstName, lastName, email, phone } = req.body ?? {};
      const customer = await this.service.createCustomer({ fiscalCode, firstName, lastName, email, phone });
      res.status(201).json(ok(customer));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, email, phone, status } = req.body ?? {};
      const customer = await this.service.updateCustomer(req.params.id, { firstName, lastName, email, phone, status });
      res.status(200).json(ok(customer));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  };
}
