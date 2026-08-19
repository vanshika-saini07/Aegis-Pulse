import { Router } from "express";
import * as controller from "../controllers/sessionController.js";

export const sessionRouter = Router();

sessionRouter.post("/", controller.createSession);
sessionRouter.get("/:shareCode", controller.getSession);
sessionRouter.post("/:id/check-in", controller.checkIn);
sessionRouter.post("/:id/location", controller.updateLocation);
sessionRouter.post("/:id/sos", controller.triggerSos);
sessionRouter.post("/:id/complete", controller.completeSession);
