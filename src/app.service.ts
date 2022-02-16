import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as Color from 'color';
import { Result } from './result';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppService {
  EXEC_TIMEOUT = 10000;
  logger: Logger = new Logger('Execution');

  getHello(): string {
    return 'Hello World!';
  }

  async runPiet(piet: number[][]): Promise<Result> {
    const stdout: string[] = [];
    const stderr: string[] = [];
    let isTimeout = false;
    const startExecution = Date.now();

    this.logger.log(`Start piet parsing`);
    const ppmFilePath = `./ppm/${uuidv4()}.ppm`;
    const ppmFileContent = await this.pietJsonToPPM(piet);
    this.logger.log(`End piet parsing`);

    fs.writeFileSync(ppmFilePath, ppmFileContent, 'binary');

    setTimeout(() => {
      isTimeout = true;
      node.kill();
    }, this.EXEC_TIMEOUT);

    this.logger.log(`Start piet execution`);
    const node = spawn('npiet', [ppmFilePath]);

    node.stdout.on('data', function (data) {
      console.log('out', data);
      stdout.push(data.toString());
    });

    node.stderr.on('data', function (data) {
      console.log('err', data);
      stderr.push(data.toString());
    });

    return new Promise((resolve, reject) => {
      node.on('exit', async (code) => {
        this.logger.log(`End piet execution`);
        fs.unlinkSync(ppmFilePath);
        const closeExecution = Date.now();
        if (isTimeout) {
          const result: Result = {
            code: null,
            stdout: null,
            stderr: `Timeout of ${this.EXEC_TIMEOUT}ms exceeded`,
            executionTime: closeExecution - startExecution,
          };
          resolve(result);
        }

        const result: Result = {
          code,
          stdout: stdout.join(''),
          stderr: stderr.join(''),
          executionTime: closeExecution - startExecution,
        };

        this.logger.log(`Finished running code`);

        resolve(result);
      });
    });
  }

  async pietJsonToPPM(codels: number[][]): Promise<string> {
    const colors = new Map<number, string>();
    colors.set(0, '#FFFFFF');
    colors.set(1, '#000000');
    colors.set(2, '#FFC0C0');
    colors.set(3, '#FFFFC0');
    colors.set(4, '#C0FFC0');
    colors.set(5, '#C0FFFF');
    colors.set(6, '#C0C0FF');
    colors.set(7, '#FFC0FF');
    colors.set(8, '#FF0000');
    colors.set(9, '#FFFF00');
    colors.set(10, '#00FF00');
    colors.set(11, '#00FFFF');
    colors.set(12, '#0000FF');
    colors.set(13, '#FF00FF');
    colors.set(14, '#C00000');
    colors.set(15, '#C0C000');
    colors.set(16, '#00C000');
    colors.set(17, '#00C0C0');
    colors.set(18, '#0000C0');
    colors.set(19, '#C000C0');

    const rgbCodels = codels.map((row) =>
      row.map((codel) => Color(colors.get(codel)).rgb().array()),
    );

    const rgbData = [];
    rgbCodels.forEach((row) => {
      const line = [];
      row.forEach((codel) => {
        codel.forEach((byte) => {
          const digits = byte.toString().length;
          const padding = ' '.repeat(3 - digits);
          line.push(padding + byte);
        });
      });
      rgbData.push(line.join(' '));
    });

    const ppmFile = [
      'P3',
      `${rgbCodels[0].length} ${rgbCodels.length}`,
      255,
      rgbData.join(' \n'),
    ].join('\n');
    return ppmFile;
  }
}
