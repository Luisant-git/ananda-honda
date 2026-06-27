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


  async sendServiceReceiptTemplate(
    toPhoneNumber: string,
    customerName: string,
    receiptNo: string,
    jobCardNumber: string | number,
    amount: string | number,
    mediaId: string,
    filename: string,
  ): Promise<any> {
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
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
            name: 'service_receipt_notification',
            language: { code: 'en' },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'document',
                    document: { id: mediaId, filename },
                  },
                ],
              },
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: String(customerName) },
                  { type: 'text', text: String(receiptNo) },
                  { type: 'text', text: String(jobCardNumber) },
                  { type: 'text', text: String(amount) },
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
    } catch (error: any) {
      this.logger.error(
        'Error sending WhatsApp service receipt template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // NEW: Send Service Reminder Template (Only 4 parameters)
async sendServiceReminderTemplate(
  toPhoneNumber: string,
  customerName: string,      // {{1}}
  vehicleModel: string,      // {{2}}
  registrationNo: string,    // {{3}}
  serviceName: string,       // {{4}}
): Promise<any> {
  let formattedNumber = toPhoneNumber.trim();
  if (/^\d{10}$/.test(formattedNumber)) {
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
          name: 'service_remainder_template',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName },      // {{1}} - Customer Name
                { type: 'text', text: vehicleModel },      // {{2}} - Vehicle Model
                { type: 'text', text: registrationNo },    // {{3}} - Registration Number
                { type: 'text', text: serviceName },       // {{4}} - Service Name
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
    this.logger.log(`Service reminder template sent to ${formattedNumber}`);
    return response.data;
  } catch (error: any) {
    this.logger.error(
      'Error sending WhatsApp service reminder template',
      error.response?.data || error.message,
    );
    throw error;
  }
}

  // Optional: Send simple text message (as fallback)
  async sendTextMessage(toPhoneNumber: string, message: string): Promise<any> {
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Text message sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error sending text message',
        error.response?.data || error.message,
      );
      throw error;
    }
  }


  // Send Service Welcome Template (service_welcome_v1)
  async sendServiceWelcomeTemplate(
    toPhoneNumber: string,
    customerName: string,            // {{1}}
    serviceAdvisorPhone: string,     // {{2}}
  ): Promise<any> {
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }
    // Ensure template parameters are non-empty — WhatsApp API rejects missing text values
    const advisorPhone = (serviceAdvisorPhone && String(serviceAdvisorPhone).trim()) || process.env.SERVICE_ADVISOR_PHONE || '9108812221';
    const custName = (customerName && String(customerName).trim()) || 'Customer';

    // Normalize advisor phone for template display — include +91 when 10 digits provided
    let formattedAdvisor = String(advisorPhone).replace(/[^0-9]/g, '');
    if (/^\d{10}$/.test(formattedAdvisor)) {
      formattedAdvisor = `+91${formattedAdvisor}`;
    } else if (/^91\d{10}$/.test(formattedAdvisor)) {
      formattedAdvisor = `+${formattedAdvisor}`;
    } else {
      // leave as-is (e.g., already has + or other format)
      formattedAdvisor = String(advisorPhone);
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'service_welcome_v1',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: String(custName) },
                  { type: 'text', text: String(formattedAdvisor) },
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

      this.logger.log(`Service welcome template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error sending service welcome template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}