import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import CoinsPage from "@/pages/coins/CoinsPage.tsx";
import RSIPage from "@/pages/analyses/RSIPage.tsx";
import CoinDetailPage from "@/pages/coins/CoinDetailPage.tsx";
import { CacheProvider } from "@/contexts/CacheContext";


const MAPage = () => <div>MA Sayfası</div>;
const AlarmsPage = () => <div>Alarmlar</div>;
const SettingsPage = () => <div>Ayarlar</div>;

function App() {
    return (
        <BrowserRouter>
            <CacheProvider>
                <AppLayout>
                    <Routes>
                        <Route path="/analyses/rsi" element={<RSIPage />} />
                        <Route path="/analyses/ma" element={<MAPage />} />
                        <Route path="/coins" element={<CoinsPage />} />
                        <Route path="/alarms" element={<AlarmsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/coins/:coinId" element={<CoinDetailPage />} />
                    </Routes>
                </AppLayout>
            </CacheProvider>
        </BrowserRouter>
    );
}

export default App
