import prisma from "@/server/utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const userID = event.context.user?.userID;
    
    if (!userID) {
      return {
        statusCode: 401,
        message: "Unauthorized",
      };
    }

    const roles = event.context.user?.roles || [];
    let where = {};

    if (roles.includes("Staff")) {
      where = {
        voucherCreatorID: userID,
      };
    } else if (roles.includes("User")) {
      where = {
        voucherBill: {
          billPayerID: userID,
        },
      };
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        voucherBill: true,
      },
      orderBy: {
        voucherCreatedDate: "desc",
      },
    });

    return {
      statusCode: 200,
      message: "Success",
      data: vouchers,
    };
  } catch (error) {
    console.error("Voucher API Error:", error);

    return sendResponse(
      500,
      error.message || "Internal server error"
    );
  }
});