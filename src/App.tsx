import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import DirectionalRangeStripPage from "@/pages/analyses/DirectionalRangeStripPage";
import ChartsPage from "@/pages/analyses/ChartsPage.tsx";
import LoginPage from "@/pages/login/LoginPage.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import PortfolioPage from "@/pages/portfolio/PortfolioPage";
import TradeJourneyPage from "@/pages/portfolio/TradeJourneyPage";
import SettingsPage from "@/pages/settings/SettignsPage";
import MarketBreadthPage from "@/pages/analyses/MarketBreadthPage";
import StrategyLabPage from "@/pages/strategy/StrategyLabPage";
import TradeExplorerPage from "@/pages/strategy/TradeExplorerPage";
import PurchaseGoalsPage from "@/pages/purchase-goals/PurchaseGoalsPage";
import PurchaseGoalDetailPage from "@/pages/purchase-goals/PurchaseGoalDetailPage";

import { ToastProvider } from "@/contexts/ToastContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CacheProvider>
                    <ToastProvider>
                        <Routes>
                            {/* Standalone Login Page */}
                            <Route path="/login" element={<LoginPage />} />

                            {/* Main App Pages Wrapped in Layout */}
                            <Route
                                path="/*"
                                element={
                                    <AppLayout>
                                        <Routes>
                                            <Route path="/" element={<Navigate to="/coins" replace />} />
                                            <Route path="/analyses/rsi" element={<RSIPage />} />
                                            <Route path="/analyses/ma" element={<MovingAveragePage />} />
                                            <Route path="/analyses/ema" element={<ExponentialMAPage />} />
                                            <Route path="/analyses/bollinger-bands" element={<BollingerBandsPage />} />
                                            <Route path="/analyses/donchian-channels" element={<DonchianChannelsPage />} />
                                            <Route path="/analyses/atr" element={<ATRPage />} />
                                            <Route path="/analyses/macd" element={<MACDPage />} />
                                            <Route path="/analyses/adi" element={<ADIPage />} />
                                            <Route path="/analyses/directional-range-strip" element={<DirectionalRangeStripPage />} />
                                            <Route path="/coins" element={<CoinsPage />} />
                                            <Route path="/analyses/charts" element={<ChartsPage />} />
                                            <Route path="/market-breadth" element={<MarketBreadthPage />} />
                                            <Route path="/strategy-lab" element={<ProtectedRoute><StrategyLabPage /></ProtectedRoute>} />
                                            <Route path="/trade-explorer" element={<ProtectedRoute><TradeExplorerPage /></ProtectedRoute>} />
                                            <Route path="/coins/:coinId" element={<CoinDetailPage />} />
											<Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
											<Route path="/portfolio/journey" element={<ProtectedRoute><TradeJourneyPage /></ProtectedRoute>} />
											<Route path="/purchase-goals" element={<ProtectedRoute><PurchaseGoalsPage /></ProtectedRoute>} />
											<Route path="/purchase-goals/:id" element={<ProtectedRoute><PurchaseGoalDetailPage /></ProtectedRoute>} />

                                            <Route path="/alarms" element={<AlarmsPage />} />
                                            <Route path="/settings" element={<SettingsPage />} />
                                            <Route path="/smart-alerts" element={<SmartAlertsPage />} />
                                        </Routes>
                                    </AppLayout>
                                }
                            />
                        </Routes>
                    </ToastProvider>
                </CacheProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
