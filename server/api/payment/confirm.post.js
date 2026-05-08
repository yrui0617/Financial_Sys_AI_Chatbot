import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const billID = Number(body.billID);

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

  // find approved voucher
  const voucher = bill.vouchers.find(
    (v) => v.voucherStatus === 'Approved'
  );

  const discount = voucher ? Number(voucher.voucherAmount) : 0;

  const finalAmount = Number(bill.billAmount) - discount;

  // create payment record
  await prisma.payment.create({
    data: {
      paymentDescription: bill.billDescription,
      paymentAmount: finalAmount > 0 ? finalAmount : 0, // 🔥 FIXED

      paymentStatus: 'Success',
      paymentPaidAt: new Date(),
      paymentTransactionID: 'STRIPE_SIM_' + Date.now(),

      paymentBillID: bill.billID,
      paymentPayerID: bill.billPayerID
    }
  });

  // update bill
  await prisma.bill.update({
    where: { billID },
    data: {
      billPaymentStatus: 'Paid'
    }
  });

  return {
    success: true,
    originalAmount: bill.billAmount,
    discount,
    finalAmount,
    bill: {
    billID: bill.billID,
    billDescription: bill.billDescription,
    billAmount: finalAmount
  }
  };
});