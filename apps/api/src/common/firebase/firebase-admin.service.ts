import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      try {
        // 2. 在运行时，从文件系统中同步读取文件内容
        const serviceAccountPath = resolve('./firebase-service-account-key.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully from file.');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        // 在生产环境中，如果Firebase初始化失败，可能需要让应用崩溃
        // process.exit(1);
      }
    }
  }

  get auth() {
    return admin.auth();
  }
}
