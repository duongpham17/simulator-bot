import kucoin_api from 'kucoin-futures-node-api';
import {decrypt} from '../@utils/encryption';
import crypto from 'crypto';

interface Position {
  usdtBalance: number,
  side: "buy" | "sell",
  price: number,
  leverage: number,
  size: number,
};

interface CustomKucoinProps {
  api_key: string, 
  secret_key: string, 
  passphrase: string, 
  symbol: string
};

export const kucoin = ({api_key, secret_key, passphrase, symbol}: CustomKucoinProps) => {
  
  const apiLive = new kucoin_api();

  apiLive.init({
    apiKey: decrypt(api_key),
    secretKey: decrypt(secret_key),
    passphrase: decrypt(passphrase),
    environment: 'live'
  });

  class Kucoin {
    symbol: string;
   
    constructor(symbol: string) {
      this.symbol = symbol;
    };
  
    async getAccountOverview():Promise<any>{
      const account = await apiLive.getAccountOverview();
      return account;
    }
  
    async getPrice(): Promise<number | null> {
      try{
        const response = await apiLive.getTicker(this.symbol);
        return Number(response.data.price);
      } catch(_){
        return null
      }
    };
  
    async placePosition(position: Position): Promise<any> {
      const params = {  
        clientOid: crypto.randomUUID(),
        type: "market",
        symbol: this.symbol.toUpperCase(),
        leverage: position.leverage,
        side: position.side,
        price: position.price,
        size: Math.trunc(position.size / 10)
      };
      try{
        const r = await apiLive.placeOrder(params);
        return r.data
      } catch(err: any){
        return null;
      };
    };
    
    async closePosition(clientOid: string): Promise<any>{
      const params = {
        clientOid,
        closeOrder: true,
        symbol: this.symbol.toUpperCase(),
        type: "market"
      }
      try{
        const r = await apiLive.placeOrder(params);
        return r.data;
      } catch(_){
        return null;
      }
    };
  
    async getPosition(): Promise<any>{
      try{
        const r = await apiLive.getPosition({symbol: this.symbol});
        return r.data;
      } catch(_){
        return null;
      };
    };
  }

  return new Kucoin(symbol)
}

