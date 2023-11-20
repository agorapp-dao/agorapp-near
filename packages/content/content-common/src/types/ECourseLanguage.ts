export enum ECourseLanguage {
  SOLIDITY = 'solidity',
  TYPESCRIPT = 'typescript',
  MOTOKO = 'motoko',
  FUNC = 'func',
}

export function parseCourseLanguage(str: string): ECourseLanguage {
  if (!Object.values(ECourseLanguage).includes(str as ECourseLanguage)) {
    throw new Error(`Invalid language: ${str}`);
  }
  return str as ECourseLanguage;
}
