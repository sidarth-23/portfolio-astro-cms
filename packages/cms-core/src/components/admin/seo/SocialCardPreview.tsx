'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAllFormFields, useConfig, useDocumentInfo, useForm, useLocale } from '@payloadcms/ui';
import { reduceToSerializableFields } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';

type Props = {
  siteUrl?: string;
};

function toDisplayHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl;
  }
}

function getMediaId(imageValue: unknown): string | number | null {
  if (!imageValue) return null;
  if (typeof imageValue === 'string' || typeof imageValue === 'number') return imageValue;
  if (typeof imageValue === 'object' && imageValue !== null && 'id' in imageValue) {
    return (imageValue as { id: string | number }).id;
  }
  return null;
}

function getMediaUrl(imageValue: unknown): string | null {
  if (!imageValue) return null;
  if (typeof imageValue === 'object' && imageValue !== null && 'url' in imageValue) {
    const url = (imageValue as { url: unknown }).url;
    if (typeof url === 'string' && url) return url;
  }
  return null;
}

export function SocialCardPreview({ siteUrl }: Props) {
  const { config: { routes: { api }, serverURL } } = useConfig();
  const locale = useLocale();
  const [fields] = useAllFormFields();
  const { getData } = useForm();
  const docInfo = useDocumentInfo();

  const { 'meta.title': { value: metaTitle } = {}, 'meta.image': { value: metaImageValue } = {} } = fields as Record<string, { value: unknown }>;
  const metaDescription = (fields as Record<string, { value: unknown }>)['meta.description']?.value as string | undefined;

  const [href, setHref] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Track the last image ID we fetched so we don't re-fetch on unrelated field changes
  const lastFetchedImageId = useRef<string | number | null>(null);

  // Fetch the canonical URL for this document (same endpoint as the SERP preview)
  useEffect(() => {
    const endpoint = formatAdminURL({ apiRoute: api, path: '/plugin-seo/generate-url' });

    const fetchHref = async () => {
      const response = await fetch(endpoint, {
        body: JSON.stringify({
          id: docInfo.id,
          collectionSlug: docInfo.collectionSlug,
          doc: getData(),
          docPermissions: docInfo.docPermissions,
          globalSlug: docInfo.globalSlug,
          hasPublishPermission: docInfo.hasPublishPermission,
          hasSavePermission: docInfo.hasSavePermission,
          initialData: docInfo.initialData,
          initialState: reduceToSerializableFields(docInfo.initialState ?? {}),
          locale: typeof locale === 'object' ? locale?.code : locale,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const { result } = await response.json() as { result: string };
      if (result) setHref(result);
    };

    void fetchHref();
    // Re-fetch when the document slug changes (via form field changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(fields as Record<string, { value: unknown }>)['slug']?.value]);

  // Resolve the OG image URL from the meta.image field
  useEffect(() => {
    // First try: the value might already be a populated media object with a url
    const directUrl = getMediaUrl(metaImageValue);
    if (directUrl) {
      setImageUrl(directUrl.startsWith('http') ? directUrl : `${serverURL}${directUrl}`);
      return;
    }

    // Second try: the initialData might have a populated media object
    const initialImage = (docInfo.initialData as { meta?: { image?: unknown } } | undefined)?.meta?.image;
    const initialUrl = getMediaUrl(initialImage);
    if (initialUrl) {
      setImageUrl(initialUrl.startsWith('http') ? initialUrl : `${serverURL}${initialUrl}`);
    }

    // Third try: we have just an ID — fetch the media doc
    const imageId = getMediaId(metaImageValue) ?? getMediaId(initialImage);
    if (imageId && imageId !== lastFetchedImageId.current) {
      lastFetchedImageId.current = imageId;
      const fetchImage = async () => {
        const res = await fetch(
          formatAdminURL({ apiRoute: api, path: `/media/${imageId}` as `/${string}` }),
          { credentials: 'include' },
        );
        if (!res.ok) return;
        const data = await res.json() as { url?: string };
        if (data.url) {
          setImageUrl(data.url.startsWith('http') ? data.url : `${serverURL}${data.url}`);
        }
      };
      void fetchImage();
    } else if (!imageId) {
      setImageUrl(null);
      lastFetchedImageId.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaImageValue, docInfo.initialData]);

  const displayHost = siteUrl ? toDisplayHost(siteUrl) : (href ? toDisplayHost(href) : '');
  const displayTitle = metaTitle as string | undefined;
  const displayUrl = href ?? (siteUrl || '');

  return (
    <div style={{ marginBottom: '20px' }}>
      <div>Social Card Preview</div>
      <div style={{ color: '#9A9A9A', marginBottom: '5px' }}>
        How your link appears when shared in Teams, Slack, Discord, etc.
      </div>

      {/* Card container — styled like a real social unfurl */}
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          borderRadius: '8px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.15)',
          maxWidth: '520px',
          overflow: 'hidden',
          pointerEvents: 'none',
          width: '100%',
          border: '1px solid var(--theme-elevation-100)',
        }}
      >
        {/* OG image at top — only rendered when an image exists */}
        {imageUrl ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '1200 / 630',
              overflow: 'hidden',
              background: 'var(--theme-elevation-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        ) : (
          /* Placeholder when no image is set */
          <div
            style={{
              width: '100%',
              aspectRatio: '1200 / 630',
              background: 'var(--theme-elevation-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--theme-text-subtle, #9A9A9A)',
              fontSize: '13px',
            }}
          >
            No OG image set
          </div>
        )}

        {/* Text content area */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {displayHost && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--theme-text-subtle, #9A9A9A)',
              }}
            >
              {displayHost}
            </div>
          )}

          {displayTitle ? (
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--theme-text)',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {displayTitle}
            </div>
          ) : (
            <div style={{ fontSize: '15px', color: 'var(--theme-text-subtle, #9A9A9A)', fontStyle: 'italic' }}>
              No title set
            </div>
          )}

          {metaDescription ? (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--theme-text-subtle, #9A9A9A)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {metaDescription}
            </div>
          ) : null}
        </div>
      </div>

      {/* Shown URL below card, similar to Teams */}
      {displayUrl && (
        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--theme-text-subtle, #9A9A9A)' }}>
          {displayUrl}
        </div>
      )}
    </div>
  );
}
