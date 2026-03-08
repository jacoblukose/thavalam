// Generates anonymous aliases like "Swift Falcon", "Crimson Drifter"

const adjectives = [
  "Swift", "Silent", "Crimson", "Golden", "Shadow", "Iron", "Midnight",
  "Thunder", "Copper", "Silver", "Blazing", "Frost", "Storm", "Ember",
  "Neon", "Cobalt", "Stealth", "Turbo", "Apex", "Lunar", "Sonic",
  "Phantom", "Rustic", "Velvet", "Coastal", "Alpine", "Desert", "Arctic",
  "Misty", "Dusty", "Smoky", "Ashen", "Chrome", "Graphite", "Onyx",
];

const nouns = [
  "Falcon", "Drifter", "Rider", "Nomad", "Pilot", "Ranger", "Cruiser",
  "Hawk", "Voyager", "Maverick", "Racer", "Torque", "Piston", "Axle",
  "Gear", "Sprocket", "Bolt", "Roadster", "Roamer", "Trailblazer",
  "Wrangler", "Scout", "Tracker", "Wanderer", "Navigator", "Blazer",
  "Viper", "Panther", "Stallion", "Wolf", "Fox", "Bear", "Otter",
  "Eagle", "Raven",
];

const colors = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
  "#AED581", "#DCE775", "#FFD54F", "#FFB74D", "#FF8A65",
  "#A1887F", "#90A4AE",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAlias(): string {
  return `${pick(adjectives)} ${pick(nouns)}`;
}

export function generateAvatarColor(): string {
  return pick(colors);
}
