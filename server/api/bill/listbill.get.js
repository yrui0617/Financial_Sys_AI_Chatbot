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
    let bills = [];

    if (roles.includes("Staff")) {
      bills = await prisma.bill.findMany({
        where: {
          billCreatorID: userID,
        },
      });
    } else if (roles.includes("User")) {
      bills = await prisma.bill.findMany({
        where: {
          billPayerID: userID,
          billApprovalStatus: 'Approved',
        },
      });
    }


    return {
      statusCode: 200,
      message: "Success",
      data: bills,
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      message: "Internal server error",
    };
  }
});
