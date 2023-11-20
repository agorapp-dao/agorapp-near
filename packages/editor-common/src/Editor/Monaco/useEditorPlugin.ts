import { courseService } from '../../services/courseService';
import { useEffect, useState } from 'react';
import { IEditorPlugin } from '../../types/IEditorPlugin';
import { editorService } from '../editorService';
import { useMonaco } from './Monaco';
import { Monaco } from '@monaco-editor/loader';
import { TCourse } from '@agorapp-dao/content-common';

let currentPlugin: { name?: string; promise?: Promise<IEditorPlugin> } = {};

export function useEditorPlugin() {
  const monaco = useMonaco();
  const course = courseService.useCourse();

  const [plugin, setPlugin] = useState<IEditorPlugin | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!course.data || !monaco) {
        return;
      }

      if (course.data.plugin !== currentPlugin.name) {
        if (currentPlugin.name) {
          const prevPlugin = await currentPlugin.promise;
          if (prevPlugin?.destroy) {
            console.log('Destroying plugin instance', currentPlugin.name);
            await prevPlugin?.destroy();
          }
        }

        console.log('Creating plugin instance', course.data.plugin);
        currentPlugin.name = course.data.plugin;
        currentPlugin.promise = createPlugin(course.data, monaco);
      }

      const plugin_ = await currentPlugin.promise;
      setPlugin(plugin_);
    })();
  }, [course.data, monaco]);

  return plugin;
}

async function createPlugin(course: TCourse, monaco: Monaco) {
  const Plugin = await editorService.pluginLoader(course.plugin);
  const plugin = new Plugin();
  await plugin.init(monaco, course);
  editorService.registerPlugin(plugin);
  return plugin;
}
