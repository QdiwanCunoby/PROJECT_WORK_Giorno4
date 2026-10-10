// Route: connette URL → Controller. Le dipendenze arrivano dal composition root (app.ts).
import { Router } from "express";
import { AccountController } from "./account.controller";

export const createAccountRoutes = (controller: AccountController): Router => {
  const router = Router();

  router.get("/",       controller.getAll);    // 200
  router.get("/:id",    controller.getById);   // 200 | 404
  router.post("/",      controller.create);    // 201 | 400 | 409
  router.put("/:id",    controller.update);    // 200 | 400 | 404
  router.delete("/:id", controller.delete);    // 204 | 404

  return router;
};
