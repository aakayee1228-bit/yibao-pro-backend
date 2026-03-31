import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MembershipController } from './membership.controller'
import { MembershipService } from './membership.service'
import { PaymentService } from '../payment/payment.service'

@Module({
  imports: [ConfigModule],
  controllers: [MembershipController],
  providers: [MembershipService, PaymentService],
  exports: [MembershipService, PaymentService],
})
export class MembershipModule {}
