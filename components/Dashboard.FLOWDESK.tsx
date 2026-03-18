export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flowdesk</h1>
          <p className="text-zinc-500 mt-1">Your autonomous command center</p>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Agents */}
        <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm text-zinc-400 mb-4">Agent status</h2>
          <div className="space-y-3">
            {["Trend", "Script", "Video", "Voice", "Upload", "Sales"].map(
              (agent) => (
                <div key={agent} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">{agent} agent</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    idle
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm text-zinc-400 mb-4">Content pipeline</h2>
          <div className="flex flex-wrap gap-2">
            {["Trend", "Hook", "Script", "Video", "Voice", "Upload"].map(
              (step) => (
                <span
                  key={step}
                  className="text-xs px-3 py-1 rounded-full border border-zinc-700 text-zinc-400"
                >
                  {step}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Stats */}
        {[
          { label: "Videos denna vecka", value: "0" },
          { label: "Affiliate intäkter", value: "$0" },
          { label: "Aktiva flöden", value: "0" },
          { label: "Screen recordings", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-6"
          >
            <p className="text-xs text-zinc-500 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
