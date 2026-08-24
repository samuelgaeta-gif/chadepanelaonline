import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import EventGuests from "./pages/EventGuests";
import EventGifts from "./pages/EventGifts";
import EventMessages from "./pages/EventMessages";
import EventInvite from "./pages/EventInvite";
import RegistryGuest from "./pages/RegistryGuest";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import AdsLanding from "./pages/AdsLanding";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/Footer";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/perguntas-frequentes" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/event/create" element={<CreateEvent />} />
              <Route path="/event/:eventId/manage" element={<EventDetails />} />
              <Route path="/event/:eventId/guests" element={<EventGuests />} />
              <Route path="/event/:eventId/gifts" element={<EventGifts />} />
              <Route path="/event/:eventId/messages" element={<EventMessages />} />
              <Route path="/event/:eventId/invite" element={<EventInvite />} />
              <Route path="/event/:eventId" element={<RegistryGuest />} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
              <Route path="/gerencia" element={<Admin />} />
              <Route path="/cadastro" element={<AdsLanding />} />

            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
