'use client';

import { CodeField, useFormFields } from '@payloadcms/ui';
import React, { useId, useMemo } from 'react';

type Languages = Record<string, string>;

type Props = {
  autoComplete?: string;
  field: any;
  forceRender?: boolean;
  languages?: Languages;
  path: string;
  permissions?: any;
  readOnly?: boolean;
  renderedBlocks?: any;
  schemaPath?: string;
  typescript?: {
    enableSemanticValidation?: boolean;
    fetchTypes?: { url: string; filePath: string }[];
    paths?: Record<string, string[]>;
    target?: string;
    typeRoots?: string[];
  };
  validate?: any;
};

export function CodeFieldComponent({
  autoComplete,
  field,
  forceRender,
  languages,
  path,
  permissions,
  readOnly,
  renderedBlocks,
  schemaPath,
  typescript,
  validate,
}: Props) {
  const languageField = useFormFields(([fields]) => fields['language']);
  const language = (languageField?.value ?? languageField?.initialValue ?? 'typescript') as string;
  const instanceId = useId();
  const label = languages?.[language];

  const props = useMemo(
    () => ({
      ...field,
      type: 'code',
      admin: {
        ...field.admin,
        editorOptions: {},
        editorProps: {
          // Fix for Payload bug: original only checks language === 'ts', but the value is 'typescript'
          defaultPath: ['ts', 'typescript', 'tsx'].includes(language)
            ? `file-${field.name}-${instanceId}.tsx`
            : undefined,
        },
        language,
      },
    }),
    [field, language, instanceId],
  );

  const key = `${field.name}-${language}-${label}`;

  return (
    props && (
      <CodeField
        key={key}
        autoComplete={autoComplete}
        field={props}
        forceRender={forceRender}
        onMount={(_editor, monaco) => {
          monaco.editor.defineTheme('vs-dark', {
            base: 'vs-dark',
            colors: { 'editor.background': '#222222' },
            inherit: true,
            rules: [],
          });
          monaco.editor.defineTheme('vs', {
            base: 'vs',
            colors: { 'editor.background': '#f5f5f5' },
            inherit: true,
            rules: [],
          });
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            allowNonTsExtensions: true,
            allowJs: true,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            noEmit: true,
            paths: typescript?.paths,
            reactNamespace: 'React',
            target: monaco.languages.typescript.ScriptTarget[typescript?.target ?? 'ESNext'],
            typeRoots: typescript?.typeRoots ?? ['node_modules/@types'],
          });
          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: typescript?.enableSemanticValidation ? false : true,
            noSyntaxValidation: false,
          });
          if (typescript?.fetchTypes?.length) {
            void Promise.all(
              typescript.fetchTypes.map(async (type) => {
                const res = await fetch(type.url);
                const text = await res.text();
                monaco.languages.typescript.typescriptDefaults.addExtraLib(text, type.filePath);
              }),
            );
          }
        }}
        path={path}
        permissions={permissions}
        readOnly={readOnly}
        renderedBlocks={renderedBlocks}
        schemaPath={schemaPath}
        validate={validate}
      />
    )
  );
}
