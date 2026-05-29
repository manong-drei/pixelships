export const campaign = {
  currentMission: 0,
  completedMissions: [],
  typewriterIndex: 0,
  typewriterTimer: 0,
  typewriterDone: false,
  shipChosen: false,
};

export const missions = [
  {
    index: 0,
    title: "First Blood",
    dialogue:
      "Captain, a lone Destroyer has been spotted on the horizon. This is your first engagement — keep it clean. Sink them before they close the distance. Dismissed.",
    chooseDialogue: null,
    playerShip: "destroyer",
    enemies: [{ type: "destroyer", count: 1 }],
  },
  {
    index: 1,
    title: "Escort Duty",
    dialogue:
      "Captain, a supply freighter is moving through contested waters and it cannot defend itself. Two enemy Destroyers are inbound. You will intercept them. That freighter does not sink. Are we clear?",
    chooseDialogue: null,
    playerShip: "cruiser",
    enemies: [{ type: "destroyer", count: 2 }],
  },
  {
    index: 2,
    title: "Blockade Run",
    dialogue:
      "Captain, a Battleship and its Destroyer escort are holding a narrow channel. We need that route open. Choose your vessel wisely — there is no room to maneuver in there.",
    chooseDialogue:
      "Choose your vessel, Captain. Whatever you pick, make it count.",
    playerShip: "choose",
    enemies: [
      { type: "battleship", count: 1 },
      { type: "destroyer", count: 1 },
    ],
  },
  {
    index: 3,
    title: "Air Superiority",
    dialogue:
      "Captain, their Carrier is operational and launching planes. We are sending you in with one of our own. Manage your aircraft, watch your skies, and take that Carrier down.",
    chooseDialogue: null,
    playerShip: "carrier",
    enemies: [
      { type: "carrier", count: 1 },
      { type: "cruiser", count: 1 },
    ],
  },
  {
    index: 4,
    title: "The Flagship",
    dialogue:
      "Captain, the Dreadnought. Their most powerful warship. Everything we have done up to this point has led here. Choose your ship, trust your instincts, and end this war.",
    chooseDialogue:
      "Choose your vessel, Captain. This is the last time I will give that order.",
    playerShip: "choose",
    enemies: [{ type: "battleship", count: 1 }],
  },
];
const TYPEWRITER_SPEED_MS = 40;

export function getActiveDialogue() {
  const mission = missions[campaign.currentMission];
  const needsChoose = mission.playerShip === "choose";
  const hasChosen = campaign.shipChosen;
  if (needsChoose && !hasChosen && mission.chooseDialogue) {
    return mission.chooseDialogue;
  }
  return mission.dialogue;
}

export function updateTypewriter(dt) {
  if (campaign.typewriterDone) return;
  campaign.typewriterTimer += dt;
  const charsToReveal = Math.floor(
    campaign.typewriterTimer / TYPEWRITER_SPEED_MS,
  );
  if (charsToReveal > 0) {
    campaign.typewriterTimer -= charsToReveal * TYPEWRITER_SPEED_MS;
    campaign.typewriterIndex = Math.min(
      campaign.typewriterIndex + charsToReveal,
      getActiveDialogue().length,
    );
    if (campaign.typewriterIndex >= getActiveDialogue().length) {
      campaign.typewriterDone = true;
    }
  }
}

export function skipTypewriter() {
  campaign.typewriterIndex = getActiveDialogue().length;
  campaign.typewriterDone = true;
}

export function resetTypewriter() {
  campaign.typewriterIndex = 0;
  campaign.typewriterTimer = 0;
  campaign.typewriterDone = false;
}
