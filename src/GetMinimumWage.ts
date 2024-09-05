import {readFileSync} from 'fs'
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import humps from 'humps'
import {MinimumWages as MinimumWagesType} from "./types/MinimumWages";
import {MinimumWage as MinimumWageType} from "./types/MinimumWage";
import {PrefectureName} from "./types/PrefectureName";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export const getMinimumWages = (forceGetNextYear: boolean = false, date: Date = new Date()): MinimumWagesType => {
  if (forceGetNextYear) {
    return createNextMinimumWages()
  }

  return  createCurrentMinimumWages(date)
}

export const getMinimumWage = (prefectureName: PrefectureName, forceGetNextYear: boolean = false, date: Date = new Date()): MinimumWageType => {
  if (typeof prefectureName === 'undefined') {
    throw Error('Please pass prefecture name!!')
  }

  let minimumWages;

  if (forceGetNextYear) {
    minimumWages = createNextMinimumWages()
  } else {
    minimumWages = createCurrentMinimumWages(date)
  }

  const currentMinimumWage = minimumWages.minimumWages.find((minimumWage) => {
      return minimumWage.prefectureName === prefectureName
    }
  );

  if (typeof currentMinimumWage === 'undefined') {
    return {} as MinimumWageType;
  }

  return currentMinimumWage
}

const createCurrentMinimumWages = (specificDate: Date): MinimumWagesType => {
  const currentJsonFilePath = './minimum-wages-jp/current.json'
  const currentJson = readFileSync(currentJsonFilePath, 'utf8')
  const currentMinimumWages = humps.camelizeKeys(JSON.parse(currentJson)) as MinimumWagesType;

  const nextJsonFilePath = './minimum-wages-jp/next.json'
  const nextJson = readFileSync(nextJsonFilePath, 'utf8')
  const nextMinimumWages = humps.camelizeKeys(JSON.parse(nextJson)) as MinimumWagesType;

  const mergedMinimumWages = nextMinimumWages
    .minimumWages
    .map((nextMinimumWage) => {
      const startDate = dayjs(nextMinimumWage.effectiveStartDate).tz()
      if (dayjs(specificDate).isSame(startDate) || dayjs(specificDate).isAfter(startDate)) {
        return nextMinimumWage
      }

      const currentMinimumWage = currentMinimumWages.minimumWages.find(
        (currentMinimumWage) => {
          return currentMinimumWage.prefectureName === nextMinimumWage.prefectureName
        })

      if (typeof currentMinimumWage === 'undefined') {
        throw Error('Something wrong!')
      }

      return currentMinimumWage
    })


  return {minimumWages: mergedMinimumWages} as MinimumWagesType
}

const createNextMinimumWages = (): MinimumWagesType => {
  const jsonFile = './minimum-wages-jp/next.json'
  const json = readFileSync(jsonFile, 'utf8')
  return humps.camelizeKeys(JSON.parse(json)) as MinimumWagesType
}