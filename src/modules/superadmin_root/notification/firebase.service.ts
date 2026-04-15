import { Injectable } from '@nestjs/common';
import admin from 'src/config/firebase-config';


@Injectable()
export class FirebaseService {
    async sendPush({ token, title, body, imageUrl }) {
      // console.log("from send push--->", token, title, body);
     //    
    const pushMessage = {
        token,
        notification: { title, body, imageUrl},
      };
       // 
       
       try {
          const res =  await admin.messaging().send(pushMessage);
          console.log("res form firebase push notification", res, pushMessage);
          return res;
       } catch (error) {
           console.log('Failed to send push notification:', error);  
       }
     
  } 

}
