import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MembershipModule } from '@/modules/membership/membership.module';

@Module({
  imports: [MembershipModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
