import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
const FormData = require('form-data');

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string = 'https://graph.facebook.com/v17.0';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN as string;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID as string;
  }

  async uploadMedia(buffer: Buffer, filename: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', buffer, {
        filename,
        contentType: 'application/pdf',
      });
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', 'document'); // changed from application/pdf to document? Actually 'type' is not strictly required. Wait, per Graph API docs it's type='document' or not needed.

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...formData.getHeaders(),
          },
        },
      );

      return response.data.id;
    } catch (error) {
      this.logger.error(
        'Error uploading media to WhatsApp',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async sendPaymentReceiptTemplate(
    toPhoneNumber: string,
    customerName: string,
    receiptNo: string,
    amount: string,
    purpose: string,
    mediaId: string,
    filename: string,
  ): Promise<any> {
    // Add 91 if it's a 10 digit number and doesn't start with country code
    let formattedNumber = toPhoneNumber;
    if (formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'sales_receipt_notification',
            language: {
              code: 'en',
            },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'document',
                    document: {
                      id: mediaId,
                      filename: filename,
                    },
                  },
                ],
              },
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: customerName, // {{1}}
                  },
                  {
                    type: 'text',
                    text: receiptNo, // {{2}}
                  },
                  {
                    type: 'text',
                    text: amount, // {{3}}
                  },
                  {
                    type: 'text',
                    text: purpose, // {{4}}
                  },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error sending WhatsApp template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
