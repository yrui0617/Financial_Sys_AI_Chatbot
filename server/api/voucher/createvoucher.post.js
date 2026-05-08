import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    const userID = event.context.user?.userID;
    if (!userID) {
      return sendResponse(401, "Unauthorized");
    }

    const { voucherDescription, voucherAmount, voucherBillID } = await readBody(event);

    //  Validate input
    if (!voucherDescription || !voucherAmount || !voucherBillID) {
      return sendResponse(400, "Missing required fields");
    }

    if (voucherAmount <= 0) {
      return sendResponse(400, "Amount must be greater than 0");
    }

    //  Check bill exists and belongs to user
    const bill = await prisma.bill.findUnique({
      where: { billID: Number(voucherBillID) },
      include: { vouchers: true },
    });

    if (!bill || bill.billCreatorID !== userID) {
      return sendResponse(404, "Bill not found");
    }
    //  Check bill approval status
    if (bill.billApprovalStatus !== "Approved") {
      return sendResponse(
        400,
        "Cannot create voucher. Bill must be approved first."
      );
    }
    if(bill.billPaymentStatus == "Paid"){
      return sendResponse(
        400,
        "Cannot create voucher. Bill is already paid."
      );
    }
    //  Business rule: voucher cannot exceed bill amount
    const totalVoucherAmount = bill.vouchers.reduce(
      (sum, v) => sum + Number(v.amount),
      0
    );

    if (totalVoucherAmount + Number(voucherAmount) > Number(bill.billAmount)) {
      return sendResponse(
        400,
        "Voucher amount exceeds remaining bill balance"
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        voucherDescription: voucherDescription.trim(),
        voucherAmount: Number(voucherAmount),
        voucherBillID: Number(voucherBillID),
        voucherStatus: "Pending",
        voucherCreatorID: userID,
      },
    });

    return sendResponse(201, "Voucher created successfully", voucher);
  } catch (error) {
    console.error("Create Voucher Error:", error);
    return sendResponse(500, "Internal server error");
  }
});