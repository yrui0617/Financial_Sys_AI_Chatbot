import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    const userID = event.context.user?.userID;
    if (!userID) {
      return sendResponse(401, "Unauthorized");
    }

    const { billDescription, billAmount, billPayerID } = await readBody(event);
    const amount = Number(billAmount);
    const payerID = Number(billPayerID);

    // Validation (prevent nonsense data)
    if (!billDescription || !amount || !payerID) {
      return sendResponse(400, "Missing required fields");
    }

    if (Number.isNaN(amount) || amount <= 0) {
      return sendResponse(400, "Amount must be greater than 0");
    }

    if (!Number.isInteger(payerID) || payerID <= 0) {
      return sendResponse(400, "Invalid payer ID");
    }

    const payer = await prisma.user.findUnique({
      where: { userID: payerID },
      select: {
        userID: true,
        userrole: {
          select: {
            role: {
              select: {
                roleName: true,
              },
            },
          },
        },
      },
    });

    if (!payer) {
      return sendResponse(404, "Bill payer not found");
    }

    const blockedRoles = ["developer", "admin", "staff"];
    const payerRoles = payer.userrole.map((userRole) =>
      userRole.role.roleName?.toLowerCase()
    );

    if (payerRoles.some((roleName) => blockedRoles.includes(roleName))) {
      return sendResponse(
        400,
        "Bill payer cannot be a Developer, Admin, or Staff"
      );
    }

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        billDescription: billDescription.trim(),
        billAmount: amount,
        billApprovalStatus: "Pending",
        billPaymentStatus: "Unpaid",
        billCreatorID: userID,
        billPayerID: payerID,
      },
    });

    return sendResponse(201, "Bill created successfully", bill);
  } catch (error) {
    console.error("Create Bill Error:", error);
    return sendResponse(500, "Internal server error");
  }
});
