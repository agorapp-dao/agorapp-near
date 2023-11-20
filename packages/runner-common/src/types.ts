export type TTestRequest = {
  runner: string;
  image?: string;
  courseSlug: string;
  lessonSlug?: string;
  files: TEditorFile[];
};

export type TTestResponse = {
  passed: boolean;
  error?: string;
  tests: TTest[];
};

export type TTest = {
  title: string;
  passed: boolean;
  error?: string;
};

export type TEditorFile = {
  path: string;
  content: string;
};

export type TEditorFileMap = { [path: string]: Omit<TEditorFile, 'path'> };
