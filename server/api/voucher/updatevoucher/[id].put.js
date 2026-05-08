import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      return sendResponse(401, "Unauthorized");
    }

    const { id } = event.context.params;
    const { voucherDescription, voucherAmount, voucherStatus, voucherBillID } = await readBody(event);

    const voucherId = Number(id);
    if (!voucherId || isNaN(voucherId)) {
      return sendResponse(400, "Invalid voucher ID");
    }

    const voucher = await prisma.voucher.findUnique({
      where: { voucherID: voucherId },
    });

    if (!voucher) {
      return sendResponse(404, "Voucher not found");
    }

    if (voucher.voucherStatus === "Approved") {
      return sendResponse(
        403,
        "This voucher has been approved and cannot be modified"
      );
    }
    // ✅ permission
    const canUpdate =
      user.roles?.includes('Admin') ||
      voucher.voucherCreatorID === user.userID;

    if (!canUpdate) {
      return sendResponse(403, "Forbidden");
    }

    // ✅ parse amount safely
    const parsedAmount =
      voucherAmount !== undefined ? Number(voucherAmount) : undefined;

    if (parsedAmount !== undefined &&
        (isNaN(parsedAmount) || parsedAmount <= 0)) {
      return sendResponse(400, "Amount must be greater than 0");
    }

    // ✅ validate bill
    if (voucherBillID) {
      const bill = await prisma.bill.findUnique({
        where: { billID: Number(voucherBillID) },
      });

      if (!bill || bill.billCreatorID !== user.userID) {
        return sendResponse(404, "Bill not found");
      }
    }

    // ✅ check empty update
    if (!voucherDescription && parsedAmount === undefined && !voucherStatus && !voucherBillID) {
      return sendResponse(400, "No fields provided to update");
    }

    const updateData = {};
    if (voucherDescription !== undefined) updateData.voucherDescription = voucherDescription.trim();
    if (parsedAmount !== undefined) updateData.voucherAmount = parsedAmount;
    if (voucherStatus !== undefined) updateData.voucherStatus = voucherStatus;
    if (voucherBillID !== undefined) updateData.voucherBillID = Number(voucherBillID);

    const updatedVoucher = await prisma.voucher.update({
      where: { voucherID: voucherId },
      data: updateData,
    });

    return sendResponse(200, "Voucher updated successfully", updatedVoucher);

  } catch (error) {
    console.error("Update Voucher Error:", error);
    return sendResponse(500, "Internal server error");
  }
});
