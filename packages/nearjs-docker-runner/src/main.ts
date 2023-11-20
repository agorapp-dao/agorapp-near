import { TTestRequest, TTestResponse } from '@agorapp-dao/runner-common/src/types';
import { runner } from './modules/modules';

async function main() {
  let args: TTestRequest;
  try {
    args = JSON.parse(process.env.DOCKER_RUNNER_ARGS);
  } catch (err) {
    throw new Error(
      `Failed to parse DOCKER_RUNNER_ARGS. Make sure env var is set and it is a valid JSON.`,
    );
  }

  if (!args.courseSlug) {
    exit(1, { error: 'Course slug is required', passed: false, tests: [] });
  }
  if (!args.files) {
    exit(1, { error: 'Files are required', passed: false, tests: [] });
  }

  const res = await runner.test(args.courseSlug, args.lessonSlug, args.files);
  exit(0, res);
}

function exit(code: number, result: TTestResponse) {
  console.log(`DOCKER_RUNNER_RESULT=${JSON.stringify(result)}`);
  process.exit(code);
}

main();
