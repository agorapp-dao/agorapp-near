import { IEditorPlugin, Monaco, TEditorFile } from '@agorapp-dao/editor-common';
import pkg from '../package.json';
import { TTestResponse } from '@agorapp-dao/editor-common/src/types/TTestResponse';
import nearTypes from '@agorapp-dao/editor-types-nearjs/dist/types.json';
import nodeTypes from '@agorapp-dao/editor-types-node/dist/types.json';
import { TTestRequest } from '@agorapp-dao/editor-common/src/types/TTestRequest';
import { TCourseType } from '@agorapp-dao/content-common';
import { languages } from 'monaco-editor';
import ScriptTarget = languages.typescript.ScriptTarget;

export default class NearJsEditorPlugin implements IEditorPlugin {
  name = pkg.name;

  fileExtensions = {
    ts: 'typescript',
  };

  private monaco: Monaco | undefined;

  async init(monaco: Monaco) {
    this.monaco = monaco;

    // https://stackoverflow.com/questions/52290727/adding-typescript-type-declarations-to-monaco-editor
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      baseUrl: '',
      noUnusedLocals: false,
      noUnusedParameters: false,
      experimentalDecorators: true,
      // without this @view and @call decorators fail with "Unable to resolve signature of method decorator when called as an expression."
      target: ScriptTarget.ES5,
    });

    let defs = nearTypes as any;
    for (const path of Object.keys(defs)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(defs[path], 'file:///' + path);
    }

    defs = nodeTypes as any;
    for (const path of Object.keys(defs)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(defs[path], 'file:///' + path);
    }
  }

  onModelChange() {
    if (!this.monaco) return;

    // TODO: hack - forces tsWorker to revalidate the current model. It's needed because after switching from one tab
    // to another, model is not revalidated automatically.
    this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      this.monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    );
  }

  async check(filePath: string, files: TEditorFile[]): Promise<void> {}

  async run(
    courseSlug: string,
    lessonSlug: string | undefined,
    files: TEditorFile[],
  ): Promise<string> {
    throw new Error(`Not supported`);
  }

  async test(
    courseType: TCourseType,
    courseSlug: string,
    lessonSlug: string | undefined,
    files: TEditorFile[],
  ): Promise<TTestResponse> {
    const req: TTestRequest = {
      runner: 'docker-runner',
      image: 'rbiosas/nearjs-docker-runner',
      type: courseType,
      courseSlug,
      lessonSlug,
      files,
    };

    const response = await fetch('/next-api/runner/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    const res = await response.json();
    return res;
  }
}
