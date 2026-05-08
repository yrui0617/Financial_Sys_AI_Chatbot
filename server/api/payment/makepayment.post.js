import Stripe from 'stripe';
import prisma from '~/server/utils/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const billID = Number(body.billID);

  if (!billID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid billID'
    });
  }

  // 1. Get bill + vouchers
  const bill = await prisma.bill.findUnique({
    where: { billID },
    include: {
      vouchers: true
    }
  });

  if (!bill) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Bill not found'
    });
  }

  if (bill.billPaymentStatus === "Paid") {
    throw createError({
      statusCode: 400,
      statusMessage: "This bill has already been paid"
    });
  }
  const pendingVoucher = bill.vouchers.find(
    (v) => v.voucherStatus === 'Pending'
  );

  if (pendingVoucher) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please wait for voucher approval or rejection before payment"
    });
  }
    
  
  // 2. Find approved voucher (optional)
  const validVoucher = bill.vouchers.find(
    (v) => v.voucherStatus === 'Approved'
  );

  const discount = validVoucher
    ? Number(validVoucher.voucherAmount)
    : 0;

  // 3. Calculate final amount
  const finalAmount = Number(bill.billAmount) - discount;

  const amountToPay = Math.max(finalAmount, 0);

  // 4. Base URL (fallback for safety)
  const baseUrl = process.env.APP_URL;

  // 5. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],

    line_items: [
      {
        price_data: {
          currency: 'myr',

          product_data: {
            name: bill.billDescription
          },

          unit_amount: Math.round(amountToPay * 100)
        },
        quantity: 1
      }
    ],

    mode: 'payment',

    success_url: `${baseUrl}/payment_success?billID=${bill.billID}`,
    cancel_url: `${baseUrl}/bill`
  });

  // 6. Return response (SAFE VERSION)
  return {
    url: session.url,
    amountToPay,
    discountApplied: discount,
    hasVoucher: !!validVoucher
  };
});