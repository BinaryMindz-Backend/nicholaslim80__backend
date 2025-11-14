import { Injectable } from '@nestjs/common';
import {name} from "package.json"

@Injectable()
export class AppService {
  getHello(): string {
    return `${name} server base API`;
  }
}
