import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Result } from './result';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  async execute(@Body() piet: number[][]): Promise<Result> {
    return await this.appService.runPiet(piet);
  }
}
