// Shared school site route. Never visited directly: proxy.ts rewrites
// <slug>.edusaas.africa (and active custom domains) here.
// TODO: fetch the school's SchoolProfile + content_blocks from the Django API
// and call notFound() when no school has this slug.
export default async function SchoolHome({
  params,
}: PageProps<"/sites/[slug]">) {
  const { slug } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        School site
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {slug}
      </h1>
      <p className="mt-4 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Placeholder for this school&apos;s site template.
      </p>
    </div>
  );
}
