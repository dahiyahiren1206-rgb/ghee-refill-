import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import SearchPage from "@/pages/Search";
import Watch from "@/pages/Watch";
import Papers from "@/pages/Papers";
import Contribute from "@/pages/Contribute";
import Chat from "@/pages/Chat";
import { ShapePhysics } from "@/components/shape-physics";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <div className="flex min-h-svh flex-col text-zinc-900">
       <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
     <ShapePhysics height="100%" background="#ffffff" interactive={false} />
   </div>
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
