export default function LoadingScreen() {
  return (
    <div role="status" aria-label="Loading BookPotato" className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="text-center text-white">
        <div aria-hidden="true" className="w-16 h-16 border-4 border-white border-b-transparent rounded-full motion-safe:animate-spin mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">BookPotato</h1>
        <p className="text-lg text-white/90">Community Library</p>
      </div>
    </div>
  );
}
