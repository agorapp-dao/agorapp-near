import { CourseChecker } from '@agorapp-dao/runner-common';
import { runner } from './modules';

const checker = new CourseChecker(runner);
checker.generateTests();
