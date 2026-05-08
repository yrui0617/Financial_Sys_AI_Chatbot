import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    
    const userID = event.context.user?.userID;
    if (!userID) {
      return sendResponse(401, "Unauthorized");
    }

    const vouchers = await prisma.voucher.findMany({
      where: {
        OR: [
          { voucherStatus: "pending" },
          { voucherStatus: "Pending" },
          { voucherStatus: "PENDING" }
        ]
      },
      orderBy: {
        voucherCreatedDate: "desc"
      },
    });

    return {
      statusCode: 200,
      message: "Success",
      data: vouchers,
    };

  } catch (error) {
    console.error("Error fetching pending vouchers:", error);

    return {
      statusCode: 500,
      message: "Internal server error",
      error: error.message
    };
  }
});
