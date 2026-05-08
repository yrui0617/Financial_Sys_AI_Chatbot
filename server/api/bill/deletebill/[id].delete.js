import prisma from "@/server/utils/prisma";
import { sendResponse } from "@/server/utils/response";

export default defineEventHandler(async (event) => {
  try {
    const userID = event.context.user?.userID;
    if (!userID) {
      return sendResponse(401, "Unauthorized");
    }

    const id = Number(event.context.params.id);

    if (!id) {
      return sendResponse(400, "Bill ID is required");
    }

    const bill = await prisma.bill.findUnique({
      where: { billID: Number(id) },
    });

    if (!bill || bill.billCreatorID !== userID) {
      return sendResponse(404, "Bill not found");
    }

    await prisma.bill.delete({
      where: { billID: Number(id) },
    });

    return sendResponse(200, "Bill deleted successfully");
  } catch (error) {
    if (error.code === "P2003") {
      return sendResponse(
        400,
        "Cannot delete this bill because it is linked to vouchers or payments."
      );
    }
    console.error(error);
    return sendResponse(500, "Internal server error: " + error.message);
  }
});