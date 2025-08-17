import { GeneratorForm } from '@/components/generator/generator-form'

export default function GeneratorPage() {
  return (
    <main className="container flex flex-1 flex-col items-center gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="w-full max-w-2xl">
        <GeneratorForm />
      </div>
    </main>
  )
}
