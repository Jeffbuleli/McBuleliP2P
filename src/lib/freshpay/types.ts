/** FreshPay / PayDRC gateway — normalized types (provider-agnostic at wallet layer). */

export type FreshpayAction = "debit" | "credit" | "verify";

export type FreshpayInitResponse = {
  Amount?: number;
  Comment?: string;
  Created_At?: string;
  Currency?: string;
  Customer_Number?: string;
  Reference?: string;
  Status?: string;
  Transaction_id?: string;
  Updated_At?: string;
  resultCode?: number;
  resultCodeDescription?: string;
  resultCodeError?: number;
  resultCodeErrorDescription?: string;
};

export type FreshpayVerifyResponse = {
  Action?: string;
  Amount?: number;
  Comment?: string;
  Created_at?: string;
  Currency?: string;
  Customer_Details?: string;
  Financial_Institution_id?: string;
  Method?: string;
  Reference?: string;
  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;
  Transaction_id?: string;
  Updated_at?: string;
  PayDRC_Reference?: string;
  Status_Description?: string;
};

export type FreshpayCallbackPayload = FreshpayVerifyResponse;

export type FreshpayTxStatus = "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
