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
    let payments = [];

    if (roles.includes("Staff")) {
      payments = await prisma.payment.findMany({
        where: {
          paymentBill: {
            billCreatorID: userID
          }
        },
        include: {
          paymentBill: true,
          paymentPayer: true
        }
      });
    }else if (roles.includes("User")) {
      payments = await prisma.payment.findMany({
        where: {
          paymentPayerID: userID,
        },
      });
    }

    return {
      statusCode: 200,
      message: "Success",
      data: payments,
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      message: "Internal server error"+(error.message || ""),
    };
  }
});