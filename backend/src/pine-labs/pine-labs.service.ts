import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PineLabsConfigService } from '../pine-labs-config/pine-labs-config.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PineLabsService {
  private readonly logger = new Logger(PineLabsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: PineLabsConfigService,
  ) {}

  async initiatePayment(data: { amount: number; invoiceId?: string; customerName?: string; mobileNumber?: string; createdBy?: number }) {
    const config = await this.configService.getConfig();
    if (!config || config.status !== 'Active') {
      throw new BadRequestException('Pine Labs integration is not configured or active');
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create pending transaction in our DB
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        transactionId,
        amount: data.amount,
        invoiceId: data.invoiceId,
        customerName: data.customerName,
        mobileNumber: data.mobileNumber,
        status: 'Pending',
        createdBy: data.createdBy,
      },
    });

    try {
      const payload = {
        TransactionNumber: transactionId,
        SequenceNumber: 1,
        AllowedPaymentMode: "0", // 0 = Allow all modes
        Amount: Math.round(data.amount * 100), // typically in paisa
        UserID: data.createdBy ? data.createdBy.toString() : "System",
        MerchantID: config.merchantId,
        SecurityToken: config.securityToken,
        ClientId: config.clientId,
        StoreId: config.storeId,
        AutoCancelDurationInMinutes: 5,
      };

      const apiUrl = config.environment === 'Production'
        ? 'https://www.plutuscloudservice.in:8201/API/CloudBasedIntegration/V1/UploadBilledTransaction'
        : 'https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/UploadBilledTransaction';

      this.logger.log(`Initiating Pine Labs payment for Txn: ${transactionId}, Amount: ${data.amount}`);
      
      const response = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      this.logger.log(`Pine Labs Response: ${JSON.stringify(response.data)}`);

      if (response.data.ResponseCode !== 0) {
         throw new Error(response.data.ResponseMessage || 'Pine Labs API error');
      }

      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { responseData: response.data }
      });

      return {
        success: true,
        transactionId,
        message: 'Payment pushed to POS machine',
        pineLabsResponse: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate Pine Labs payment: ${error.message}`);
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'Failed', responseData: { error: error.response?.data || error.message } },
      });
      throw new BadRequestException(error.response?.data?.ResponseMessage || error.message || 'Failed to initiate payment on POS');
    }
  }

  async checkPaymentStatus(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    const config = await this.configService.getConfig();
    if (!config) throw new BadRequestException('Pine Labs config not found');

    const responseData: any = transaction.responseData;
    const plutusRef = responseData?.PlutusTransactionReferenceID;

    if (!plutusRef) {
       return {
         transactionId,
         status: transaction.status,
         amount: transaction.amount,
         paymentMode: transaction.paymentMode,
       };
    }

    try {
      const payload = {
        MerchantID: config.merchantId,
        SecurityToken: config.securityToken,
        ClientId: config.clientId,
        StoreId: config.storeId,
        PlutusTransactionReferenceID: plutusRef
      };

      const apiUrl = config.environment === 'Production'
        ? 'https://www.plutuscloudservice.in:8201/API/CloudBasedIntegration/V1/GetStatus'
        : 'https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/GetStatus';

      const response = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
      const pResp = response.data;
      
      this.logger.log(`Pine Labs GetStatus Response: ${JSON.stringify(pResp)}`);

      if (pResp.ResponseCode === 0 && pResp.ResponseMessage === 'APPROVED') {
         if (transaction.status !== 'Success') {
           await this.prisma.paymentTransaction.update({
             where: { id: transaction.id },
             data: { status: 'Success' }
           });
           transaction.status = 'Success';
         }
      } else if (pResp.ResponseMessage && (pResp.ResponseMessage.includes('CANCELLED') || pResp.ResponseMessage.includes('DECLINED') || pResp.ResponseMessage.includes('FAILED'))) {
         if (transaction.status !== 'Failed' && transaction.status !== 'Cancelled') {
           await this.prisma.paymentTransaction.update({
             where: { id: transaction.id },
             data: { status: 'Failed' }
           });
           transaction.status = 'Failed';
         }
      }

      return {
        transactionId,
        status: transaction.status,
        amount: transaction.amount,
        paymentMode: transaction.paymentMode,
        pineLabsResponse: pResp
      };
    } catch (error) {
      this.logger.error(`Failed to check payment status: ${error.message}`);
      if (error.response) {
        this.logger.error(`Pine Labs GetStatus API Error Response: ${JSON.stringify(error.response.data)}`);
      }
      throw new BadRequestException(error.response?.data?.ResponseMessage || error.response?.data?.Message || error.message || 'Failed to check payment status');
    }
  }

  async cancelPayment(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'Pending') {
      throw new BadRequestException('Only pending transactions can be cancelled');
    }

    // Call Pine Labs API to cancel the push request on POS
    // Mocking this call
    this.logger.log(`Cancelling Pine Labs payment for Txn: ${transactionId}`);

    const updatedTxn = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: 'Cancelled' },
    });

    return updatedTxn;
  }

  async processWebhook(payload: any) {
    this.logger.log(`Received Webhook from Pine Labs: ${JSON.stringify(payload)}`);
    
    // Extract data from Pine Labs payload
    // Example: { TransactionNumber: 'TXN...', Status: 'SUCCESS', PaymentMode: 'CREDIT_CARD', ResponseCode: '00' }
    const txId = payload.TransactionNumber || payload.transactionId;
    const status = payload.Status || payload.status; // SUCCESS or FAILED
    const paymentMode = payload.PaymentMode || payload.paymentMode || 'POS';

    if (!txId) {
      throw new BadRequestException('Invalid webhook payload');
    }

    try {
      const transaction = await this.prisma.paymentTransaction.update({
        where: { transactionId: txId },
        data: {
          status: status === 'SUCCESS' ? 'Success' : 'Failed',
          paymentMode: paymentMode,
          responseData: payload,
        },
      });

      return { success: true, transactionId: transaction.transactionId };
    } catch (error) {
      this.logger.error(`Error processing webhook for Txn: ${txId}`, error.stack);
      throw new BadRequestException('Failed to process webhook');
    }
  }
  
  async getTransactions() {
    return this.prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });
  }
}
