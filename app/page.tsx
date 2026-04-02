import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">

      <div className="max-w-2xl w-full text-center">
        {/* Ornamental flourish */}
        <div className="flex items-center justify-center gap-4 mb-6 text-amber-700 select-none">
          <span className="text-2xl">⚔</span>
          <span className="h-px w-24 bg-amber-800" />
          <span className="text-2xl">☠</span>
          <span className="h-px w-24 bg-amber-800" />
          <span className="text-2xl">⚔</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl text-gray-100 leading-tight mb-4">
          WFRP 4e
          <br />
          <span className="text-amber-500">Character Generator</span>
        </h1>

        <p className="text-gray-400 text-lg mb-3 italic font-serif">
          &ldquo;Fortune favours the bold. The Old World favours neither.&rdquo;
        </p>

        <p className="text-gray-400 text-sm mb-10">
          Create, manage, and doom your characters in the grim darkness of the
          Warhammer Fantasy world.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" href="/character/new" className="w-full sm:w-auto text-base px-8 py-3">
            Create New Character
          </Button>
          <Button variant="secondary" href="/characters" className="w-full sm:w-auto text-base px-8 py-3">
            Browse Characters
          </Button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-6 text-gray-400 text-xs uppercase tracking-widest">
          <span>Grim</span>
          <span className="text-amber-800">·</span>
          <span>Dark</span>
          <span className="text-amber-800">·</span>
          <span>Yours</span>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-900 to-transparent" />
    </main>
  );
}

