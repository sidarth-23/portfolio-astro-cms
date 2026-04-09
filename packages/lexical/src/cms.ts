import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  LinkFeature,
  UploadFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

export const defaultLexicalEditor = lexicalEditor({
  features: ({ defaultFeatures }) => {
    return [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      HeadingFeature({
        enabledHeadingSizes: ["h1", "h2", "h3", "h4"],
      }),
      LinkFeature({
        enabledCollections: ["posts", "projects"],
      }),
      UploadFeature({
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
      }),
    ];
  },
});
