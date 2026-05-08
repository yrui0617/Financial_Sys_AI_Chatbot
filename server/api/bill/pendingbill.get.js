import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    
    const userID = event.context.user?.userID;
    if (!userID) {
      return sendResponse(401, "Unauthorized");
    }

    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { billApprovalStatus: "pending" },
          { billApprovalStatus: "Pending" },
          { billApprovalStatus: "PENDING" }
        ]
      },
      orderBy: {
        billCreatedDate: "desc"
      },
    });

    return {
      statusCode: 200,
      message: "Success",
      data: bills,
    };

  } catch (error) {
    console.error("Error fetching pending bills:", error);

    return {
      statusCode: 500,
      message: "Internal server error",
      error: error.message
    };
  }
});
