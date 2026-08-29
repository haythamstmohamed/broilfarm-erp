const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'server/db.ts.bak');
const destDir = path.join(__dirname, 'server/db');

// Reset dir
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

const content = fs.readFileSync(srcFile, 'utf8');

const importsMatch = content.match(/^([\s\S]*?)\nlet _db:/);
const baseImports = importsMatch[1].trim();

const localImports = `
import { getDb } from "./connection";
import { resolveFarmAccess, requireFarmCapability, requireCycleCapability, requireCycleHouseAssignment } from "./auth";
import { emptyCounts, resolveCascadeScope, getCascadeCounts, getCascadeDeletionImpact, deleteCascadeScope, CascadeScope } from "./farms";
import { requireSufficientFeedBalance } from "./operations";
import { refreshSaleFromBatches } from "./sales";
import { requireWorkerAccountAccess } from "./workers";
import { invitationHash, createInvitationCode } from "./access";
import { getExistingHealthEvent, HealthEventInput } from "./health";
`;

const items = [
  { mod: 'connection', kw: 'let _db' },
  { mod: 'connection', kw: 'export async function getDb(' },
  { mod: 'users', kw: 'export async function upsertUser(' },
  { mod: 'users', kw: 'export async function getUserByOpenId(' },
  { mod: 'workspace', kw: 'export async function getWorkspace(' },
  { mod: 'inventory', kw: 'export async function updateFeedInventorySettings(' },
  { mod: 'inventory', kw: 'export async function addFeedInventoryTransaction(' },
  { mod: 'expenses', kw: 'export async function addFarmExpense(' },
  { mod: 'expenses', kw: 'export async function updateFarmExpense(' },
  { mod: 'workers', kw: 'export async function createWorker(' },
  { mod: 'workers', kw: 'export async function updateWorker(' },
  { mod: 'workers', kw: 'async function requireWorkerAccountAccess(' },
  { mod: 'workers', kw: 'export async function addWorkerAccountEntry(' },
  { mod: 'workers', kw: 'export async function updateWorkerAccountEntry(' },
  { mod: 'workers', kw: 'export async function deleteWorkerAccountEntry(' },
  { mod: 'sales', kw: 'export async function createTrader(' },
  { mod: 'sales', kw: 'export async function createTraderWithSimpleSale(' },
  { mod: 'sales', kw: 'export async function createSale(' },
  { mod: 'sales', kw: 'export async function startTraderLoading(' },
  { mod: 'sales', kw: 'export async function addSaleWeighBatch(' },
  { mod: 'sales', kw: 'export async function addSaleTareBatch(' },
  { mod: 'sales', kw: 'export async function fillSaleTareBatch(' },
  { mod: 'sales', kw: 'export async function updateSaleTareBatch(' },
  { mod: 'sales', kw: 'async function refreshSaleFromBatches(' },
  { mod: 'sales', kw: 'export async function calculateSaleTotal(' },
  { mod: 'sales', kw: 'export async function reopenSale(' },
  { mod: 'sales', kw: 'export async function updateTrader(' },
  { mod: 'sales', kw: 'export async function deleteTrader(' },
  { mod: 'sales', kw: 'export async function updateSaleWeighBatch(' },
  { mod: 'sales', kw: 'export async function deleteSaleWeighBatch(' },
  { mod: 'sales', kw: 'export async function completeSale(' },
  { mod: 'sales', kw: 'export async function updateSaleDetails(' },
  { mod: 'sales', kw: 'export async function reorderSaleWeighBatches(' },
  { mod: 'sales', kw: 'export async function deleteSale(' },
  { mod: 'sales', kw: 'export async function addSalePayment(' },
  { mod: 'sales', kw: 'export async function updateSalePayment(' },
  { mod: 'sales', kw: 'export async function deleteSalePayment(' },
  { mod: 'auth', kw: 'async function resolveFarmAccess(' },
  { mod: 'auth', kw: 'async function requireFarmCapability(' },
  { mod: 'auth', kw: 'async function requireCycleCapability(' },
  { mod: 'auth', kw: 'async function requireCycleHouseAssignment(' },
  { mod: 'access', kw: 'function invitationHash(' },
  { mod: 'access', kw: 'function createInvitationCode(' },
  { mod: 'farms', kw: 'export async function bootstrapFarm(' },
  { mod: 'farms', kw: 'export async function createFarm(' },
  { mod: 'farms', kw: 'export async function updateFarmLocation(' },
  { mod: 'farms', kw: 'export async function updateFarm(' },
  { mod: 'farms', kw: 'type CascadeScope' },
  { mod: 'farms', kw: 'const emptyCounts' },
  { mod: 'farms', kw: 'async function resolveCascadeScope(' },
  { mod: 'farms', kw: 'async function getCascadeCounts(' },
  { mod: 'farms', kw: 'export async function getCascadeDeletionImpact(' },
  { mod: 'farms', kw: 'async function deleteCascadeScope(' },
  { mod: 'farms', kw: 'export async function deleteFarm(' },
  { mod: 'cycles', kw: 'export async function createCycle(' },
  { mod: 'cycles', kw: 'export async function updateCycle(' },
  { mod: 'cycles', kw: 'export async function deleteCycle(' },
  { mod: 'houses', kw: 'export async function setCycleHouseAssignment(' },
  { mod: 'operations', kw: 'export async function addDailyRecord(' },
  { mod: 'operations', kw: 'async function requireSufficientFeedBalance(' },
  { mod: 'operations', kw: 'export async function updateDailyRecord(' },
  { mod: 'operations', kw: 'export async function deleteDailyRecord(' },
  { mod: 'weights', kw: 'export async function addWeightSample(' },
  { mod: 'health', kw: 'export type HealthEventInput' },
  { mod: 'health', kw: 'export async function addHealthEvent(' },
  { mod: 'health', kw: 'export async function addHealthEvents(' },
  { mod: 'health', kw: 'async function getExistingHealthEvent(' },
  { mod: 'health', kw: 'export async function updateHealthEvent(' },
  { mod: 'health', kw: 'export async function deleteHealthEvent(' },
  { mod: 'houses', kw: 'export async function createHouse(' },
  { mod: 'houses', kw: 'export async function updateHouse(' },
  { mod: 'houses', kw: 'export async function deleteHouse(' },
  { mod: 'houses', kw: 'export async function createCageSection(' },
  { mod: 'houses', kw: 'export async function setCageOccupancy(' },
  { mod: 'cycles', kw: 'export async function closeCycle(' },
  { mod: 'cycles', kw: 'export async function finalizeCycleSalesAndClose(' },
  { mod: 'access', kw: 'export async function createInvitation(' },
  { mod: 'access', kw: 'export async function listInvitations(' },
  { mod: 'access', kw: 'export async function revokeInvitation(' },
  { mod: 'access', kw: 'export async function regenerateInvitation(' },
  { mod: 'access', kw: 'export async function redeemInvitation(' }
];

// Verify all items are found in order, or just find their indices
const indices = [];
for (const item of items) {
  const idx = content.indexOf(item.kw);
  if (idx === -1) {
    console.warn("Could not find", item.kw);
  } else {
    indices.push({ mod: item.mod, kw: item.kw, idx });
  }
}

// Sort by index
indices.sort((a, b) => a.idx - b.idx);

// Extract content between indices
for (let i = 0; i < indices.length; i++) {
  const start = indices[i].idx;
  const end = (i < indices.length - 1) ? indices[i + 1].idx : content.length;
  indices[i].content = content.substring(start, end).trim();
}

// Group by module
const modContent = {};
for (const item of indices) {
  if (!modContent[item.mod]) modContent[item.mod] = [];
  modContent[item.mod].push(item.content);
}

// Write files
for (const [mod, contents] of Object.entries(modContent)) {
  let fileContent = baseImports + "\n" + localImports + "\n\n";
  fileContent += contents.join("\n\n") + "\n";
  fs.writeFileSync(path.join(destDir, mod + '.ts'), fileContent);
}

// Write index.ts
let indexContent = "";
const uniqueMods = [...new Set(indices.map(i => i.mod))];
for (const mod of uniqueMods) {
  indexContent += 'export * from "./' + mod + '";\n';
}
fs.writeFileSync(path.join(destDir, 'index.ts'), indexContent);

// Fix N+1 queries in workspace.ts
let workspaceContent = fs.readFileSync(path.join(destDir, 'workspace.ts'), 'utf8');
workspaceContent = workspaceContent.replace(
  /Promise\.all\(farmIds\.map\(\(farmId\) => db\.select\(\)\.from\(houses\)\.where\(eq\(houses\.farmId, farmId\)\)\)\)\.then\(\(items\) => items\.flat\(\)\)/g,
  'db.select().from(houses).where(inArray(houses.farmId, farmIds))'
);
workspaceContent = workspaceContent.replace(
  /Promise\.all\(farmIds\.map\(\(farmId\) => db\.select\(\)\.from\(cycles\)\.where\(eq\(cycles\.farmId, farmId\)\)\)\)\.then\(\(items\) => items\.flat\(\)\)/g,
  'db.select().from(cycles).where(inArray(cycles.farmId, farmIds))'
);
fs.writeFileSync(path.join(destDir, 'workspace.ts'), workspaceContent);

console.log("Done splitting safely.");
