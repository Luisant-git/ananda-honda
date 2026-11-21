import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface WebhookConfig {
  url: string;
  secret: string;
}

@Injectable()
export class SalesWebhookService {
  private readonly logger = new Logger(SalesWebhookService.name);
  private configFilePath = path.join(process.cwd(), 'sales-webhook-config.json');
  private config: WebhookConfig = { url: '', secret: '' };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // 1. Try file first
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.url === 'string') {
          this.config = {
            url: parsed.url.trim(),
            secret: (parsed.secret || '').trim(),
          };
          this.logger.log(`Loaded sales webhook config from file: ${this.config.url}`);
          return;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not read sales webhook config file: ${err.message}`);
    }

    // 2. Fallback to process.env
    const envUrl = process.env.SALES_WEBHOOK_URL || '';
    const envSecret = process.env.SALES_WEBHOOK_SECRET || '';
    if (envUrl) {
      this.config = {
        url: envUrl.trim(),
        secret: envSecret.trim(),
      };
      this.logger.log(`Loaded sales webhook config from environment: ${this.config.url}`);
    }
  }

  getConfig(): WebhookConfig {
    if (!this.config.url && process.env.SALES_WEBHOOK_URL) {
      this.config.url = process.env.SALES_WEBHOOK_URL.trim();
      this.config.secret = (process.env.SALES_WEBHOOK_SECRET || '').trim();
    }
    return this.config;
  }

  getPublicConfig() {
    const cfg = this.getConfig();
    return {
      url: cfg.url || '',
      hasSecret: Boolean(cfg.secret),
      maskedSecret: cfg.secret ? `${cfg.secret.substring(0, 3)}****` : '',
      configured: Boolean(cfg.url),
    };
  }

  updateConfig(url: string, secret?: string) {
    this.config = {
      url: (url || '').trim(),
      secret: secret !== undefined ? secret.trim() : this.config.secret,
    };

    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf8');
      this.logger.log(`Saved new sales webhook config to ${this.configFilePath}`);
    } catch (err: any) {
      this.logger.error(`Failed to save sales webhook config file: ${err.message}`);
    }

    return {
      success: true,
      message: 'Sales webhook configuration updated successfully',
      ...this.getPublicConfig(),
    };
  }

  formatReceiptPayload(payment: any, event: 'created' | 'updated' | 'cancelled' | 'deleted') {
    const salesPersonName =
      payment.customer?.assignedExecutive?.trim() ||
      payment.user?.username?.trim() ||
      'Not Assigned';
    const salesExecutive = payment.customer?.assignedExecutive?.trim() || 'Not Assigned';
    const enteredBy = payment.user?.username || 'N/A';

    return {
      ...payment,
      salesPersonName,
      salesExecutive,
      enteredBy,
      event,
    };
  }

  dispatchWebhook(event: 'created' | 'updated' | 'cancelled' | 'deleted', payment: any) {
    // Non-blocking asynchronous dispatch
    setImmediate(async () => {
      try {
        const payload = this.formatReceiptPayload(payment, event);
        await this.sendWithRetry(payload, event);
      } catch (err: any) {
        this.logger.error(`Unexpected error dispatching webhook for receipt ${payment?.receiptNo}: ${err.message}`);
      }
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sendWithRetry(
    payload: any,
    event: string,
    targetUrl?: string,
    targetSecret?: string,
  ): Promise<{ success: boolean; attempts: number; lastStatus?: number; error?: string }> {
    const cfg = this.getConfig();
    const url = targetUrl || cfg.url;
    const secret = targetSecret !== undefined ? targetSecret : cfg.secret;

    if (!url) {
      this.logger.debug(`No webhook URL configured for sales receipt ${payload?.receiptNo}. Skipping.`);
      return { success: false, attempts: 0, error: 'No webhook URL configured' };
    }

    const maxRetries = 3; // 4 total attempts
    const backoffDelays = [2000, 5000, 10000]; // 2s, 5s, 10s

    let attempt = 0;
    let lastError = '';
    let lastStatus: number | undefined;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        this.logger.log(
          `[Webhook Attempt ${attempt}/${maxRetries + 1}] Sending receipt ${payload.receiptNo} (${event}) to ${url}`,
        );

        const response = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': secret,
            'User-Agent': 'AnandaHonda-Sales-Webhook/1.0',
          },
          timeout: 15000, // 15 second timeout per attempt
          validateStatus: () => true, // capture all status codes
        });

        lastStatus = response.status;

        // If replied 200, success!
        if (response.status === 200) {
          this.logger.log(
            `[Webhook Success] Receipt ${payload.receiptNo} (${event}) delivered to ${url} with HTTP 200 (Attempt ${attempt})`,
          );
          return { success: true, attempts: attempt, lastStatus: 200 };
        } else {
          lastError = `Target returned HTTP status ${response.status}: ${JSON.stringify(response.data || '').substring(0, 200)}`;
          this.logger.warn(`[Webhook Attempt ${attempt} Non-200 Response] ${lastError}`);
        }
      } catch (err: any) {
        lastError = err.message || 'Unknown network error';
        this.logger.warn(`[Webhook Attempt ${attempt} Network Error] ${lastError}`);
      }

      if (attempt <= maxRetries) {
        const delay = backoffDelays[attempt - 1] || 5000;
        this.logger.log(`Waiting ${delay}ms before webhook retry ${attempt + 1}...`);
        await this.sleep(delay);
      }
    }

    this.logger.error(
      `[Webhook Failed] All ${maxRetries + 1} attempts to deliver receipt ${payload.receiptNo} to ${url} failed. Last error: ${lastError}`,
    );

    return { success: false, attempts: attempt, lastStatus, error: lastError };
  }

  async testWebhook(testUrl?: string, testSecret?: string) {
    const cfg = this.getConfig();
    const url = testUrl || cfg.url;
    const secret = testSecret !== undefined ? testSecret : cfg.secret;

    if (!url) {
      return {
        success: false,
        message: 'Webhook URL is not configured. Please supply a URL or configure one.',
      };
    }

    const samplePayload = {
      id: 999999,
      date: new Date().toISOString(),
      receiptNo: 'RV-TEST-0001',
      refNo: 'REF-TEST-12345',
      customerId: 1,
      recAmt: 5000,
      paymentModeId: 1,
      paymentType: 'booking',
      typeOfPaymentId: 1,
      typeOfCollectionId: 1,
      vehicleModelId: 1,
      enteredBy: 'admin',
      remarks: 'Test Webhook Dispatch',
      deletedAt: null,
      deletedBy: null,
      cancelledAt: null,
      cancelledBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brand: 'BIGWINGS',
      branchCode: null,
      customer: {
        id: 1,
        custId: 'CUST-TEST',
        name: 'Test Customer',
        contactNo: '9876543210',
        address: 'Test Address',
        location: 'Test Location',
        pincode: '560001',
        status: 'Walk in Customer',
        assignedExecutive: 'Test Sales Executive',
      },
      paymentMode: { id: 1, paymentMode: 'CASH', status: 'Enable' },
      typeOfPayment: { id: 1, typeOfMode: 'CASH' },
      typeOfCollection: { id: 1, typeOfCollect: 'Booking' },
      vehicleModel: { id: 1, model: 'Activa 6G' },
      user: { id: 1, username: 'admin', role: 'ADMIN' },
      cancelledByUser: null,
      salesPersonName: 'Test Sales Executive',
      salesExecutive: 'Test Sales Executive',
      event: 'created',
    };

    const result = await this.sendWithRetry(samplePayload, 'test', url, secret);
    return {
      ...result,
      testedUrl: url,
      headerSent: 'x-webhook-secret: ' + (secret ? '***[PROVIDED]***' : '[EMPTY]'),
    };
  }
}
