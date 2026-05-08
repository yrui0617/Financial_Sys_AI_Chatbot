import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      return sendResponse(401, "Unauthorized");
    }

    const { id } = event.context.params;
    const body = await readBody(event);
    const {
      billDescription,
      billAmount,
      billApprovalStatus,
      billPaymentStatus,
      billPayerID,
    } = body;

    console.log("Update request:", { id, body });
    console.log("User context:", user);

    // Check ID
    if (!id) {
      return sendResponse(400, "Bill ID is required");
    }

    const bill = await prisma.bill.findUnique({
      where: { billID: Number(id) },
    });

    if (!bill) {
      return sendResponse(404, "Bill not found");
    }
    
    if (bill.billApprovalStatus === "Approved") {
      return sendResponse(
        403,
        "This bill has been approved and cannot be modified"
      );
    }
    // Allow admins or the bill owner
    const canUpdate =
      user.roles?.includes("Admin") || bill.billCreatorID === user.userID;

    if (!canUpdate) {
      return sendResponse(
        403,
        "Forbidden - You can only update your own bills"
      );
    }

    // Validation
    if (billAmount !== undefined && billAmount <= 0) {
      return sendResponse(400, "Amount must be greater than 0");
    }

    if (billPayerID !== undefined) {
      const payer = await prisma.user.findUnique({
        where: { userID: Number(billPayerID) },
        select: { userID: true },
      });

      if (!payer) {
        return sendResponse(404, "Bill payer not found");
      }
    }

    // Prepare update data
    const updateData = {};
    if (billDescription !== undefined)
      updateData.billDescription = billDescription?.trim();
    if (billAmount !== undefined) updateData.billAmount = Number(billAmount);
    if (billApprovalStatus !== undefined)
      updateData.billApprovalStatus = billApprovalStatus.trim();
    if (billPaymentStatus !== undefined)
      updateData.billPaymentStatus = billPaymentStatus.trim();
    if (billPayerID !== undefined) updateData.billPayerID = Number(billPayerID);
    console.log("Update data:", updateData);

    // Update
    const updatedBill = await prisma.bill.update({
      where: { billID: Number(id) },
      data: updateData,
    });

    console.log("Updated bill:", updatedBill);

    return sendResponse(200, "Bill updated successfully", updatedBill);
  } catch (error) {
    console.error("Update Bill Error:", error);
    return sendResponse(500, "Internal server error");
  }
});
