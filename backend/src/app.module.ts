import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { PaymentModeModule } from './payment-mode/payment-mode.module';
import { TypeOfPaymentModule } from './type-of-payment/type-of-payment.module';
import { TypeOfCollectionModule } from './type-of-collection/type-of-collection.module';
import { PaymentCollectionModule } from './payment-collection/payment-collection.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModelModule } from './vehicle-model/vehicle-model.module';
import { UserModule } from './user/user.module';
import { MenuPermissionModule } from './menu-permission/menu-permission.module';

@Module({
  imports: [CustomerModule, PaymentModeModule, TypeOfPaymentModule, TypeOfCollectionModule, PaymentCollectionModule, AuthModule, VehicleModelModule, UserModule, MenuPermissionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
