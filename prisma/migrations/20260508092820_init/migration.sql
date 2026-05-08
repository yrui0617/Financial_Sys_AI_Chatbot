-- CreateTable
CREATE TABLE "audit" (
    "auditID" SERIAL NOT NULL,
    "auditIP" VARCHAR(255),
    "auditURL" VARCHAR(255),
    "auditURLMethod" VARCHAR(255),
    "auditURLPayload" VARCHAR(255),
    "auditCreatedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("auditID")
);

-- CreateTable
CREATE TABLE "lookup" (
    "lookupID" SERIAL NOT NULL,
    "lookupOrder" INTEGER,
    "lookupTitle" VARCHAR(255),
    "lookupRefCode" VARCHAR(255),
    "lookupValue" VARCHAR(255),
    "lookupType" VARCHAR(255),
    "lookupStatus" VARCHAR(255),
    "lookupCreatedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lookupModifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_pkey" PRIMARY KEY ("lookupID")
);

-- CreateTable
CREATE TABLE "role" (
    "roleID" SERIAL NOT NULL,
    "roleName" VARCHAR(255),
    "roleDescription" VARCHAR(255),
    "roleStatus" VARCHAR(255),
    "roleCreatedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "roleModifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("roleID")
);

-- CreateTable
CREATE TABLE "user" (
    "userID" SERIAL NOT NULL,
    "userSecretKey" VARCHAR(255),
    "userUsername" VARCHAR(255),
    "userPassword" VARCHAR(255),
    "userFullName" VARCHAR(255),
    "userEmail" VARCHAR(255),
    "userPhone" VARCHAR(255),
    "userStatus" VARCHAR(255),
    "userCreatedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "userModifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "userrole" (
    "userRoleID" SERIAL NOT NULL,
    "userRoleUserID" INTEGER NOT NULL DEFAULT 0,
    "userRoleRoleID" INTEGER NOT NULL DEFAULT 0,
    "userRoleCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userrole_pkey" PRIMARY KEY ("userRoleID")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "settingID" SERIAL NOT NULL,
    "siteName" VARCHAR(255),
    "siteNameFontSize" INTEGER DEFAULT 18,
    "siteDescription" TEXT,
    "siteLogo" VARCHAR(500),
    "siteLoadingLogo" VARCHAR(500),
    "siteFavicon" VARCHAR(500),
    "showSiteNameInHeader" BOOLEAN DEFAULT true,
    "primaryColor" VARCHAR(50),
    "secondaryColor" VARCHAR(50),
    "successColor" VARCHAR(50),
    "infoColor" VARCHAR(50),
    "warningColor" VARCHAR(50),
    "dangerColor" VARCHAR(50),
    "customCSS" TEXT,
    "themeMode" VARCHAR(50),
    "customThemeFile" VARCHAR(500),
    "currentFont" VARCHAR(255),
    "fontSource" VARCHAR(500),
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "seoAuthor" VARCHAR(255),
    "seoOgImage" VARCHAR(500),
    "seoTwitterCard" VARCHAR(50) DEFAULT 'summary_large_image',
    "seoCanonicalUrl" VARCHAR(500),
    "seoRobots" VARCHAR(100) DEFAULT 'index, follow',
    "seoGoogleAnalytics" VARCHAR(255),
    "seoGoogleTagManager" VARCHAR(255),
    "seoFacebookPixel" VARCHAR(255),
    "settingCreatedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "settingModifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "siteLoginLogo" VARCHAR(500),

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("settingID")
);

-- CreateTable
CREATE TABLE "bill" (
    "billID" SERIAL NOT NULL,
    "billDescription" VARCHAR(255) NOT NULL,
    "billAmount" DECIMAL(10,2) NOT NULL,
    "billCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billApprovalStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "billPaymentStatus" VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    "billCreatorID" INTEGER NOT NULL,
    "billPayerID" INTEGER NOT NULL,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("billID")
);

-- CreateTable
CREATE TABLE "voucher" (
    "voucherID" SERIAL NOT NULL,
    "voucherDescription" VARCHAR(255) NOT NULL,
    "voucherAmount" DECIMAL(10,2) NOT NULL,
    "voucherCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voucherStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "voucherBillID" INTEGER NOT NULL,
    "voucherCreatorID" INTEGER NOT NULL,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("voucherID")
);

-- CreateTable
CREATE TABLE "payment" (
    "paymentID" SERIAL NOT NULL,
    "paymentDescription" VARCHAR(255) NOT NULL,
    "paymentAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "paymentTransactionID" VARCHAR(255),
    "paymentCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentPaidAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "paymentBillID" INTEGER NOT NULL,
    "paymentPayerID" INTEGER NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("paymentID")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userrole_userRoleRoleID_idx" ON "userrole"("userRoleRoleID");

-- CreateIndex
CREATE INDEX "userrole_userRoleUserID_idx" ON "userrole"("userRoleUserID");

-- CreateIndex
CREATE INDEX "bill_billCreatorID_idx" ON "bill"("billCreatorID");

-- CreateIndex
CREATE INDEX "bill_billPayerID_idx" ON "bill"("billPayerID");

-- CreateIndex
CREATE INDEX "voucher_voucherBillID_idx" ON "voucher"("voucherBillID");

-- CreateIndex
CREATE INDEX "voucher_voucherCreatorID_idx" ON "voucher"("voucherCreatorID");

-- CreateIndex
CREATE INDEX "payment_paymentBillID_idx" ON "payment"("paymentBillID");

-- CreateIndex
CREATE INDEX "payment_paymentPayerID_idx" ON "payment"("paymentPayerID");

-- CreateIndex
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");

-- AddForeignKey
ALTER TABLE "userrole" ADD CONSTRAINT "FK_userrole_role" FOREIGN KEY ("userRoleRoleID") REFERENCES "role"("roleID") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "userrole" ADD CONSTRAINT "FK_userrole_user" FOREIGN KEY ("userRoleUserID") REFERENCES "user"("userID") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_billCreatorID_fkey" FOREIGN KEY ("billCreatorID") REFERENCES "user"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_billPayerID_fkey" FOREIGN KEY ("billPayerID") REFERENCES "user"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_voucherBillID_fkey" FOREIGN KEY ("voucherBillID") REFERENCES "bill"("billID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_voucherCreatorID_fkey" FOREIGN KEY ("voucherCreatorID") REFERENCES "user"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_paymentBillID_fkey" FOREIGN KEY ("paymentBillID") REFERENCES "bill"("billID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_paymentPayerID_fkey" FOREIGN KEY ("paymentPayerID") REFERENCES "user"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
