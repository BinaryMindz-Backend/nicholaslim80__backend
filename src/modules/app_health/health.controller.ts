
import { Controller, Get } from '@nestjs/common'; 
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { Public } from 'src/decorators/public.decorator';

@Controller('health') 
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) { }

  @Get()
  @HealthCheck()
  @Public()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nicholas_lim80_Server', 'http://0.0.0.0:3000/api/v1'),
    ]);
  }
}
