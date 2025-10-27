import React, { useEffect, useState } from "react"
import {type Coin, getTopCoins} from "@/services/coinService"
import CoinTable from "@/components/coins/CoinTable"
import {useTranslation} from "react-i18next";

const CoinsPage: React.FC = () => {
    const [coins, setCoins] = useState<Coin[]>([])
    const { t } = useTranslation();

    useEffect(() => {
        getTopCoins().then(setCoins)
    }, [])

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4"> {t("coins.top100")}</h1>
            <CoinTable coins={coins} />
        </div>
    )
}

export default CoinsPage
