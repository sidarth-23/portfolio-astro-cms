'use client';

import React, { useCallback, useRef } from 'react';
import {
  FormSubmit,
  useForm,
  useFormModified,
  useHotkey,
  useDocumentInfo,
  useEditDepth,
  useOperation,
  useTranslation,
  useConfig,
  useLocale,
  useModal,
  useDrawerSlug,
} from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';

import { computeSeoCheck, type SeoCheckResult } from '../../../lib/seo/computeSeoCheck';
import { SeoConfirmModal } from './SeoConfirmModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractChangedFields(
  differences: SeoCheckResult['differences'],
): Array<'title' | 'description' | 'image'> {
  const fields: Array<'title' | 'description' | 'image'> = [];
  if (differences.title) fields.push('title');
  if (differences.description) fields.push('description');
  if (differences.image) fields.push('image');
  return fields;
}

// ---------------------------------------------------------------------------
// SeoSaveButton — for Series (no drafts), replicates SaveButton
// ---------------------------------------------------------------------------

export function SeoSaveButton() {
  const { uploadStatus } = useDocumentInfo();
  const { t } = useTranslation();
  const { submit, getData } = useForm();
  const modified = useFormModified();
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();
  const operation = useOperation();
  const { collectionSlug } = useDocumentInfo();

  const drawerSlug = useDrawerSlug('seo-confirm-save');
  const { openModal, closeModal } = useModal();

  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const changedFieldsRef = useRef<Array<'title' | 'description' | 'image'>>([]);

  const disabled = (operation === 'update' && !modified) || uploadStatus === 'uploading';

  const handleConfirm = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const handleSkip = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const handleSubmit = useCallback(async () => {
    if (uploadStatus === 'uploading') {
      return;
    }

    const data = getData();
    const check = computeSeoCheck(collectionSlug, data as Record<string, any>);

    if (!check) {
      await submit({});
      return;
    }

    changedFieldsRef.current = extractChangedFields(check.differences);

    const confirmPromise = new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
    openModal(drawerSlug);
    const confirmed = await confirmPromise;

    if (confirmed) {
      const currentData = getData();
      const existingMeta = ((currentData as any).meta as Record<string, any>) || {};
      const updatedMeta = {
        ...existingMeta,
        ...(check.differences.title ? { title: check.proposedMeta.title } : {}),
        ...(check.differences.description ? { description: check.proposedMeta.description } : {}),
        ...(check.differences.image ? { image: check.proposedMeta.image } : {}),
      };
      await submit({ overrides: { meta: updatedMeta } });
    } else {
      await submit({});
    }
  }, [uploadStatus, getData, collectionSlug, openModal, drawerSlug, submit]);

  useHotkey(
    { cmdCtrlKey: true, editDepth, keyCodes: ['s'] },
    (e) => {
      if (disabled) {
        // absorb the event
      }
      e.preventDefault();
      e.stopPropagation();
      if (ref?.current) {
        ref.current.click();
      }
    },
  );

  return (
    <>
      <FormSubmit
        buttonId="action-save"
        disabled={disabled}
        onClick={() => void handleSubmit()}
        ref={ref}
        size="medium"
        type="button"
      >
        {t('general:save')}
      </FormSubmit>
      <SeoConfirmModal
        slug="seo-confirm-save"
        changedFields={changedFieldsRef.current}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SeoPublishButton — for Posts/Projects (with drafts), replicates PublishButton
// ---------------------------------------------------------------------------

export function SeoPublishButton() {
  const {
    id,
    collectionSlug,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo();
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const { submit, getData } = useForm();
  const modified = useFormModified();
  const { code: localeCode } = useLocale();
  const { t } = useTranslation();

  const drawerSlug = useDrawerSlug('seo-confirm-publish');
  const { openModal, closeModal } = useModal();

  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const changedFieldsRef = useRef<Array<'title' | 'description' | 'image'>>([]);

  const canPublish =
    !!hasPublishPermission && (modified || !hasPublishedDoc) && uploadStatus !== 'uploading';

  const handleConfirm = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const handleSkip = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const handlePublish = useCallback(async () => {
    if (uploadStatus === 'uploading') {
      return;
    }

    const data = getData();
    const check = computeSeoCheck(collectionSlug, data as Record<string, any>);

    let seoOverrides: Record<string, any> | undefined;

    if (check) {
      changedFieldsRef.current = extractChangedFields(check.differences);

      const confirmPromise = new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
      openModal(drawerSlug);
      const confirmed = await confirmPromise;

      if (confirmed) {
        const currentData = getData();
        const existingMeta = ((currentData as any).meta as Record<string, any>) || {};
        seoOverrides = {
          meta: {
            ...existingMeta,
            ...(check.differences.title ? { title: check.proposedMeta.title } : {}),
            ...(check.differences.description ? { description: check.proposedMeta.description } : {}),
            ...(check.differences.image ? { image: check.proposedMeta.image } : {}),
          },
        };
      }
    }

    const params = qs.stringify({ depth: 0, locale: localeCode }, { addQueryPrefix: true });
    const pathSegment = globalSlug
      ? `/globals/${globalSlug}`
      : `/${collectionSlug}${id ? `/${id}` : ''}`;
    const action = formatAdminURL({
      apiRoute: api,
      path: `${pathSegment}${params}` as `/${string}`,
    });

    const result = await submit({
      action,
      overrides: {
        _status: 'published',
        ...(seoOverrides || {}),
      },
    });

    if (result) {
      setUnpublishedVersionCount(0);
      setMostRecentVersionIsAutosaved(false);
      setHasPublishedDoc(true);
    }
  }, [
    uploadStatus,
    getData,
    collectionSlug,
    openModal,
    drawerSlug,
    localeCode,
    api,
    globalSlug,
    id,
    submit,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    setHasPublishedDoc,
  ]);

  if (!hasPublishPermission) {
    return null;
  }

  return (
    <>
      <FormSubmit
        buttonId="action-save"
        disabled={!canPublish}
        onClick={() => void handlePublish()}
        size="medium"
        type="button"
      >
        {t('version:publishChanges')}
      </FormSubmit>
      <SeoConfirmModal
        slug="seo-confirm-publish"
        changedFields={changedFieldsRef.current}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SeoSaveDraftButton — for Posts/Projects (with drafts), replicates SaveDraftButton
// ---------------------------------------------------------------------------

export function SeoSaveDraftButton() {
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const {
    id,
    collectionSlug,
    globalSlug,
    setUnpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo();
  const modified = useFormModified();
  const { code: locale } = useLocale();
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();
  const { t } = useTranslation();
  const { submit, getData } = useForm();
  const operation = useOperation();

  const drawerSlug = useDrawerSlug('seo-confirm-draft');
  const { openModal, closeModal } = useModal();

  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const changedFieldsRef = useRef<Array<'title' | 'description' | 'image'>>([]);

  const disabled = (operation === 'update' && !modified) || uploadStatus === 'uploading';

  const handleConfirm = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const handleSkip = useCallback(() => {
    closeModal(drawerSlug);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, [closeModal, drawerSlug]);

  const saveDraft = useCallback(async () => {
    if (disabled) {
      return;
    }

    const data = getData();
    const check = computeSeoCheck(collectionSlug, data as Record<string, any>);

    let seoOverrides: Record<string, any> | undefined;

    if (check) {
      changedFieldsRef.current = extractChangedFields(check.differences);

      const confirmPromise = new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
      openModal(drawerSlug);
      const confirmed = await confirmPromise;

      if (confirmed) {
        const currentData = getData();
        const existingMeta = ((currentData as any).meta as Record<string, any>) || {};
        seoOverrides = {
          meta: {
            ...existingMeta,
            ...(check.differences.title ? { title: check.proposedMeta.title } : {}),
            ...(check.differences.description ? { description: check.proposedMeta.description } : {}),
            ...(check.differences.image ? { image: check.proposedMeta.image } : {}),
          },
        };
      }
    }

    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
    let action: string | undefined;
    let method: 'POST' | 'PATCH' = 'POST';

    if (collectionSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${id ? `/${id}` : ''}${search}`,
      });
      if (id) {
        method = 'PATCH';
      }
    }

    if (globalSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}${search}`,
      });
    }

    await submit({
      action,
      method,
      overrides: {
        _status: 'draft',
        ...(seoOverrides || {}),
      },
      skipValidation: true,
    });

    setUnpublishedVersionCount((count) => count + 1);
  }, [
    disabled,
    getData,
    collectionSlug,
    openModal,
    drawerSlug,
    locale,
    api,
    globalSlug,
    id,
    submit,
    setUnpublishedVersionCount,
  ]);

  useHotkey(
    { cmdCtrlKey: true, editDepth, keyCodes: ['s'] },
    (e) => {
      if (disabled) {
        // absorb the event
      }
      e.preventDefault();
      e.stopPropagation();
      if (ref?.current) {
        ref.current.click();
      }
    },
  );

  return (
    <>
      <FormSubmit
        buttonId="action-save-draft"
        buttonStyle="secondary"
        className="save-draft"
        disabled={disabled}
        onClick={() => void saveDraft()}
        ref={ref}
        size="medium"
        type="button"
      >
        {t('version:saveDraft')}
      </FormSubmit>
      <SeoConfirmModal
        slug="seo-confirm-draft"
        changedFields={changedFieldsRef.current}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    </>
  );
}
