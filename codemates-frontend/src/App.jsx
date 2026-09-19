import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      {/* your existing providers (QueryClientProvider, etc.) go around this */}
    </BrowserRouter>
  );
}