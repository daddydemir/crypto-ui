import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import CoinsPage from "@/pages/coins/CoinsPage.tsx";

const RSIPage = () => <div>RSI Sayfası</div>;
const MAPage = () => <div>MA Sayfası</div>;
const AlarmsPage = () => <div>Alarmlar</div>;
const SettingsPage = () => <div>Ayarlar</div>;

function App() {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/analyses/rsi" element={<RSIPage />} />
                    <Route path="/analyses/ma" element={<MAPage />} />
                    <Route path="/coins" element={<CoinsPage />} />
                    <Route path="/alarms" element={<AlarmsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}

export default App
