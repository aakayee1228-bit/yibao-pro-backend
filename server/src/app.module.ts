import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ProductsModule } from '@/modules/products/products.module';
import { IndustriesModule } from '@/modules/industries/industries.module';
import { QuotesModule } from '@/modules/quotes/quotes.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { MerchantsModule } from '@/modules/merchants/merchants.module';

@Module({
  imports: [ProductsModule, IndustriesModule, QuotesModule, CustomersModule, MerchantsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
