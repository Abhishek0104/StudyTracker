import { Routes, Route } from "react-router-dom";
import { Sidebar, MobileHeader, MobileNav } from "./components/layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Curriculum } from "./pages/Curriculum";
import { Resources } from "./pages/Resources";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 pb-28 md:px-10 md:py-8 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
