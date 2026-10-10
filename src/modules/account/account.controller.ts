// Controller: converte HTTP ↔ business logic. Non contiene logica.
import { Request, Response, NextFunction } from "express";
import { AccountService } from "./account.service";
import { ok } from "../../shared/apiResponse";

export class AccountController {
  constructor(private readonly service: AccountService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accounts = await this.service.getAllAccounts();
      res.status(200).json(ok(accounts));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.service.getAccountById(req.params.id);
      res.status(200).json(ok(account));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Whitelist dei campi: id/status/createdAt inviati dal client vengono ignorati
      const { iban, holderName, balance, accountType, customerId } = req.body ?? {};
      const account = await this.service.createAccount({ iban, holderName, balance, accountType, customerId });
      res.status(201).json(ok(account));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { holderName, accountType, status, customerId } = req.body ?? {};
      const account = await this.service.updateAccount(req.params.id, { holderName, accountType, status, customerId });
      res.status(200).json(ok(account));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAccount(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  };
}
