import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileScan, BrainCircuit, CheckCircle2, ArrowRight, ShieldCheck, Zap, Database } from 'lucide-react'

export default function Home() {
  return (
    <div suppressHydrationWarning className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black overflow-hidden">
      
      {/* Navbar */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b bg-white/50 backdrop-blur-md dark:bg-black/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-xl tracking-tight">LandGuard AI</span>
        </div>
        <nav className="flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-indigo-600 transition-colors" href="/dashboard">
            Dashboard
          </Link>
          <Link href="/documents/new">
            <Button className="rounded-full shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Try Live Demo
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-48 flex flex-col items-center text-center px-4 relative">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            SIH26018 — Smart India Hackathon
          </div>
          
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Intelligent <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Land Record Digitization
            </span>
          </h1>
          
          <p className="max-w-2xl mt-8 text-lg md:text-xl leading-relaxed text-zinc-600 dark:text-zinc-400 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            Automating the extraction, translation, and verification of legacy land records using advanced Multimodal AI (Gemini 1.5 Flash). Eliminating manual data entry and ensuring absolute accuracy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link href="/documents/new">
              <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:-translate-y-1 w-full sm:w-auto">
                Upload Document <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full transition-all hover:-translate-y-1 bg-white/50 dark:bg-black/50 backdrop-blur-sm w-full sm:w-auto">
                View Admin Dashboard
              </Button>
            </Link>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="w-full py-24 bg-zinc-100/50 dark:bg-zinc-900/50 border-y px-6 lg:px-14 flex flex-col items-center relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">A seamless 3-step process from physical paper to verified database.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl w-full">
            {/* Step 1 */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white dark:bg-zinc-950 border shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 duration-300">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileScan className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Secure Upload</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Ingest scanned PDFs or images of legacy land records into our secure, scalable Supabase storage bucket.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white dark:bg-zinc-950 border shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 duration-300 relative">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BrainCircuit className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Extraction</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Gemini 1.5 Flash instantly analyzes the document, extracting key fields (owner, area, dates) across multiple regional languages.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white dark:bg-zinc-950 border shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 duration-300">
              <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Officer Verification</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                A verification officer reviews the extracted data against the original document side-by-side on the admin dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section className="w-full py-24 px-6 lg:px-14 flex flex-col items-center">
          <div className="grid gap-8 sm:grid-cols-3 max-w-5xl w-full text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-2">
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
              <h4 className="text-4xl font-extrabold">10x</h4>
              <p className="font-medium text-zinc-600 dark:text-zinc-400">Faster Processing</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-2">
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="text-4xl font-extrabold">99%</h4>
              <p className="font-medium text-zinc-600 dark:text-zinc-400">Extraction Accuracy</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-2">
                <Database className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="text-4xl font-extrabold">100%</h4>
              <p className="font-medium text-zinc-600 dark:text-zinc-400">Cloud Scalable</p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>Built with Next.js, Supabase, Tailwind CSS, and Google Gemini AI.</p>
      </footer>
    </div>
  )
}
