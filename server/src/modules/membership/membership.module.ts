import { Module } from '@nestjs/common'
import { MembershipController } from './membership.controller'
import { MembershipService } from './membership.service'
import { PaymentService } from '../payment/payment.service'

@Module({
  controllers: [MembershipController],
  providers: [MembershipService, PaymentService],
  exports: [MembershipService, PaymentService],
})
export class MembershipModule {}
