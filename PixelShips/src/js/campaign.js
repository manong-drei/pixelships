export const campaign = {
  currentMission: 0,
  completedMissions: [],
};

export const missions = [
  {
    index: 0,
    title: "First Blood",
    briefing:
      "A lone enemy Destroyer is approaching. Show them what your torpedoes can do.",
    playerShip: "destroyer",
    enemies: [{ type: "destroyer", count: 1 }],
  },
  {
    index: 1,
    title: "Escort Duty",
    briefing:
      "Protect the supply freighter at all costs. Two Destroyers inbound.",
    playerShip: "cruiser",
    enemies: [{ type: "destroyer", count: 2 }],
  },
  {
    index: 2,
    title: "Blockade Run",
    briefing:
      "A Battleship and Destroyer guard a narrow channel. Pick your ship and break through.",
    playerShip: "choose",
    enemies: [
      { type: "battleship", count: 1 },
      { type: "destroyer", count: 1 },
    ],
  },
  {
    index: 3,
    title: "Air Superiority",
    briefing:
      "Enemy Carrier launching planes. Give them a taste of their own medicine.",
    playerShip: "carrier",
    enemies: [
      { type: "carrier", count: 1 },
      { type: "cruiser", count: 1 },
    ],
  },
  {
    index: 4,
    title: "The Flagship",
    briefing: "The Dreadnought awaits. Everything you have learned ends here.",
    playerShip: "choose",
    enemies: [{ type: "battleship", count: 1 }],
  },
];
