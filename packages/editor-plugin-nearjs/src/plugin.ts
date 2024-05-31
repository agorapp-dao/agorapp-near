import { IEditorPlugin, Monaco, TEditorFile } from '@agorapp-dao/editor-common';
import pkg from '../package.json';
import { TTestResponse } from '@agorapp-dao/editor-common/src/types/TTestResponse';
import nearTypes from '@agorapp-dao/editor-types-nearjs/dist/types.json';
import nodeTypes from '@agorapp-dao/editor-types-node/dist/types.json';
import { TTestRequest } from '@agorapp-dao/editor-common/src/types/TTestRequest';
import { TCourse, TCourseType } from '@agorapp-dao/content-common';
import { languages } from 'monaco-editor';
import ScriptTarget = languages.typescript.ScriptTarget;
import { EditorStore, useEditorStore } from '@agorapp-dao/editor-common/src/Editor/EditorStore';
import { TransactionsPanel } from './ui/TransactionsPanel';
import { TActionRequest } from '@agorapp-dao/editor-common/src/types/TActionRequest';
import { TActionResponse } from '@agorapp-dao/editor-common/src/types/TActionResponse';
import { TRunActionRequest, TRunActionResponse } from './types';
import { testLiteTypes } from './test-lite-types';

export default class NearJsEditorPlugin implements IEditorPlugin {
  name = pkg.name;

  fileExtensions = {
    ts: 'typescript',
  };

  labels = {
    runButton: 'SUBMIT',
  };

  private monaco: Monaco | undefined;

  async init(monaco: Monaco, course: TCourse<unknown>, editorStore: EditorStore) {
    this.monaco = monaco;

    // https://stackoverflow.com/questions/52290727/adding-typescript-type-declarations-to-monaco-editor
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      baseUrl: '',
      noUnusedLocals: false,
      noUnusedParameters: false,
      experimentalDecorators: true,
      esModuleInterop: true,
      // without this @view and @call decorators fail with "Unable to resolve signature of method decorator when called as an expression."
      target: ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [
        // 'xxx' is declared but never used.
        6196,
      ],
    });

    let defs = nearTypes as any;
    for (const path of Object.keys(defs)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(defs[path], 'file:///' + path);
    }

    defs = nodeTypes as any;
    for (const path of Object.keys(defs)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(defs[path], 'file:///' + path);
    }

    for (const path of Object.keys(testLiteTypes)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        testLiteTypes[path],
        'file:///' + path,
      );
    }

    editorStore.actions.addPanel({
      id: 'nearjs.transactions',
      label: 'Transactions',
      component: TransactionsPanel,
      props: {},
    });
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
      image: 'rbiosas/nearjs-docker-image',
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

  async runAction(
    req: TActionRequest<TRunActionRequest>,
  ): Promise<TActionResponse<TRunActionResponse>> {
    const response = await fetch('/next-api/runner/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    const res = (await response.json()) as TActionResponse<TRunActionResponse>;
    return res;
  }
}
