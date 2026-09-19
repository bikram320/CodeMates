export default function Landing() {
	return (
		<main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
			<p className="font-[var(--cm-font-mono)] text-sm text-[var(--cm-lavender)]">
				CODEMATES
			</p>
			<h1 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--cm-text)] sm:text-6xl">
				Build better projects together.
			</h1>
			<p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--cm-text-dim)]">
				Find collaborators, form a team, and ship meaningful work together.
			</p>
		</main>
	);
}
