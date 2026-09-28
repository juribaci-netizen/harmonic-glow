export type PreparationPreferences={weekdayStart:number;weekendStart:number;preferredEnd:number;latestEnd:number;roundBlocks?:boolean}
export const DEFAULT_PREPARATION_PREFERENCES:PreparationPreferences={weekdayStart:480,weekendStart:480,preferredEnd:1260,latestEnd:1260,roundBlocks:false}
export function validatePreparationPreferences(value:PreparationPreferences){
  if(!value||(value.roundBlocks!==undefined&&typeof value.roundBlocks!=='boolean')||![480,540,600].includes(value.weekdayStart)||![480,540,600].includes(value.weekendStart)||![1200,1260,1320].includes(value.preferredEnd)||![1200,1260,1320].includes(value.latestEnd)||value.latestEnd<value.preferredEnd)throw new Error('Neplatný režim prípravy.')
  return {weekdayStart:value.weekdayStart,weekendStart:value.weekendStart,preferredEnd:value.preferredEnd,latestEnd:value.latestEnd,roundBlocks:value.roundBlocks??false}
}
