const STORAGE_KEY = "forgebound-iron-war-save";

const state = {
  player: {
    hp: 100,
    maxHp: 100,
    attack: 14,
    special: 30,
    level: 1,
    xp: 0,
    rage: 0,
    maxRage: 100,
    critChance: 0.12,
    armor: 0,
    gear: "Iron"
  },
  enemy: null,
  wave: 1,
  resources: {
    gold: 0,
    ore: 0,
    shards: 0
  },
  forge: {
    blade: 0,
    armor: 0,
    crit: 0,
    vitality: 0
  },
  log: "Forgefire awakens. The arena calls your name.",
  bossInterval: 5,
  peakBossWave: 5,
  combatReady: true
};

const refs = {
  waveCounter: document.getElementById("waveCounter"),
  heroHpText: document.getElementById("heroHpText"),
  heroHpBar: document.getElementById("heroHpBar"),
  rageText: document.getElementById("rageText"),
  rageBar: document.getElementById("rageBar"),
  gearTier: document.getElementById("gearTier"),
  enemyName: document.getElementById("enemyName"),
  enemyTier: document.getElementById("enemyTier"),
  enemyHpText: document.getElementById("enemyHpText"),
  enemyHpBar: document.getElementById("enemyHpBar"),
  enemyDamageText: document.getElementById("enemyDamageText"),
  enemyTypeText: document.getElementById("enemyTypeText"),
  goldValue: document.getElementById("goldValue"),
  oreValue: document.getElementById("oreValue"),
  shardsValue: document.getElementById("shardsValue"),
  levelValue: document.getElementById("levelValue"),
  battleLog: document.getElementById("battleLog"),
  attackButton: document.getElementById("attackButton"),
  specialButton: document.getElementById("specialButton"),
  forgeButton: document.getElementById("forgeButton"),
  nextWaveButton: document.getElementById("nextWaveButton"),
  upgradeButton: document.getElementById("upgradeButton"),
  resetButton: document.getElementById("resetButton"),
  forgeModal: document.getElementById("forgeModal"),
  closeForge: document.getElementById("closeForge"),
  statusBadge: document.getElementById("statusBadge"),
  bladeLevel: document.getElementById("bladeLevel"),
  armorLevel: document.getElementById("armorLevel"),
  critLevel: document.getElementById("critLevel"),
  vitalityLevel: document.getElementById("vitalityLevel")
};

const enemyNames = [
  "Raider",
  "Sentinel",
  "Ash Warden",
  "Fangrunner",
  "Mourning Knight",
  "Furnace Titan",
  "Obsidian Brute",
  "Stormcaller"
];

const enemyTypes = ["brute", "skirmisher", "charger", "slugger", "sapper"];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getDamageFromForge() {
  return state.forge.blade * 4;
}

function getArmorFromForge() {
  return state.forge.armor * 2;
}

function getMaxHpFromForge() {
  return state.forge.vitality * 12;
}

function getCritBonus() {
  return state.forge.crit * 0.04;
}

function getCurrentEnemy() {
  return state.enemy;
}

function determineEnemy(level) {
  const tier = Math.floor((level - 1) / 5) + 1;
  const boss = level % state.bossInterval === 0;
  const name = boss ? "Forge Guardian" : enemyNames[(level + tier) % enemyNames.length];
  const type = boss ? "boss" : enemyTypes[(level + tier) % enemyTypes.length];
  const hp = boss ? 80 + level * 18 : 30 + level * 9;
  const damage = boss ? 10 + level * 2 : 5 + level * 2;
  const rewardGold = boss ? 15 + level * 8 : 8 + level * 4;
  const rewardOre = boss ? 8 + level * 4 : 4 + level * 2;
  const rewardShards = boss ? 2 + Math.floor(level / 2) : 1 + Math.floor(level / 3);

  return {
    name,
    type,
    hp,
    maxHp: hp,
    damage,
    rewardGold,
    rewardOre,
    rewardShards,
    boss
  };
}

function updatePlayerStats() {
  const maxHpBoost = getMaxHpFromForge();
  state.player.maxHp = 100 + maxHpBoost;
  state.player.attack = 14 + state.forge.blade * 4 + state.player.level * 2;
  state.player.special = 30 + state.forge.blade * 5 + state.player.level * 3;
  state.player.critChance = 0.12 + getCritBonus();
  state.player.armor = 0 + getArmorFromForge();

  if (state.player.hp > state.player.maxHp) {
    state.player.hp = state.player.maxHp;
  }

  const ragePercent = clamp((state.player.rage / state.player.maxRage) * 100, 0, 100);
  refs.heroHpText.textContent = `${Math.ceil(state.player.hp)} / ${state.player.maxHp}`;
  refs.heroHpBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
  refs.rageText.textContent = `${Math.round(ragePercent)}%`;
  refs.rageBar.style.width = `${ragePercent}%`;
  refs.gearTier.textContent = state.player.gear;
  refs.levelValue.textContent = state.player.level;

  refs.goldValue.textContent = state.resources.gold;
  refs.oreValue.textContent = state.resources.ore;
  refs.shardsValue.textContent = state.resources.shards;

  refs.bladeLevel.textContent = state.forge.blade;
  refs.armorLevel.textContent = state.forge.armor;
  refs.critLevel.textContent = state.forge.crit;
  refs.vitalityLevel.textContent = state.forge.vitality;
}

function updateEnemyUI() {
  const enemy = getCurrentEnemy();
  if (!enemy) return;

  refs.enemyName.textContent = enemy.name;
  refs.enemyTier.textContent = enemy.boss ? "Boss" : `Rank ${Math.min(9, Math.ceil(state.wave / 2))}`;
  refs.enemyHpText.textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`;
  refs.enemyHpBar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  refs.enemyDamageText.textContent = `${enemy.damage} dmg`;
  refs.enemyTypeText.textContent = enemy.type;
  refs.waveCounter.textContent = state.wave;
}

function setBattleLog(message) {
  state.log = message;
  refs.battleLog.innerHTML = `<p>${message}</p>`;
}

function spawnEnemy() {
  state.enemy = determineEnemy(state.wave);
  updateEnemyUI();
  refs.statusBadge.textContent = state.enemy.boss ? "Boss Fight" : "Fighting";
  refs.statusBadge.style.background = state.enemy.boss ? "rgba(255, 93, 93, 0.12)" : "rgba(126, 242, 166, 0.12)";
  refs.statusBadge.style.color = state.enemy.boss ? "#ff7a7a" : "#7ef2a6";
}

function awardXp() {
  state.player.xp += 1 + Math.floor(state.wave / 2);
  while (state.player.xp >= 5 + (state.player.level - 1) * 2) {
    state.player.xp -= 5 + (state.player.level - 1) * 2;
    state.player.level += 1;
    state.player.hp = state.player.maxHp;
    setBattleLog(`Level up! You reached level ${state.player.level}.`);
  }
  updatePlayerStats();
}

function handleEnemyDefeat() {
  const enemy = getCurrentEnemy();
  if (!enemy) return;

  state.resources.gold += enemy.rewardGold;
  state.resources.ore += enemy.rewardOre;
  state.resources.shards += enemy.rewardShards;
  awardXp();

  if (state.wave % state.bossInterval === 0) {
    state.player.rage = clamp(state.player.rage + 18, 0, state.player.maxRage);
    setBattleLog(`Boss down! ${enemy.name} shattered. The forge rewards you.`);
  } else {
    state.player.rage = clamp(state.player.rage + 12, 0, state.player.maxRage);
    setBattleLog(`Victory! ${enemy.name} falls. You earn ${enemy.rewardGold} gold and ${enemy.rewardOre} ore.`);
  }

  state.wave += 1;
  state.combatReady = true;
  spawnEnemy();
  updatePlayerStats();
  saveGame();
}

function dealDamageToEnemy(amount) {
  const enemy = getCurrentEnemy();
  if (!enemy) return;

  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    handleEnemyDefeat();
    return;
  }

  updateEnemyUI();
}

function takeDamageFromEnemy(amount) {
  const reduction = Math.max(0, state.player.armor - amount * 0.18);
  const actualDamage = Math.max(1, Math.round(amount - reduction));

  state.player.hp -= actualDamage;
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    refs.statusBadge.textContent = "Defeated";
    refs.statusBadge.style.color = "#ff7a7a";
    setBattleLog("You fell in battle. The forge calls for another run.");
    state.combatReady = false;
  }

  updatePlayerStats();
}

function rageBurst() {
  if (state.player.rage < 100) {
    setBattleLog("Not enough rage. Keep fighting to charge it.");
    return;
  }

  const enemy = getCurrentEnemy();
  if (!enemy) return;

  const burst = state.player.special + state.wave * 5;
  dealDamageToEnemy(burst);
  state.player.rage = 0;
  setBattleLog(`Rage Burst! ${burst} damage tore through the enemy.`);
  if (state.enemy) {
    takeDamageFromEnemy(enemy.damage + 2);
  }
  updatePlayerStats();
  saveGame();
}

function basicAttack() {
  const enemy = getCurrentEnemy();
  if (!enemy || !state.combatReady) return;

  const critRoll = Math.random() < state.player.critChance;
  const baseDmg = state.player.attack + getDamageFromForge();
  const damage = critRoll ? Math.round(baseDmg * 1.8) : baseDmg;
  dealDamageToEnemy(damage);

  state.player.rage = clamp(state.player.rage + 18, 0, state.player.maxRage);
  setBattleLog(
    critRoll ? `Critical hit! ${damage} damage lands with explosive force.` : `Swing connects for ${damage} damage.`
  );

  if (state.enemy && state.combatReady) {
    takeDamageFromEnemy(enemy.damage);
  }

  updatePlayerStats();
  saveGame();
}

function forgeUpgrade(type) {
  const upgradeCosts = {
    blade: 18 + state.forge.blade * 12,
    armor: 16 + state.forge.armor * 10,
    crit: 20 + state.forge.crit * 15,
    vitality: 18 + state.forge.vitality * 12
  };

  const cost = upgradeCosts[type];

  if (state.resources.gold < cost) {
    setBattleLog(`Not enough gold for ${type}. Need ${cost} gold.`);
    return;
  }

  state.resources.gold -= cost;
  state.forge[type] += 1;
  if (type === "vitality") {
    state.player.hp = state.player.maxHp;
  }
  setBattleLog(`${type[0].toUpperCase() + type.slice(1)} forged to rank ${state.forge[type]}.`);
  updatePlayerStats();
  saveGame();
}

function nextWave() {
  if (!state.combatReady) {
    state.player.hp = state.player.maxHp;
    state.combatReady = true;
    refs.statusBadge.textContent = "Fighting";
  }

  state.wave += 1;
  spawnEnemy();
  setBattleLog(`The arena opens. Wave ${state.wave} begins.`);
  updatePlayerStats();
  saveGame();
}

function saveGame() {
  const payload = {
    player: state.player,
    enemy: state.enemy,
    wave: state.wave,
    resources: state.resources,
    forge: state.forge,
    log: state.log,
    combatReady: state.combatReady,
    bossInterval: state.bossInterval
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.enemy = determineEnemy(state.wave);
    updatePlayerStats();
    updateEnemyUI();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    Object.assign(state.player, parsed.player || state.player);
    Object.assign(state.resources, parsed.resources || state.resources);
    Object.assign(state.forge, parsed.forge || state.forge);
    state.wave = parsed.wave || state.wave;
    state.enemy = parsed.enemy || determineEnemy(state.wave);
    state.log = parsed.log || state.log;
    state.combatReady = parsed.combatReady !== false;
    refs.battleLog.innerHTML = `<p>${state.log}</p>`;
    updatePlayerStats();
    updateEnemyUI();
  } catch (error) {
    state.enemy = determineEnemy(state.wave);
    updatePlayerStats();
    updateEnemyUI();
  }
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, {
    player: {
      hp: 100,
      maxHp: 100,
      attack: 14,
      special: 30,
      level: 1,
      xp: 0,
      rage: 0,
      maxRage: 100,
      critChance: 0.12,
      armor: 0,
      gear: "Iron"
    },
    enemy: null,
    wave: 1,
    resources: {
      gold: 0,
      ore: 0,
      shards: 0
    },
    forge: {
      blade: 0,
      armor: 0,
      crit: 0,
      vitality: 0
    },
    log: "Forgefire awakens. The arena calls your name.",
    bossInterval: 5,
    peakBossWave: 5,
    combatReady: true
  });
  state.enemy = determineEnemy(state.wave);
  refs.battleLog.innerHTML = `<p>${state.log}</p>`;
  updatePlayerStats();
  updateEnemyUI();
}

refs.attackButton.addEventListener("click", basicAttack);
refs.specialButton.addEventListener("click", rageBurst);
refs.nextWaveButton.addEventListener("click", nextWave);
refs.forgeButton.addEventListener("click", () => {
  refs.forgeModal.classList.remove("hidden");
});
refs.closeForge.addEventListener("click", () => {
  refs.forgeModal.classList.add("hidden");
});
refs.resetButton.addEventListener("click", resetGame);
refs.upgradeButton.addEventListener("click", () => {
  refs.forgeModal.classList.remove("hidden");
});

Array.from(document.querySelectorAll("[data-upgrade]")).forEach((button) => {
  button.addEventListener("click", () => forgeUpgrade(button.dataset.upgrade));
});

loadGame();
spawnEnemy();
updatePlayerStats();
updateEnemyUI();
