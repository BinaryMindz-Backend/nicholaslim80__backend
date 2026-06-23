import { Injectable } from '@nestjs/common';
import admin from 'src/config/firebase-config';

@Injectable()
export class FirebaseService {
  async sendPush({ token, title, body, imageUrl }: {
    token: string;
    title: string;
    body: string;
    imageUrl?: string;
  }) {
    const pushMessage: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      android: {
        notification: {
          imageUrl,
        },
      },
      apns: {
        payload: {
          aps: { 'mutable-content': 1 },
        },
        fcmOptions: {
          imageUrl,
        },
      },
    };

    try {
      const res = await admin.messaging().send(pushMessage);
      console.log('Push sent:', res);
      return res;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error; // ✅ rethrow so the queue processor knows it failed
    }
  }
}