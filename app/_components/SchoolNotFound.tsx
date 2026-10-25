export default function SchoolNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        School not found
      </h1>
      <p className="mt-4 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find a school at this address. Check the link for
        typos, or contact the school for its current website.
      </p>
      <a
        href="https://edusaas.africa"
        className="mt-8 flex h-12 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Go to EduSaaS Africa
      </a>
    </div>
  );
}
