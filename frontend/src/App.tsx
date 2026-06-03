import { Navigate, Route, Routes } from "react-router-dom";
import { InstallPrompt } from "./components/InstallPrompt";
import { AdminPaterPage } from "./pages/AdminPaterPage";
import { ChatPage } from "./pages/ChatPage";
import { MessagesListPage } from "./pages/MessagesListPage";
import { OwnerChatPage } from "./pages/OwnerChatPage";
import { PaymentCheckoutPage } from "./pages/PaymentCheckoutPage";
import { PaymentMethodsPage } from "./pages/PaymentMethodsPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PaymentsTabPage } from "./pages/PaymentsTabPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SplashPage } from "./pages/SplashPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/adminpater" element={<AdminPaterPage />} />
        <Route path="/login" element={<Navigate to="/adminpater" replace />} />
        <Route path="/messages" element={<MessagesListPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/owner/chat/:id" element={<OwnerChatPage />} />
        <Route path="/payment/methods" element={<PaymentMethodsPage />} />
        <Route path="/payment/checkout" element={<PaymentCheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payments" element={<PaymentsTabPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/connect" element={<Navigate to="/profile" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}
