'use client';

import { ChevronIcon, Combobox, CopyToClipboard, PopupList, RenderFields, useForm, useFormFields, useTranslation } from '@payloadcms/ui';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useBlockComponentContext } from '@payloadcms/richtext-lexical/client';
import React from 'react';

type Languages = Record<string, string>;

type Props = {
  languages?: Languages;
};

const baseClass = 'payload-richtext-code-block';

export function CodeBlockComponent({ languages: languagesFromProps }: Props) {
  const languages = languagesFromProps ?? {};

  const { BlockCollapsible, formSchema, RemoveButton } = useBlockComponentContext();
  const { setModified } = useForm();
  const { t } = useTranslation();

  const { codeField } = useFormFields(([fields]) => ({
    codeField: fields?.code,
  }));

  const { selectedLanguageField, setSelectedLanguage } = useFormFields(([fields, dispatch]) => ({
    selectedLanguageField: fields?.language,
    setSelectedLanguage: (language: string) => {
      dispatch({ type: 'UPDATE', path: 'language', value: language });
      setModified(true);
    },
  }));

  const selectedLanguageLabel = languages[selectedLanguageField?.value as string];
  const isEditable = useLexicalEditable();

  const languageEntries = React.useMemo(
    () =>
      Object.entries(languages).map(([languageCode, languageLabel]) => ({
        name: `${languageCode} ${languageLabel}`,
        Component: (
          <PopupList.Button
            active={false}
            disabled={false}
            onClick={() => setSelectedLanguage(languageCode)}
          >
            <span className={`${baseClass}__language-code`} data-language={languageCode}>
              {languageLabel}
            </span>
          </PopupList.Button>
        ),
      })),
    [languages, setSelectedLanguage],
  );

  return (
    <BlockCollapsible
      Actions={
        <div className={`${baseClass}__actions`}>
          <Combobox
            button={
              <div
                className={`${baseClass}__language-selector-button`}
                data-selected-language={selectedLanguageField?.value}
              >
                <span>{selectedLanguageLabel}</span>
                <ChevronIcon className={`${baseClass}__chevron`} />
              </div>
            }
            buttonType="custom"
            className={`${baseClass}__language-selector`}
            disabled={!isEditable}
            entries={languageEntries}
            horizontalAlign="right"
            minEntriesForSearch={8}
            searchPlaceholder={t('fields:searchForLanguage')}
            showScrollbar
            size="large"
          />
          <CopyToClipboard value={codeField?.value ?? ''} />
          {isEditable && <RemoveButton />}
        </div>
      }
      className={baseClass}
      collapsibleProps={{
        disableHeaderToggle: true,
        disableToggleIndicator: true,
      }}
      Pill={<div className={`${baseClass}__pill`} />}
    >
      <RenderFields
        fields={formSchema}
        forceRender
        parentIndexPath=""
        parentPath=""
        parentSchemaPath=""
        permissions={true}
        readOnly={!isEditable}
      />
    </BlockCollapsible>
  );
}
