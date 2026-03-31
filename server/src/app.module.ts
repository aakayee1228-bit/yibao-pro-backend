import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { ProductsModule } from '@/modules/products/products.module';
import { IndustriesModule } from '@/modules/industries/industries.module';
import { QuotesModule } from '@/modules/quotes/quotes.module';
import { CustomersModule } from '@/modules/customers/customers.module';

@Module({
  imports: [AuthModule, MembershipModule, ProductsModule, IndustriesModule, QuotesModule, CustomersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
