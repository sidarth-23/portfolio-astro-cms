import {
  AlignFeature,
  BlocksFeature,
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  CodeBlock as PremadeCodeBlock,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  type FeatureProviderServer,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  createServerFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { HIGHLIGHT } from "@payloadcms/richtext-lexical/lexical/markdown";
import type { Block } from "payload";

type HeadingSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type LinkFeatureOptions = NonNullable<Parameters<typeof LinkFeature>[0]>;
type RelationshipFeatureOptions = NonNullable<Parameters<typeof RelationshipFeature>[0]>;
type UploadFeatureOptions = NonNullable<Parameters<typeof UploadFeature>[0]>;

type LinkSettings = {
  enabledCollections?: LinkFeatureOptions extends { enabledCollections?: infer T } ? T : never;
};

type RelationshipSettings = {
  enabledCollections?: RelationshipFeatureOptions extends { enabledCollections?: infer T }
    ? T
    : never;
};

type UploadSettings = {
  enabledCollections?: UploadFeatureOptions extends { enabledCollections?: infer T } ? T : never;
};

export type LexicalEditorVariant = "minimal" | "basic" | "document";
export type CalloutVariantProfile = "generic" | "blog";

export type LexicalEditorOptions = {
  variant: LexicalEditorVariant;
  enabledHeadingSizes?: HeadingSize[];
  enableFixedToolbar?: boolean;
  enableInlineToolbar?: boolean;
  enableLinks?: boolean;
  enableUploads?: boolean;
  enableRelationships?: boolean;
  enableLists?: boolean;
  enableChecklist?: boolean;
  enableAlignment?: boolean;
  enableIndent?: boolean;
  enableBlockquote?: boolean;
  enableHorizontalRule?: boolean;
  enableCodeBlock?: boolean;
  enableCallout?: boolean;
  calloutVariantProfile?: CalloutVariantProfile;
  enableImageGallery?: boolean;
  enableTables?: boolean;
  enableEmoji?: boolean;
  enableFootnotes?: boolean;
  enableMarkdownPaste?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraFeatures?: FeatureProviderServer<any, any, any>[];
  link?: LinkSettings;
  relationship?: RelationshipSettings;
  upload?: UploadSettings;
};

type VariantDefaults = Omit<LexicalEditorOptions, "variant">;

const DEFAULT_LINK_COLLECTIONS = ["posts", "projects"] as LinkSettings["enabledCollections"];
const DEFAULT_RELATIONSHIP_COLLECTIONS = [
  "posts",
  "projects",
] as RelationshipSettings["enabledCollections"];
const DEFAULT_UPLOAD_COLLECTIONS = ["media"] as UploadSettings["enabledCollections"];

export const DEFAULT_VARIANT_OPTIONS: Record<LexicalEditorVariant, VariantDefaults> = {
  minimal: {
    enableFixedToolbar: true,
    enableInlineToolbar: true,
    enableLinks: true,
    enableUploads: false,
    enableRelationships: false,
    enableLists: false,
    enableChecklist: false,
    enableAlignment: false,
    enableIndent: false,
    enableBlockquote: false,
    enableHorizontalRule: false,
    enableCodeBlock: false,
    enableCallout: false,
    calloutVariantProfile: "generic",
    enableImageGallery: false,
    enabledHeadingSizes: [],
    enableEmoji: true,
    enableFootnotes: false,
    enableMarkdownPaste: false,
  },
  basic: {
    enableFixedToolbar: true,
    enableInlineToolbar: true,
    enableLinks: true,
    enableUploads: false,
    enableRelationships: false,
    enableLists: true,
    enableChecklist: false,
    enableAlignment: false,
    enableIndent: false,
    enableBlockquote: true,
    enableHorizontalRule: false,
    enableCodeBlock: true,
    enableCallout: false,
    calloutVariantProfile: "generic",
    enableImageGallery: false,
    enabledHeadingSizes: [],
    enableEmoji: true,
    enableFootnotes: false,
    enableMarkdownPaste: false,
  },
  document: {
    enableFixedToolbar: true,
    enableInlineToolbar: true,
    enableLinks: true,
    enableUploads: true,
    enableRelationships: true,
    enableLists: true,
    enableChecklist: true,
    enableAlignment: true,
    enableIndent: true,
    enableBlockquote: true,
    enableHorizontalRule: true,
    enableCodeBlock: true,
    enableCallout: false,
    calloutVariantProfile: "generic",
    enableImageGallery: true,
    enableTables: true,
    enabledHeadingSizes: ["h2", "h3", "h4"],
    enableEmoji: true,
    enableFootnotes: true,
    enableMarkdownPaste: true,
  },
};

const CALLOUT_VARIANTS_BY_PROFILE: Record<CalloutVariantProfile, Record<string, string>> = {
  generic: {
    neutral: "Neutral",
    info: "Info",
    success: "Success",
    warning: "Warning",
    danger: "Danger",
  },
  blog: {
    note: "Note",
    tip: "Tip",
    warning: "Warning",
    danger: "Danger",
  },
};

const defaultCalloutVariantByProfile: Record<CalloutVariantProfile, string> = {
  generic: "neutral",
  blog: "note",
};

const CODE_BLOCK_LANGUAGES = {
  plaintext: "Plain Text",
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  python: "Python",
  go: "Go",
  rust: "Rust",
} as const;

const CODE_LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  py: "python",
  rs: "rust",
  htm: "html",
};

const resolveCodeLanguage = (lang?: string): string => {
  if (!lang) return "plaintext";
  const lower = lang.toLowerCase();
  if (lower in CODE_BLOCK_LANGUAGES) return lower;
  return CODE_LANGUAGE_ALIASES[lower] ?? "plaintext";
};

const asNonEmptyString = (value: unknown): null | string => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveRelationID = (value: unknown): null | string => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "object") {
    const candidate = value as { id?: unknown; value?: unknown };
    if (candidate.id !== undefined) {
      return resolveRelationID(candidate.id);
    }
    if (candidate.value !== undefined) {
      return resolveRelationID(candidate.value);
    }
  }

  return null;
};

const collectUploadMediaIDs = (node: unknown, output: Set<string>) => {
  if (!node || typeof node !== "object") {
    return;
  }

  const typedNode = node as {
    children?: unknown[];
    relationTo?: unknown;
    type?: unknown;
    value?: unknown;
  };

  if (typedNode.type === "upload" && typedNode.relationTo === "media") {
    const mediaID = resolveRelationID(typedNode.value);
    if (mediaID) {
      output.add(mediaID);
    }
  }

  if (Array.isArray(typedNode.children)) {
    for (const child of typedNode.children) {
      collectUploadMediaIDs(child, output);
    }
  }
};

const createLinkFeature = ({ enabledCollections }: LinkSettings = {}) => {
  return LinkFeature({ enabledCollections: enabledCollections ?? DEFAULT_LINK_COLLECTIONS });
};

const createRelationshipFeature = ({ enabledCollections }: RelationshipSettings = {}) => {
  return RelationshipFeature({
    enabledCollections: enabledCollections ?? DEFAULT_RELATIONSHIP_COLLECTIONS,
  });
};

const createUploadFeature = ({ enabledCollections }: UploadSettings = {}) => {
  return UploadFeature({
    enabledCollections: enabledCollections ?? DEFAULT_UPLOAD_COLLECTIONS,
  });
};

const createBaseTextFeatures = () => {
  return [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
  ];
};

const createCodeBlock = (): Block => ({
  slug: "Code",
  interfaceName: "LexicalCodeBlock",
  labels: { singular: "Code", plural: "Code" },
  jsx: {
    ...PremadeCodeBlock().jsx!,
    import: ({ children, openMatch }) => ({
      mode: "single",
      language: resolveCodeLanguage(openMatch?.[1]),
      code: children,
    }),
    export: ({ fields }) => {
      if (fields.mode !== "single") return false;
      return "```" + (fields.language ?? "") + "\n" + (fields.code ?? "") + "\n```";
    },
  },
  fields: [
    {
      name: "mode",
      type: "select",
      required: true,
      defaultValue: "single",
      options: [
        { label: "Single", value: "single" },
        { label: "Multiple (Tabs)", value: "multiple" },
      ],
    },
    {
      name: "language",
      type: "select",
      required: true,
      defaultValue: "typescript",
      options: Object.entries(CODE_BLOCK_LANGUAGES).map(([key, value]) => ({
        label: value,
        value: key,
      })),
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode !== "multiple",
      },
    },
    {
      name: "code",
      type: "code",
      required: true,
      label: false,
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode !== "multiple",
        components: {
          Field: {
            clientProps: { languages: CODE_BLOCK_LANGUAGES },
            path: "./components/admin/CodeFieldComponent#CodeFieldComponent",
          },
        },
      },
    },
    {
      name: "entries",
      type: "array",
      minRows: 2,
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode === "multiple",
        components: {
          RowLabel: {
            path: "./components/admin/rowLabels/CodeEntryRowLabel#CodeEntryRowLabel",
          },
        },
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Tab Name",
        },
        {
          name: "language",
          type: "select",
          required: true,
          defaultValue: "typescript",
          options: Object.entries(CODE_BLOCK_LANGUAGES).map(([key, value]) => ({
            label: value,
            value: key,
          })),
        },
        {
          name: "code",
          type: "code",
          required: true,
          label: false,
        },
      ],
    },
    {
      name: "caption",
      type: "text",
      required: false,
      label: "Caption (optional)",
    },
  ],
});

const createImageGalleryBlock = (): Block => ({
  slug: "imageGallery",
  interfaceName: "LexicalImageGalleryBlock",
  labels: { singular: "Image Gallery", plural: "Image Galleries" },
  jsx: {
    export: ({ fields }) => {
      const imageRows = Array.isArray(fields.images)
        ? (fields.images as Array<{ image?: unknown }>)
        : [];
      const imageIDs = imageRows
        .map((row) => resolveRelationID(row?.image))
        .filter((value): value is string => value !== null);

      const children = imageIDs.map((id) => `![media:${id}]()`).join("\n");
      const props: { caption?: string } = {};
      const caption = asNonEmptyString(fields.caption);
      if (caption) {
        props.caption = caption;
      }

      return {
        children,
        props,
      };
    },
    import: ({ children, markdownToLexical, props }) => {
      const lexical = markdownToLexical({ markdown: children ?? "" }) as {
        root?: { children?: unknown[] };
      };
      const mediaIDs = new Set<string>();
      collectUploadMediaIDs(lexical.root, mediaIDs);

      return {
        caption: asNonEmptyString(props?.caption) ?? undefined,
        images: Array.from(mediaIDs).map((id) => ({ image: id })),
      };
    },
  },
  fields: [
    {
      name: "images",
      type: "array",
      label: "Images",
      minRows: 2,
      required: true,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "caption",
      type: "text",
      required: false,
      label: "Gallery Caption (optional)",
    },
  ],
});

const createCalloutBlock = (profile: CalloutVariantProfile): Block => {
  return {
    slug: "callout",
    interfaceName: "LexicalCalloutBlock",
    jsx: {
      export: ({ fields, lexicalToMarkdown }) => {
        const props: { title?: string; variant?: string } = {};
        const variant = asNonEmptyString(fields.variant);
        if (variant) {
          props.variant = variant;
        }

        const title = asNonEmptyString(fields.title);
        if (title) {
          props.title = title;
        }

        return {
          children: lexicalToMarkdown({ editorState: fields.content }),
          props,
        };
      },
      import: ({ children, markdownToLexical, props }) => {
        return {
          content: markdownToLexical({ markdown: children ?? "" }),
          title: asNonEmptyString(props?.title) ?? undefined,
          variant: asNonEmptyString(props?.variant) ?? defaultCalloutVariantByProfile[profile],
        };
      },
    },
    fields: [
      {
        name: "variant",
        type: "select",
        required: true,
        defaultValue: defaultCalloutVariantByProfile[profile],
        options: Object.entries(CALLOUT_VARIANTS_BY_PROFILE[profile]).map(([value, label]) => ({
          label,
          value,
        })),
      },
      {
        name: "title",
        type: "text",
        required: false,
      },
      {
        name: "content",
        type: "richText",
        required: true,
        editor: createMinimalRichTextEditor(),
      },
    ],
  };
};

// Registers markdown transformers for text formats that Payload ships without them.
// Superscript/SubscriptFeature handle the editor UI; this feature adds the markdown syntax.
// HIGHLIGHT is built into @lexical/markdown — Payload just doesn't register it.
const extendedMarkdownTransformersFeature = createServerFeature({
  feature: {
    markdownTransformers: [
      { type: "text-format", format: ["superscript"], tag: "^" },
      { type: "text-format", format: ["subscript"], tag: "~" },
      { type: "text-format", format: ["underline"], tag: "++" },
      HIGHLIGHT,
    ],
  },
  key: "extended-markdown-transformers",
});

export const createLexicalEditor = ({
  variant,
  ...overrides
}: LexicalEditorOptions): ReturnType<typeof lexicalEditor> => {
  const variantDefaults = DEFAULT_VARIANT_OPTIONS[variant];
  const options = {
    ...variantDefaults,
    ...overrides,
    enabledHeadingSizes: overrides.enabledHeadingSizes ?? variantDefaults.enabledHeadingSizes,
  };

  return lexicalEditor({
    features: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features: FeatureProviderServer<any, any, any>[] = [...createBaseTextFeatures()];

      if (options.enableInlineToolbar) {
        features.push(InlineToolbarFeature());
      }

      if (options.enableFixedToolbar) {
        features.push(FixedToolbarFeature());
      }

      if ((options.enabledHeadingSizes?.length ?? 0) > 0) {
        features.push(
          HeadingFeature({
            enabledHeadingSizes: options.enabledHeadingSizes,
          }),
        );
      }

      if (options.enableLists) {
        features.push(UnorderedListFeature(), OrderedListFeature());
      }

      if (options.enableChecklist) {
        features.push(ChecklistFeature());
      }

      if (options.enableAlignment) {
        features.push(AlignFeature());
      }

      if (options.enableIndent) {
        features.push(IndentFeature());
      }

      if (options.enableLinks) {
        features.push(createLinkFeature(options.link));
      }

      if (options.enableRelationships) {
        features.push(createRelationshipFeature(options.relationship));
      }

      if (options.enableUploads) {
        features.push(createUploadFeature(options.upload));
      }

      if (options.enableBlockquote) {
        features.push(BlockquoteFeature());
      }

      if (options.enableHorizontalRule) {
        features.push(HorizontalRuleFeature());
      }

      const lexicalBlocks: Block[] = [];

      if (options.enableCodeBlock) {
        lexicalBlocks.push(createCodeBlock());
      }

      if (options.enableCallout) {
        lexicalBlocks.push(createCalloutBlock(options.calloutVariantProfile ?? "generic"));
      }

      if (options.enableImageGallery) {
        lexicalBlocks.push(createImageGalleryBlock());
      }

      if (lexicalBlocks.length > 0) {
        features.push(
          BlocksFeature({
            blocks: lexicalBlocks,
          }),
        );
      }

      if (options.enableTables) {
        features.push(EXPERIMENTAL_TableFeature());
      }

      features.push(
        SubscriptFeature(),
        SuperscriptFeature(),
        extendedMarkdownTransformersFeature(),
      );

      if (options.extraFeatures?.length) {
        features.push(...options.extraFeatures);
      }

      return features;
    },
  });
};

export const createMinimalRichTextEditor = (
  options: Omit<LexicalEditorOptions, "variant"> = {},
): ReturnType<typeof lexicalEditor> => {
  return createLexicalEditor({
    variant: "minimal",
    ...options,
  });
};

export const createBasicRichTextEditor = (
  options: Omit<LexicalEditorOptions, "variant"> = {},
): ReturnType<typeof lexicalEditor> => {
  return createLexicalEditor({
    variant: "basic",
    ...options,
  });
};

export const createDocumentRichTextEditor = (
  options: Omit<LexicalEditorOptions, "variant"> = {},
): ReturnType<typeof lexicalEditor> => {
  return createLexicalEditor({
    variant: "document",
    ...options,
  });
};
