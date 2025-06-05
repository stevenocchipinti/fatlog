const FullScreenLoading = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex h-screen items-center justify-center">
    <p className="text-lg text-gray-600">{children}</p>
  </div>
)

export default FullScreenLoading
