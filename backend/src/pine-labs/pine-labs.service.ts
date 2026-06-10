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
      // Mocking the Pine Labs Plutus API call for pushing payment to POS
      // In a real environment, you'd format the payload based on Pine Labs API spec.
      // Example payload: { MerchantID, TerminalID, TransactionNumber, Amount, TransactionType: '1' (Sale) }
      
      const payload = {
        MerchantID: config.merchantId,
        TerminalID: config.terminalId,
        TransactionNumber: transactionId,
        Amount: data.amount * 100, // typically in paisa
      };

      // Mock logic: Instead of hitting a real Pine Labs endpoint (since we don't have real credentials),
      // we just simulate a successful initiation.
      this.logger.log(`Initiating Pine Labs payment for Txn: ${transactionId}, Amount: ${data.amount}`);
      
      return {
        success: true,
        transactionId,
        message: 'Payment pushed to POS machine',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate Pine Labs payment: ${error.message}`);
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'Failed', responseData: { error: error.message } },
      });
      throw new BadRequestException('Failed to initiate payment on POS');
    }
  }

  async checkPaymentStatus(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const config = await this.configService.getConfig();
    if (!config) {
      throw new BadRequestException('Pine Labs config not found');
    }

    try {
      // Mocking status check API call to Pine Labs
      // In reality, this would hit Pine Labs status check endpoint.
      // E.g. axios.post(apiUrl, { MerchantID, TerminalID, TransactionNumber })
      
      // We will just return the current DB status since we handle webhooks
      return {
        transactionId,
        status: transaction.status,
        amount: transaction.amount,
        paymentMode: transaction.paymentMode,
      };
    } catch (error) {
      this.logger.error(`Failed to check payment status: ${error.message}`);
      throw new BadRequestException('Failed to check payment status');
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
