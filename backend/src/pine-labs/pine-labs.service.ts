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

  async initiatePayment(data: { amount: number; invoiceId?: string; customerName?: string; mobileNumber?: string; createdBy?: number; type?: string }) {
    if (data.amount < 1) {
      throw new BadRequestException('Transaction amount must be at least 1 Rs.');
    }
    const machineType = data.type || 'sale';
    const config = await this.configService.getConfig(machineType);
    if (!config || config.status !== 'Active') {
      throw new BadRequestException(`Pine Labs integration (${machineType}) is not configured or active`);
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
        machineType,
      },
    });

    try {
      const payload: any = {
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

      if (config.hardwareSn) {
        payload.IMEI = config.hardwareSn;
      }

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
        data: { 
          requestData: payload,
          responseData: response.data 
        }
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

    const config = await this.configService.getConfig(transaction.machineType || 'sale');
    if (!config) throw new BadRequestException(`Pine Labs config (${transaction.machineType || 'sale'}) not found`);

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
        ? 'https://www.plutuscloudservice.in:8201/API/CloudBasedIntegration/V1/GetCloudBasedTxnStatus'
        : 'https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/GetCloudBasedTxnStatus';

      const response = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
      const pResp = response.data;
      
      this.logger.log(`Pine Labs GetStatus Response: ${JSON.stringify(pResp)}`);

      const resMsg = (pResp.ResponseMessage || '').toUpperCase();
      const resCode = pResp.ResponseCode;

      // Detect Payment Mode (UPI vs CARD)
      let detectedMode = 'CARD';
      const pModeStr = String(pResp.PaymentMode || '').toUpperCase();
      const acqName = String(pResp.AcquirerName || '').toUpperCase();
      const resMsgStr = String(pResp.ResponseMessage || '').toUpperCase();
      
      if (pModeStr === '9' || pModeStr === '8' || pModeStr === 'UPI' || acqName.includes('UPI') || resMsgStr.includes('UPI') || acqName.includes('PHONEPE') || acqName.includes('BHARATPE') || acqName.includes('PAYTM') || acqName.includes('GPAY')) {
         detectedMode = 'UPI';
      }

      // In Pine Labs, ResponseCode 0 is Success. ResponseCode 1 is usually an Error (like Invalid Device).
      if (resCode == 0 || resMsg === 'APPROVED' || resMsg === 'SUCCESS') {
         if (transaction.status !== 'Success') {
           await this.prisma.paymentTransaction.update({
             where: { id: transaction.id },
             data: { status: 'Success', paymentMode: detectedMode }
           });
           transaction.status = 'Success';
           transaction.paymentMode = detectedMode;
         }
      } else if (resMsg.includes('CANCELLED') || resMsg.includes('DECLINED') || resMsg.includes('FAILED')) {
         if (transaction.status !== 'Failed' && transaction.status !== 'Cancelled') {
           await this.prisma.paymentTransaction.update({
             where: { id: transaction.id },
             data: { status: 'Failed', paymentMode: detectedMode }
           });
           transaction.status = 'Failed';
           transaction.paymentMode = detectedMode;
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

    const config = await this.configService.getConfig(transaction.machineType || 'sale');
    if (!config) throw new BadRequestException(`Pine Labs config (${transaction.machineType || 'sale'}) not found`);

    const responseData: any = transaction.responseData;
    const plutusRef = responseData?.PlutusTransactionReferenceID;

    if (!plutusRef) {
      throw new BadRequestException('Cannot cancel transaction: Plutus Ref ID not found.');
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
        ? 'https://www.plutuscloudservice.in:8201/API/CloudBasedIntegration/V1/CancelTransaction'
        : 'https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/CancelTransaction';

      this.logger.log(`Cancelling Pine Labs payment for Txn: ${transactionId} via API`);

      const response = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
      const pResp = response.data;

      this.logger.log(`Pine Labs Cancel Response: ${JSON.stringify(pResp)}`);

      if (pResp.ResponseCode !== 0 && pResp.ResponseCode !== 12) { // 0 is success, 12 might mean already processed, but we'll stick to error if not 0
        throw new Error(pResp.ResponseMessage || 'Failed to cancel on Pine Labs');
      }

      const updatedTxn = await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'Cancelled',
          cancelData: { request: payload, response: pResp }
        },
      });

      return updatedTxn;
    } catch (error) {
      this.logger.error(`Failed to cancel Pine Labs payment: ${error.message}`);
      // Fallback: if we just want to cancel locally if the API fails, we could, but better to enforce it.
      throw new BadRequestException(error.response?.data?.ResponseMessage || error.message || 'Failed to cancel payment');
    }
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
