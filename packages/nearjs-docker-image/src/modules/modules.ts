import { CourseRunner } from '@agorapp-dao/runner-common';
import { IntroToNearJsCourse } from './courses/introToNearJs';
import { StealTheTipsChallenge } from './challenges/stealTheTips';
import { AsyncProgrammingCourse } from './courses/asyncProgramming';
import { NearTradeHeistChallenge } from './challenges/nearTradeHeist';

export const runner = new CourseRunner([
  IntroToNearJsCourse,
  AsyncProgrammingCourse,
  StealTheTipsChallenge,
  NearTradeHeistChallenge,
]);
