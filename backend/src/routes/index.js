import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadCrest } from "../middleware/upload.js";

import * as auth from "../controllers/auth.controller.js";
import * as teams from "../controllers/team.controller.js";
import * as players from "../controllers/player.controller.js";
import * as matches from "../controllers/match.controller.js";
import * as stats from "../controllers/stats.controller.js";
import * as ads from "../controllers/ad.controller.js";
import * as settings from "../controllers/settings.controller.js";
import * as roundTeams from "../controllers/roundTeam.controller.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

// --- Auth ---
router.post("/auth/login", auth.login);
router.get("/auth/me", requireAuth, auth.me);

// --- Públicas (leitura) ---
router.get("/dashboard", stats.dashboard);
router.get("/standings", stats.standings);
router.get("/scorers", stats.scorers);
router.get("/cards-ranking", stats.cardsRanking);

router.get("/teams", teams.list);
router.get("/teams/:id", teams.getOne);

router.get("/players", players.list);
router.get("/players/:id", players.getOne);

router.get("/matches", matches.list);
router.get("/matches/rounds", matches.rounds);
router.get("/matches/:id", matches.getOne);
router.post("/matches/:id/vote", matches.vote);

router.get("/ads", ads.list);

router.get("/round-teams", roundTeams.list);

router.get("/settings", settings.get);
router.post("/settings/follow", settings.follow);
router.post("/settings/unfollow", settings.unfollow);

// --- Administrativas (protegidas) ---
router.post("/teams", requireAuth, teams.create);
router.put("/teams/:id", requireAuth, teams.update);
router.delete("/teams/:id", requireAuth, teams.remove);

router.post("/players", requireAuth, players.create);
router.put("/players/:id", requireAuth, players.update);
router.delete("/players/:id", requireAuth, players.remove);

router.post("/matches", requireAuth, matches.create);
router.put("/matches/:id", requireAuth, matches.update);
router.delete("/matches/:id", requireAuth, matches.remove);
router.patch("/matches/:id/score", requireAuth, matches.updateScore);

router.post("/matches/:id/goals", requireAuth, matches.addGoal);
router.put("/matches/:id/goals/:goalId", requireAuth, matches.updateGoal);
router.delete("/matches/:id/goals/:goalId", requireAuth, matches.removeGoal);
router.post("/matches/:id/cards", requireAuth, matches.addCard);
router.put("/matches/:id/cards/:cardId", requireAuth, matches.updateCard);
router.delete("/matches/:id/cards/:cardId", requireAuth, matches.removeCard);

router.get("/ads/all", requireAuth, ads.listAll);
router.post("/ads", requireAuth, ads.create);
router.put("/ads/:id", requireAuth, ads.update);
router.delete("/ads/:id", requireAuth, ads.remove);

router.put("/settings", requireAuth, settings.update);

router.put("/round-teams", requireAuth, roundTeams.save);
router.delete("/round-teams/:id", requireAuth, roundTeams.remove);

// Upload de imagens (escudo de time, banner de propaganda, etc.)
router.post("/upload", requireAuth, uploadCrest, uploadImage);

export default router;
