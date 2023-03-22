import { IStrategies, IStrategiesUsed } from '../model/strategies';

interface TradingStrategy { 
    strategy: IStrategies | IStrategiesUsed,
    price_snapshot: number,
    price_current: number,
}

interface TradeStrategyReturn {
    side: "buy" | "sell",
    isNoSide: boolean,
};

export const buy_or_sell = ({strategy, price_snapshot, price_current}: TradingStrategy):TradeStrategyReturn  => {
    let isBuyPrice = false;
    let isSellPrice = false;

    if(strategy.strategy === "counter"){
        const buy_price = price_snapshot - Number(strategy.long);
        isBuyPrice = buy_price >= price_current;
    
        const sell_price = price_snapshot + Number(strategy.short);
        isSellPrice = price_current >= sell_price;
    };

    if(strategy.strategy === "counter long only"){
        const buy_price = price_snapshot - Number(strategy.long);
        isBuyPrice = buy_price >= price_current;
    };

    if(strategy.strategy === "counter short only"){
        const sell_price = price_snapshot + Number(strategy.short);
        isSellPrice = price_current >= sell_price;
    };

    if(strategy.strategy === "trend"){
        const buy_price = price_snapshot + Number(strategy.long);
        isBuyPrice = price_current >= buy_price;

        const sell_price = price_snapshot - Number(strategy.short);
        isSellPrice = sell_price >= price_current;
    };

    if(strategy.strategy === "trend long only"){
        const buy_price = price_snapshot + Number(strategy.long);
        isBuyPrice = price_current >= buy_price;
    };

    if(strategy.strategy === "trend short only"){
        const sell_price = price_snapshot - Number(strategy.short);
        isSellPrice = sell_price >= price_current;
    };

    return {
        isNoSide: !isBuyPrice && !isSellPrice,
        side: isBuyPrice ? "buy" : "sell",
    }

};