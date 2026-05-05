import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scriptsRouter from "./scripts";
import toolsRouter from "./tools";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scriptsRouter);
router.use(toolsRouter);

export default router;
