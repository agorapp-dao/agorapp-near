import { TActionRequest, TTestRequest, TTestResponse } from '@agorapp-dao/runner-common/src/types';
import { runner } from './modules/modules';

async function main() {
  if (!process.env.DOCKER_RUNNER_ACTION) {
    throw new Error('DOCKER_RUNNER_ACTION env var is required');
  }

  let args: any;
  try {
    args = JSON.parse(process.env.DOCKER_RUNNER_ARGS);
  } catch (err) {
    throw new Error(
      `Failed to parse DOCKER_RUNNER_ARGS. Make sure env var is set and it is a valid JSON.`,
    );
  }

  let result;
  switch (process.env.DOCKER_RUNNER_ACTION) {
    case 'test':
      result = await test(args);
      break;
    case 'action':
      result = await action(args);
      break;
    default:
      throw new Error(`Unsupported action: ${process.env.DOCKER_RUNNER_ACTION}`);
  }

  exit(0, result);
}

async function test(args: TTestRequest) {
  if (!args.courseSlug) {
    exit(1, { error: 'Course slug is required', passed: false, tests: [] });
  }
  if (!args.files) {
    exit(1, { error: 'Files are required', passed: false, tests: [] });
  }

  return await runner.test(args.courseSlug, args.lessonSlug, args.files);
}

async function action(args: TActionRequest) {
  return await runner.action(args);
}

function exit(code: number, result: unknown) {
  console.log(`DOCKER_RUNNER_RESULT=${JSON.stringify(result)}`);
  process.exit(code);
}

main();
