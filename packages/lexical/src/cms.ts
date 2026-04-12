import {
  AlignFeature,
  BlocksFeature,
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  FixedToolbarFeature,
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
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

type HeadingSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type LinkFeatureOptions = NonNullable<Parameters<typeof LinkFeature>[0]>;
type RelationshipFeatureOptions = NonNullable<Parameters<typeof RelationshipFeature>[0]>;
type UploadFeatureOptions = NonNullable<Parameters<typeof UploadFeature>[0]>;

type LinkSettings = {
  enabledCollections?: LinkFeatureOptions extends { enabledCollections?: infer T } ? T : never;
};

type RelationshipSettings = {
  enabledCollections?: RelationshipFeatureOptions extends { enabledCollections?: infer T } ? T : never;
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
  link?: LinkSettings;
  relationship?: RelationshipSettings;
  upload?: UploadSettings;
};

type VariantDefaults = Omit<LexicalEditorOptions, "variant">;

const DEFAULT_LINK_COLLECTIONS = ["posts", "projects"] as LinkSettings["enabledCollections"];
const DEFAULT_RELATIONSHIP_COLLECTIONS = ["posts", "projects"] as RelationshipSettings["enabledCollections"];
const DEFAULT_UPLOAD_COLLECTIONS = ["media"] as UploadSettings["enabledCollections"];

const DEFAULT_VARIANT_OPTIONS: Record<LexicalEditorVariant, VariantDefaults> = {
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
    enabledHeadingSizes: [],
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
    enabledHeadingSizes: [],
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
    enabledHeadingSizes: ["h2", "h3", "h4"],
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

const createLinkFeature = ({ enabledCollections }: LinkSettings = {}) => {
  return LinkFeature({ enabledCollections: enabledCollections ?? DEFAULT_LINK_COLLECTIONS });
};

const createRelationshipFeature = ({ enabledCollections }: RelationshipSettings = {}) => {
  return RelationshipFeature({ enabledCollections: enabledCollections ?? DEFAULT_RELATIONSHIP_COLLECTIONS });
};

const createUploadFeature = ({ enabledCollections }: UploadSettings = {}) => {
  return UploadFeature({
    enabledCollections: enabledCollections ?? DEFAULT_UPLOAD_COLLECTIONS,
    collections: {
      media: {
        fields: [
          {
            name: "caption",
            type: "text",
            required: false,
          },
        ],
      },
    },
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

const createCodeBlock = (): any => ({
  slug: "Code",
  interfaceName: "LexicalCodeBlock",
  labels: { singular: "Code", plural: "Code" },
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

const createCalloutBlock = (profile: CalloutVariantProfile): any => {
  return {
    slug: "callout",
    interfaceName: "LexicalCalloutBlock",
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
  } as const;
};

export const createLexicalEditor = ({ variant, ...overrides }: LexicalEditorOptions): any => {
  const variantDefaults = DEFAULT_VARIANT_OPTIONS[variant];
  const options = {
    ...variantDefaults,
    ...overrides,
    enabledHeadingSizes: overrides.enabledHeadingSizes ?? variantDefaults.enabledHeadingSizes,
  };

  return lexicalEditor({
    features: (): any[] => {
      const features: any[] = [...createBaseTextFeatures()];

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

      const lexicalBlocks: any[] = [];

      if (options.enableCodeBlock) {
        lexicalBlocks.push(createCodeBlock());
      }

      if (options.enableCallout) {
        lexicalBlocks.push(createCalloutBlock(options.calloutVariantProfile ?? "generic"));
      }

      if (lexicalBlocks.length > 0) {
        features.push(
          BlocksFeature({
            blocks: lexicalBlocks,
          }),
        );
      }

      features.push(SubscriptFeature(), SuperscriptFeature());

      return features;
    },
  });
};

export const createMinimalRichTextEditor = (options: Omit<LexicalEditorOptions, "variant"> = {}): any => {
  return createLexicalEditor({
    variant: "minimal",
    ...options,
  });
};

export const createBasicRichTextEditor = (options: Omit<LexicalEditorOptions, "variant"> = {}): any => {
  return createLexicalEditor({
    variant: "basic",
    ...options,
  });
};

export const createDocumentRichTextEditor = (options: Omit<LexicalEditorOptions, "variant"> = {}): any => {
  return createLexicalEditor({
    variant: "document",
    ...options,
  });
};
