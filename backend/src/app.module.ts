import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { PaymentModeModule } from './payment-mode/payment-mode.module';
import { TypeOfPaymentModule } from './type-of-payment/type-of-payment.module';
import { PaymentCollectionModule } from './payment-collection/payment-collection.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CustomerModule, PaymentModeModule, TypeOfPaymentModule, PaymentCollectionModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
