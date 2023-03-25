import Bots from '../model/bots';
import { is_object_empty } from '../@utils/functions'; 
import Bot from './functions';

const robot = () => {

    setInterval(async () => {
        
        const trades = await Bots.find();

        if(!trades || !trades.length) return console.log(`No trades`);

        console.log(`-----------------------------------------------`);
        console.log(`${trades.length} trades`);

        for(let x of trades){

            const crypto  = await Bot.exchange_market_price(x);
            if(!crypto) continue;

            const { used_strategy, order } = x;
            
            const price = Number(crypto.price);

            const isOrderOpen = is_object_empty(order) ? false : true;

            const end_script = await Bot.end_bot({ data: x, isOrderOpen, message: "success" });
            if(end_script) continue;

            if(isOrderOpen){
                const stop_loss = await Bot.stop_loss_hit({ data: x, price });
                if(stop_loss) continue;

                const take_profit = await Bot.take_profit_hit({ data: x, price });
                if(take_profit) continue;

                continue;
            }

            const reset_used = await Bot.reset_timer_trade({ data: x, price });
            if(reset_used) continue;

            const {isNoSide, side} = Bot.strategy_method({ strategy: used_strategy, price_current: price, price_snapshot: x.price_snapshot });
            if(isNoSide) continue;

            if(used_strategy.live === true){
                const live_order = await Bot.live_trade({ data: x, price, side });
                if(live_order) continue;
            };
            
            if(used_strategy.live === false){
                const test_order = await Bot.test_trade({ data: x, price, side });
                if(test_order) continue;
            };
            
        };

    }, 5000);

}

export default robot;