import type {
  ReceiptCategoryMatch,
  ReceiptMessageFamily,
  ReceiptParserStatus,
  ReceiptPreviewItem,
  TransactionCategoryOption,
  TransactionType,
} from "@/lib/types/finance";

type ParsedReceiptBlock = {
  rawText: string;
  type: TransactionType;
  messageFamily: ReceiptMessageFamily;
  messageFamilyLabel: string;
  merchantName: string;
  amount: number;
  currency: string;
  transactionDate: string;
  transactionTime: string | null;
  paymentMethod: string | null;
  parserStatus: ReceiptParserStatus;
  parserConfidence: number;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  note?: string | null;
};

const familyLabels: Record<ReceiptMessageFamily, string> = {
  purchase_international_online: "Intl online purchase",
  purchase_international_pos: "Intl POS purchase",
  purchase_pos: "POS purchase",
  purchase_online: "Online purchase",
  transfer_inbound: "Inbound transfer",
  transfer_outbound: "Outbound transfer",
  unknown: "Unknown pattern",
};

export function parseReceiptBatchText(
  rawInput: string,
  categories: TransactionCategoryOption[],
): ParsedReceiptBlock[] {
  const normalized = normalizeReceiptText(rawInput);
  const blocks = splitReceiptBlocks(normalized);

  return blocks
    .map((block) => parseReceiptBlock(block, categories))
    .filter((item): item is ParsedReceiptBlock => item !== null);
}

export function buildReceiptPreviewItem(
  receipt: {
    id: string;
    raw_text: string;
    parsed_merchant_name: string | null;
    parsed_amount: number | null;
    parsed_currency: string | null;
    parsed_transaction_date: string | null;
    parsed_transaction_time: string | null;
    parsed_category_name: string | null;
    parser_status: ReceiptParserStatus;
    parser_confidence: number | null;
  },
  categories: TransactionCategoryOption[],
  forcedType?: TransactionType,
): ReceiptPreviewItem {
  const reparsed = parseReceiptBlock(receipt.raw_text, categories);
  const type = forcedType ?? reparsed?.type ?? "expense";
  const rawAmount = receipt.parsed_amount ?? reparsed?.amount ?? 0;
  const rawCurrency = receipt.parsed_currency ?? reparsed?.currency ?? "SAR";
  const converted = convertReceiptAmountToSar(rawAmount, rawCurrency);
  const originalAmount =
    converted.originalAmount ??
    (reparsed && reparsed.currency !== "SAR" ? reparsed.amount : null);
  const originalCurrency =
    converted.originalCurrency ??
    (reparsed && reparsed.currency !== "SAR" ? reparsed.currency : null);
  const suggestedCategory = matchSuggestedCategory(
    receipt.parsed_category_name,
    type,
    receipt.parsed_merchant_name,
    categories,
  );

  return {
    id: receipt.id,
    rawText: receipt.raw_text,
    type,
    merchantName:
      receipt.parsed_merchant_name ?? reparsed?.merchantName ?? "Needs review",
    amount: converted.amount,
    currency: converted.currency,
    originalAmount,
    originalCurrency,
    transactionDate:
      receipt.parsed_transaction_date ?? reparsed?.transactionDate ?? "",
    transactionTime:
      normalizeReceiptTime(receipt.parsed_transaction_time) ??
      reparsed?.transactionTime ??
      null,
    parserStatus: receipt.parser_status,
    parserConfidence:
      receipt.parser_confidence ?? reparsed?.parserConfidence ?? 35,
    suggestedCategoryId: suggestedCategory.id,
    suggestedCategoryName: suggestedCategory.name,
    messageFamily: reparsed?.messageFamily ?? "unknown",
    messageFamilyLabel: reparsed?.messageFamilyLabel ?? familyLabels.unknown,
    note: reparsed?.note ?? null,
  };
}

export function convertReceiptAmountToSar(amount: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();
  const roundedAmount = Math.round(amount * 100) / 100;

  if (normalizedCurrency === "USD") {
    return {
      amount: Math.round(roundedAmount * 3.75 * 100) / 100,
      currency: "SAR",
      originalAmount: roundedAmount,
      originalCurrency: "USD",
    };
  }

  return {
    amount: roundedAmount,
    currency: normalizedCurrency || "SAR",
    originalAmount: null,
    originalCurrency: null,
  };
}

function normalizeReceiptTime(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return value;
  }

  return `${match[1]}:${match[2]}`;
}

export function parseReceiptDateTime(value: string) {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const [, day, month, year, hour, minute] = match;

  return {
    transactionDate: `20${year}-${month}-${day}`,
    transactionTime: `${hour}:${minute}`,
  };
}

function parseReceiptBlock(
  rawBlock: string,
  categories: TransactionCategoryOption[],
): ParsedReceiptBlock | null {
  const normalizedLines = rawBlock
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalizedLines.length === 0) {
    return null;
  }

  const header = normalizedLines[0];
  const type = detectTransactionType(header);
  const messageFamily = detectMessageFamily(header);

  if (!type || messageFamily === "unknown") {
    const categoryMatch = suggestCategory(
      "Needs review",
      "expense",
      "unknown",
      categories,
    );

    return {
      rawText: rawBlock,
      type: "expense",
      messageFamily: "unknown",
      messageFamilyLabel: familyLabels.unknown,
      merchantName: "Needs review",
      amount: 0,
      currency: "SAR",
      transactionDate: "",
      transactionTime: null,
      paymentMethod: findPaymentMethod(normalizedLines),
      parserStatus: "failed",
      parserConfidence: 35,
      suggestedCategoryId: categoryMatch.id,
      suggestedCategoryName: categoryMatch.name,
      note: null,
    };
  }

  const amountMatch = findAmountAndCurrency(normalizedLines);
  const dateTimeMatch = findDateAndTime(normalizedLines);
  const merchantName = findMerchantOrCounterparty(normalizedLines, messageFamily);
  const paymentMethod = findPaymentMethod(normalizedLines);
  const categoryMatch = suggestCategory(
    merchantName,
    type,
    messageFamily,
    categories,
  );

  const parserStatus =
    amountMatch && dateTimeMatch && merchantName ? "parsed" : "failed";
  const parserConfidence =
    amountMatch && dateTimeMatch && merchantName
      ? 92
      : amountMatch || dateTimeMatch || merchantName
        ? 66
        : 35;

  return {
    rawText: rawBlock,
    type,
    messageFamily,
    messageFamilyLabel: familyLabels[messageFamily],
    merchantName: merchantName ?? "Needs review",
    amount: amountMatch?.amount ?? 0,
    currency: amountMatch?.currency ?? "SAR",
    transactionDate: dateTimeMatch?.transactionDate ?? "",
    transactionTime: dateTimeMatch?.transactionTime ?? null,
    paymentMethod,
    parserStatus,
    parserConfidence,
    suggestedCategoryId: categoryMatch.id,
    suggestedCategoryName: categoryMatch.name,
    note: buildParserNote(messageFamily, normalizedLines),
  };
}

function normalizeReceiptText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitReceiptBlocks(input: string) {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (current.length > 0 && isReceiptHeader(line)) {
      blocks.push(current.join("\n"));
      current = [line];
      continue;
    }

    current.push(line);

    if (/^في[: ]?\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}$/.test(line)) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }

  return blocks;
}

function isReceiptHeader(line: string) {
  return (
    line.startsWith("شراء") ||
    line.startsWith("حوالة واردة") ||
    line.startsWith("حوالة صادرة")
  );
}

function detectTransactionType(header: string): TransactionType | null {
  if (header.startsWith("شراء")) return "expense";
  if (header.startsWith("حوالة واردة")) return "income";
  if (header.startsWith("حوالة صادرة")) return "expense";
  return null;
}

function detectMessageFamily(header: string): ReceiptMessageFamily {
  if (header.includes("شراء عبر الانترنت - دولي")) return "purchase_international_online";
  if (header.includes("شراء عبر نقاط البيع دولية")) return "purchase_international_pos";
  if (header.includes("شراء-POS")) return "purchase_pos";
  if (header.includes("شراء انترنت")) return "purchase_online";
  if (header.includes("حوالة واردة داخلية")) return "transfer_inbound";
  if (header.includes("حوالة صادرة داخلية")) return "transfer_outbound";
  return "unknown";
}

function findAmountAndCurrency(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/(?:بمبلغ|بـ|مبلغ:)\s*([\d.]+)\s*([A-Z]{3})/);
    if (match) {
      return { amount: Number(match[1]), currency: match[2].toUpperCase() };
    }
  }
  return null;
}

function findDateAndTime(lines: string[]) {
  for (const line of lines) {
    const parsed = parseReceiptDateTime(line);
    if (parsed) return parsed;
  }
  return null;
}

function findMerchantOrCounterparty(lines: string[], family: ReceiptMessageFamily) {
  if (family === "transfer_outbound") {
    const recipient = lines.find(
      (line) =>
        line.startsWith("إلى:") &&
        !/\*\d+/.test(line.replace("إلى:", "").trim()),
    );
    if (recipient) return recipient.replace("إلى:", "").trim();
  }

  if (family === "transfer_inbound") {
    const sender = lines.find((line) => line.startsWith("مرسل:"));
    if (sender) return sender.replace("مرسل:", "").trim();
  }

  const merchantLine = lines.find((line) => {
    if (!line.startsWith("من")) return false;
    const normalized = line.replace(/^من[: ]*/, "").trim();
    if (!normalized) return false;
    if (/^\d+\*$/.test(normalized)) return false;
    return true;
  });

  return merchantLine ? merchantLine.replace(/^من[: ]*/, "").trim() : null;
}

function findPaymentMethod(lines: string[]) {
  const paymentLine = lines.find(
    (line) =>
      line.includes("بطاقة مدى") ||
      line.includes("مدى-ابل") ||
      line.includes("مدى-ابل*") ||
      line.includes("مدى-ابل *"),
  );
  return paymentLine ?? null;
}

function buildParserNote(family: ReceiptMessageFamily, lines: string[]) {
  if (
    family === "purchase_international_online" ||
    family === "purchase_international_pos"
  ) {
    const countryLine = lines.find(
      (line) =>
        line.startsWith("في ") &&
        !/^في[: ]?\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}$/.test(line),
    );
    return countryLine ?? null;
  }

  if (family === "purchase_online") {
    const sourceLine = lines.find((line) => line.startsWith("من TABBY"));
    return sourceLine ?? null;
  }

  return null;
}

function suggestCategory(
  merchantName: string | null,
  type: TransactionType,
  family: ReceiptMessageFamily,
  categories: TransactionCategoryOption[],
): ReceiptCategoryMatch {
  if (family === "transfer_inbound") {
    return matchSuggestedCategory("Gift", type, merchantName, categories);
  }
  if (family === "transfer_outbound") {
    return matchSuggestedCategory("Other", type, merchantName, categories);
  }

  const normalized = (merchantName ?? "").toUpperCase();
  if (normalized.includes("SHAWERMER")) {
    return matchSuggestedCategory("Food & Drinks", type, merchantName, categories);
  }
  if (
    normalized.includes("SPOTIFY") ||
    normalized.includes("STEAMGAME") ||
    normalized.includes("OPENAI")
  ) {
    return matchSuggestedCategory("Entertainment", type, merchantName, categories);
  }

  return matchSuggestedCategory("Other", type, merchantName, categories);
}

function matchSuggestedCategory(
  suggestedName: string | null | undefined,
  type: TransactionType,
  merchantName: string | null | undefined,
  categories: TransactionCategoryOption[],
): ReceiptCategoryMatch {
  const normalizedSuggested = suggestedName?.toLowerCase().trim();
  const exactMatch = categories.find(
    (category) =>
      category.type === type &&
      category.name.toLowerCase().trim() === normalizedSuggested,
  );
  if (exactMatch) return { id: exactMatch.id, name: exactMatch.name };

  const fallback = categories.find(
    (category) => category.type === type && category.name.toLowerCase() === "other",
  );
  if (fallback) return { id: fallback.id, name: fallback.name };

  const firstOfType = categories.find((category) => category.type === type);
  return {
    id: firstOfType?.id ?? "",
    name: firstOfType?.name ?? merchantName ?? "Other",
  };
}
