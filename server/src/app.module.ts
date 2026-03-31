import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ProductsModule } from '@/modules/products/products.module';
import { IndustriesModule } from '@/modules/industries/industries.module';

@Module({
  imports: [MembershipModule, ProductsModule, IndustriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
