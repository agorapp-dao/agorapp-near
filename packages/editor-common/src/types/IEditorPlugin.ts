import { TEditorFile, Monaco } from '../index';
import { TTestResponse } from './TTestResponse';
import { TCourse, TCourseType } from '@agorapp-dao/content-common';

export interface IEditorPlugin {
  name: string;

  /**
   * Maps file extensions to language IDs.
   */
  fileExtensions: { [ext: string]: string };

  init(monaco: Monaco, course?: TCourse<unknown>): Promise<void>;

  /**
   * Executes the provided files and returns the program output.
   */
  run(courseSlug: string, lessonSlug: string | undefined, files: TEditorFile[]): Promise<string>;

  /**
   * Run tests against provided files and return the test results.
   */
  test(
    courseType: TCourseType,
    courseSlug: string,
    lessonSlug: string | undefined,
    files: TEditorFile[],
  ): Promise<TTestResponse>;

  check(filePath: string, files: TEditorFile[]): Promise<void>;

  onModelChange?(): void;

  destroy?(): Promise<void>;
}
