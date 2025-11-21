import { nanoid } from "nanoid";

// 
export class ReferralUtils {
      // 
      static generateReferralCode(length:number =10):string{
            return nanoid(length)
      }

      static generatereferralLink(baseUrl:string, code:string):string {
         return `${baseUrl}/signup?ref=${code}`;
      }
    //   
    static generateReferral(baseUrl: string){
          const code = this.generateReferralCode();
          const link = this.generatereferralLink(baseUrl, code);
          return {code, link}
    }
}


