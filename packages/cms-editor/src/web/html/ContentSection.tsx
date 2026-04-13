/** @jsxImportSource preact */

type Props = {
  title?: string | null;
  contentHtml: string;
};

export function ContentSection({ title, contentHtml }: Props) {
  return (
    <section>
      {title && <h2 class="text-3xl w-full font-bold mb-4">{title}</h2>}
      <div class="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </section>
  );
}
