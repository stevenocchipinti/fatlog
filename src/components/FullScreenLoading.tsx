import { Spinner } from "./LoadingState"

const FullScreenLoading = ({ children }: { children?: React.ReactNode }) => (
  <div
    role="status"
    className="flex h-screen flex-col items-center justify-center gap-3"
  >
    <Spinner className="size-8 text-gray-400" />
    <p className="text-lg text-gray-600">{children}</p>
  </div>
)

export default FullScreenLoading
