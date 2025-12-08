# Service Payment Collection - Changes Summary

## Overview
Added new fields and functionality for payment sessions, payment types, vehicle numbers, and payment status tracking.

## Database Changes (schema.prisma)

### New Fields Added to ServicePaymentCollection:
- `totalAmt` (Float?) - Total amount for full payments
- `paymentType` (String) - "full payment" or "part payment" (default: "full payment")
- `paymentStatus` (String) - "pending" or "completed" (default: "completed")
- `vehicleNumber` (String?) - Vehicle registration number (mandatory for part payments)
- `paymentSessions` (Json) - Array storing previous part payment sessions (default: [])

## Backend Changes

### 1. Service (service-payment-collection.service.ts)
**create() method:**
- Accepts new fields: totalAmt, paymentType, paymentStatus, vehicleNumber
- Auto-sets paymentStatus to "pending" for part payments
- For full payments with vehicleNumber:
  - Finds all pending part payments for same customer and vehicle
  - Stores them in paymentSessions array
  - Updates those part payments status to "completed"

**update() method:**
- Updated to accept new fields in parameters

### 2. Controller (service-payment-collection.controller.ts)
- Updated DTOs to include new fields in create and update endpoints

## Frontend Changes

### 1. Form State (ServicePaymentCollection.jsx)
**Added to formData:**
- totalAmt: ""
- paymentType: "full payment"
- vehicleNumber: ""

### 2. Data Mapping
**Updated fetchPayments() and fetchDeletedPayments():**
- Maps totalAmt, paymentType, paymentStatus, vehicleNumber, paymentSessions

### 3. Table Columns
**Added new columns:**
- Payment Type
- Status
- Vehicle No
- Total Amt

### 4. Form Fields in Modal
**New fields added:**
1. **Payment Type** (required) - Dropdown: "full payment" / "part payment"
2. **Vehicle Number** - Text input (mandatory if part payment, uppercase)
3. **Total Amount** - Number input (only shown for full payment)
4. **Payment Sessions Display** - Shows previous part payments when editing full payment

### 5. Validation
- Vehicle number is mandatory for part payments
- Shows error toast if part payment submitted without vehicle number

### 6. Submit Logic
- Sends totalAmt only for full payments
- Sends vehicleNumber if provided
- Sends paymentType to backend

## Migration Steps

### 1. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_payment_fields
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Restart Backend Server
```bash
npm run start:dev
```

### 4. Frontend (No additional steps needed)
The frontend changes are already in place.

## Usage Flow

### Part Payment Flow:
1. Select customer
2. Click "Pay"
3. Select "Part Payment" as payment type
4. Enter vehicle number (mandatory)
5. Enter received amount
6. Submit - Status will be "pending"

### Full Payment Flow:
1. Select customer
2. Click "Pay"
3. Select "Full Payment" as payment type
4. Optionally enter vehicle number
5. Optionally enter total amount
6. Enter received amount
7. If vehicle number matches pending part payments:
   - Previous part payments will be shown in payment sessions
   - Those part payments will be marked as "completed"
8. Submit - Status will be "completed"

## Key Features

1. **Part Payment Tracking**: Track partial payments with pending status
2. **Vehicle-Based Linking**: Link payments by vehicle number
3. **Auto-Completion**: Part payments auto-complete when full payment is made
4. **Payment History**: View payment sessions in full payment records
5. **Flexible Total Amount**: Optional total amount field for full payments
6. **Mandatory Validation**: Vehicle number required for part payments

## Testing Checklist

- [ ] Create part payment with vehicle number
- [ ] Verify part payment shows "pending" status
- [ ] Create full payment with same vehicle number
- [ ] Verify part payment status changes to "completed"
- [ ] Verify payment sessions appear in full payment record
- [ ] Test validation: part payment without vehicle number
- [ ] Test edit functionality with new fields
- [ ] Verify table displays all new columns
- [ ] Test print receipt with new fields
