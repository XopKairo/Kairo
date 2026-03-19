import express from "express";
import { 
  addMoment, 
  getMyMoments, 
  getHostMoments, 
  deleteMoment 
} from "../controllers/momentController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectUser);

router.post("/", addMoment);
router.get("/me", getMyMoments);
router.get("/host/:hostId", getHostMoments);
router.delete("/:id", deleteMoment);

export default router;