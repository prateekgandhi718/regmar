import Navbar from './_components/navbar'

const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-full dark:bg-dark-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-40 flex flex-col">{children}</main>
    </div>
  )
}

export default MarketingLayout
