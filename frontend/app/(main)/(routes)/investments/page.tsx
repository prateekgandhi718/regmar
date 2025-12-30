const InvestmentsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center space-y-4">
      <div className="bg-secondary/30 h-24 w-24 rounded-4xl flex items-center justify-center mx-auto border border-border/50">
         <span className="text-4xl">📈</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-primary dark:text-white">Investments</h1>
        <p className="text-muted-foreground font-medium max-w-[250px] mx-auto text-sm leading-relaxed">
          Track your stocks, mutual funds, and assets in one place. coming soon.
        </p>
      </div>
    </div>
  )
}

export default InvestmentsPage

