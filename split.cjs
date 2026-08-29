const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'server/db.ts');
const destDir = path.join(__dirname, 'server/db');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const content = fs.readFileSync(srcFile, 'utf8');

const importsMatch = content.match(/^([\s\S]*?)\nlet _db:/);
const baseImports = importsMatch[1].trim();

// Add local cross-imports we will need
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

const modules = {
  connection: ['let _db', 'export async function getDb'],
  auth: ['async function resolveFarmAccess', 'async function requireFarmCapability', 'async function requireCycleCapability', 'async function requireCycleHouseAssignment'],
  users: ['export async function upsertUser', 'export async function getUserByOpenId'],
  workspace: ['export async function getWorkspace'],
  farms: ['export async function bootstrapFarm', 'export async function createFarm', 'export async function updateFarmLocation', 'export async function updateFarm', 'type CascadeScope', 'const emptyCounts', 'async function resolveCascadeScope', 'async function getCascadeCounts', 'export async function getCascadeDeletionImpact', 'async function deleteCascadeScope', 'export async function deleteFarm'],
  cycles: ['export async function createCycle', 'export async function updateCycle', 'export async function deleteCycle', 'export async function closeCycle', 'export async function finalizeCycleSalesAndClose'],
  houses: ['export async function createHouse', 'export async function updateHouse', 'export async function deleteHouse', 'export async function createCageSection', 'export async function setCageOccupancy', 'export async function setCycleHouseAssignment'],
  operations: ['export async function addDailyRecord', 'async function requireSufficientFeedBalance', 'export async function updateDailyRecord', 'export async function deleteDailyRecord'],
  health: ['export type HealthEventInput', 'export async function addHealthEvent', 'export async function addHealthEvents', 'async function getExistingHealthEvent', 'export async function updateHealthEvent', 'export async function deleteHealthEvent'],
  weights: ['export async function addWeightSample'],
  inventory: ['export async function updateFeedInventorySettings', 'export async function addFeedInventoryTransaction'],
  expenses: ['export async function addFarmExpense', 'export async function updateFarmExpense'],
  workers: ['export async function createWorker', 'export async function updateWorker', 'async function requireWorkerAccountAccess', 'export async function addWorkerAccountEntry', 'export async function updateWorkerAccountEntry', 'export async function deleteWorkerAccountEntry'],
  sales: ['export async function createTrader', 'export async function createTraderWithSimpleSale', 'export async function createSale', 'export async function startTraderLoading', 'export async function addSaleWeighBatch', 'export async function addSaleTareBatch', 'export async function fillSaleTareBatch', 'export async function updateSaleTareBatch', 'async function refreshSaleFromBatches', 'export async function calculateSaleTotal', 'export async function reopenSale', 'export async function updateTrader', 'export async function deleteTrader', 'export async function updateSaleWeighBatch', 'export async function deleteSaleWeighBatch', 'export async function completeSale', 'export async function updateSaleDetails', 'export async function reorderSaleWeighBatches', 'export async function deleteSale', 'export async function addSalePayment', 'export async function updateSalePayment', 'export async function deleteSalePayment'],
  access: ['function invitationHash', 'function createInvitationCode', 'export async function createInvitation', 'export async function listInvitations', 'export async function revokeInvitation', 'export async function regenerateInvitation', 'export async function redeemInvitation']
};

function extractBlock(keyword) {
  // Find where the keyword starts
  const idx = content.indexOf(keyword);
  if (idx === -1) {
    console.warn("Could not find", keyword);
    return "";
  }
  
  // Find the end of the block. If it's a function or type, we count brackets.
  // If it's a 'let' or 'const', we just go to the end of the line or next statement.
  if (keyword.startsWith('let ') || keyword.startsWith('const ') || keyword.startsWith('type ')) {
    // For simplicity, find the end of the statement by looking for \n\n or \nexport or \nasync or \nfunction
    const nextMatch = content.substring(idx + 1).match(/\\n(export |async |function |const |let |type )/);
    if (nextMatch) {
      return content.substring(idx, idx + 1 + nextMatch.index).trim();
    }
    return content.substring(idx).trim();
  }

  // Count braces for functions
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  let started = false;
  let endIdx = idx;

  for (let i = idx; i < content.length; i++) {
    const char = content[i];
    
    if (inString) {
      if (char === stringChar && content[i-1] !== '\\\\') {
        inString = false;
      }
    } else if (char === '"' || char === "'" || char === '\`') {
      inString = true;
      stringChar = char;
    } else if (char === '{') {
      braceCount++;
      started = true;
    } else if (char === '}') {
      braceCount--;
      if (started && braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  
  return content.substring(idx, endIdx);
}

// Generate files
for (const [mod, keywords] of Object.entries(modules)) {
  let fileContent = baseImports + "\\n" + localImports + "\\n\\n";
  for (const kw of keywords) {
    fileContent += extractBlock(kw) + "\\n\\n";
  }
  fs.writeFileSync(path.join(destDir, mod + '.ts'), fileContent);
}

// Generate index.ts
let indexContent = "";
for (const mod of Object.keys(modules)) {
  indexContent += 'export * from "./' + mod + '";\\n';
}
fs.writeFileSync(path.join(destDir, 'index.ts'), indexContent);

// Fix N+1 queries in workspace.ts
let workspaceContent = fs.readFileSync(path.join(destDir, 'workspace.ts'), 'utf8');
workspaceContent = workspaceContent.replace(
  /Promise\\.all\\(farmIds\\.map\\(\\(farmId\\) => db\\.select\\(\\)\\.from\\(houses\\)\\.where\\(eq\\(houses\\.farmId, farmId\\)\\)\\)\\)\\.then\\(\\(items\\) => items\\.flat\\(\\)\\)/g,
  'db.select().from(houses).where(inArray(houses.farmId, farmIds))'
);
workspaceContent = workspaceContent.replace(
  /Promise\\.all\\(farmIds\\.map\\(\\(farmId\\) => db\\.select\\(\\)\\.from\\(cycles\\)\\.where\\(eq\\(cycles\\.farmId, farmId\\)\\)\\)\\)\\.then\\(\\(items\\) => items\\.flat\\(\\)\\)/g,
  'db.select().from(cycles).where(inArray(cycles.farmId, farmIds))'
);
fs.writeFileSync(path.join(destDir, 'workspace.ts'), workspaceContent);

console.log("Done splitting.");
