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
      return sendResponse(400, "Voucher ID is required");
    }

    const voucher = await prisma.voucher.findUnique({
      where: { voucherID: Number(id) },
    });

    if (!voucher || voucher.voucherCreatorID !== userID) {
      return sendResponse(404, "Voucher not found");
    }

    await prisma.voucher.delete({
      where: { voucherID: Number(id) },
    });

    return sendResponse(200, "Voucher deleted successfully");
  } catch (error) {
    console.error(error);
    return sendResponse(500, "Internal server error");
  }
});