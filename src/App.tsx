import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout.tsx";
import CoinsPage from "@/pages/coins/CoinsPage.tsx";
import RSIPage from "@/pages/analyses/RSIPage.tsx";
import CoinDetailPage from "@/pages/coins/CoinDetailPage.tsx";
import { CacheProvider } from "@/contexts/CacheContext";
import MovingAveragePage from './pages/analyses/MovingAveragePage';
import BollingerBandsPage from '@/pages/analyses/BollingerBandsPage';
import ExponentialMAPage from "@/pages/analyses/ExponentialMAPage.tsx";
import AlarmsPage from "@/pages/alarms/AlarmsPage.tsx";
import DonchianChannelsPage from '@/pages/analyses/DonchianChannelsPage';
import ATRPage from '@/pages/analyses/ATRPage';
import MACDPage from '@/pages/analyses/MACDPage';
import ADIPage from '@/pages/analyses/ADIPage';
import SmartAlertsPage from "@/pages/alarms/SmartAlertsPage.tsx";


const SettingsPage = () => <div>Ayarlar</div>;

import { ToastProvider } from "@/contexts/ToastContext";

function App() {
    return (
        <BrowserRouter>
            <CacheProvider>
                <ToastProvider>
                    <AppLayout>
                        <Routes>
                            <Route path="/analyses/rsi" element={<RSIPage />} />
                            <Route path="/analyses/ma" element={<MovingAveragePage />} />
                            <Route path="/analyses/ema" element={<ExponentialMAPage />} />
                            <Route path="/analyses/bollinger-bands" element={<BollingerBandsPage />} />
                            <Route path="/analyses/donchian-channels" element={<DonchianChannelsPage />} />
                            <Route path="/analyses/atr" element={<ATRPage />} />
                            <Route path="/analyses/macd" element={<MACDPage />} />
                            <Route path="/analyses/adi" element={<ADIPage />} />
                            <Route path="/coins" element={<CoinsPage />} />
                            <Route path="/alarms" element={<AlarmsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/coins/:coinId" element={<CoinDetailPage />} />
                            <Route path="/smart-alerts" element={<SmartAlertsPage />} />
                        </Routes>
                    </AppLayout>
                </ToastProvider>
            </CacheProvider>
        </BrowserRouter>
    );
}

export default App
